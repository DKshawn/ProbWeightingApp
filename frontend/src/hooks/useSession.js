import { useCallback, useRef, useState } from "react";
import {
  completePwfSession,
  createCiSettlement,
  saveCiMirrorResult,
  saveCiResult,
  savePwfResults,
  startSession,
} from "../api/client";

function getStudyModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "pilot" || params.get("study_mode") === "pilot" || params.get("pilot") === "1") {
    return "pilot";
  }
  return "full";
}

function savedTrialNumberSet(savedTrialResults) {
  return new Set(
    (savedTrialResults || [])
      .map((row) => Number(row.trial))
      .filter((trial) => Number.isFinite(trial)),
  );
}

function firstUnansweredTrialIndex(trials, savedTrialResults) {
  const savedTrials = savedTrialNumberSet(savedTrialResults);
  const index = trials.findIndex((trial) => !savedTrials.has(Number(trial.trial)));
  return index < 0 ? trials.length : index;
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildMirrorTrialOrder(trials, sessionId) {
  const order = trials.map((_, index) => index);
  let state = hashSeed(`${sessionId}:ci-mirror-v1`);

  for (let index = order.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  if (order.length > 1 && order.every((trialIndex, index) => trialIndex === index)) {
    order.push(order.shift());
  }

  return order;
}

function firstUnansweredMirrorOrderIndex(mirrorTrialOrder, trials, savedTrialResults) {
  const savedByTrial = new Map(
    (savedTrialResults || []).map((row) => [Number(row.trial), row]),
  );
  const index = mirrorTrialOrder.findIndex((trialIndex) => {
    const trialNumber = Number(trials[trialIndex]?.trial);
    return savedByTrial.get(trialNumber)?.mirror_choice == null;
  });
  return index < 0 ? mirrorTrialOrder.length : index;
}

function stepForTrialResume(trials, trialIndex, mirrorOrderIndex, ciSettlement) {
  if (!trials.length) return 5;
  if (trialIndex >= trials.length) {
    if (mirrorOrderIndex < trials.length) return 10;
    return ciSettlement ? 7 : 9;
  }
  if (trialIndex > 0 && trials[trialIndex]?.block !== trials[trialIndex - 1]?.block) return 6;
  return 1;
}

function upsertPwfRecord(records, nextRecord) {
  const key = `${nextRecord.session_id ?? ""}:${nextRecord.pwf_trial}`;
  const withoutDuplicate = records.filter((record) => `${record.session_id ?? ""}:${record.pwf_trial}` !== key);
  return [...withoutDuplicate, nextRecord].sort((a, b) => Number(a.pwf_trial) - Number(b.pwf_trial));
}

function upsertCiRecord(records, nextRecord) {
  const withoutDuplicate = records.filter((record) => Number(record.trial) !== Number(nextRecord.trial));
  return [...withoutDuplicate, nextRecord].sort((a, b) => Number(a.trial) - Number(b.trial));
}

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [consentVersion, setConsentVersion] = useState("");
  const [consentAcceptedAt, setConsentAcceptedAt] = useState("");
  const [studyMode, setStudyMode] = useState(getStudyModeFromUrl());
  const [experimentMode, setExperimentMode] = useState("normal");
  const [timePressureSeconds, setTimePressureSeconds] = useState(0);
  const [pwfRecords, setPwfRecords] = useState([]);
  const [ciRecords, setCiRecords] = useState([]);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [mirrorTrialOrder, setMirrorTrialOrder] = useState([]);
  const [currentMirrorOrderIndex, setCurrentMirrorOrderIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0=pwf, 1-4=CI steps, 5=finish, 6=block break, 7=PWF settlement, 9=CI settlement, 10=CI randomized comparison
  const [stepData, setStepData] = useState({});
  const [ciSettlement, setCiSettlement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pendingOperationsRef = useRef(0);
  const pwfSessionRef = useRef(null);
  const pwfSessionPromiseRef = useRef(null);
  const pwfSaveQueueRef = useRef(Promise.resolve());
  const pwfSaveFailedRef = useRef(false);

  const currentTrial = trials[currentTrialIndex] ?? null;
  const currentMirrorTrialIndex = mirrorTrialOrder[currentMirrorOrderIndex] ?? null;
  const currentMirrorTrial = currentMirrorTrialIndex == null ? null : trials[currentMirrorTrialIndex] ?? null;
  const currentMirrorRecord = currentMirrorTrial
    ? ciRecords.find((record) => Number(record.trial) === Number(currentMirrorTrial.trial)) ?? null
    : null;
  const totalTrials = trials.length;

  function beginOperation() {
    pendingOperationsRef.current += 1;
    setLoading(true);
  }

  function endOperation() {
    pendingOperationsRef.current = Math.max(0, pendingOperationsRef.current - 1);
    if (pendingOperationsRef.current === 0) {
      setLoading(false);
    }
  }

  function extractPwfEnrollment(message) {
    const sid = String(message?.participant ?? "").trim();
    if (!sid) {
      throw new Error("学籍番号を取得できませんでした");
    }
    const resolvedGender = String(message?.gender ?? "");
    if (!["male", "female"].includes(resolvedGender)) {
      throw new Error("性別を取得できませんでした");
    }
    const resolvedConsentVersion = String(message?.consent_version ?? "").trim();
    const resolvedConsentAcceptedAt = String(message?.consent_accepted_at ?? "").trim();
    if (!resolvedConsentVersion || Number.isNaN(Date.parse(resolvedConsentAcceptedAt))) {
      throw new Error("研究参加への同意を取得できませんでした");
    }
    return {
      studentId: sid,
      gender: resolvedGender,
      consentVersion: resolvedConsentVersion,
      consentAcceptedAt: resolvedConsentAcceptedAt,
    };
  }

  async function ensurePwfSession(message) {
    const enrollment = extractPwfEnrollment(message);
    const sid = enrollment.studentId;
    const requestedStudyMode = getStudyModeFromUrl();
    const currentSession = pwfSessionRef.current;
    if (currentSession?.studentId === sid && currentSession?.studyMode === requestedStudyMode) return currentSession;

    const currentPromise = pwfSessionPromiseRef.current;
    if (currentPromise?.studentId === sid && currentPromise?.studyMode === requestedStudyMode) return currentPromise.promise;

    pwfSaveQueueRef.current = Promise.resolve();
    pwfSaveFailedRef.current = false;

    const sessionName = sid;
    const promise = startSession(sid, sessionName, requestedStudyMode, enrollment)
      .then((data) => {
        const resolvedStudyMode = data.study_mode || requestedStudyMode;
        const resolvedTrials = data.trials || [];
        const savedTrialResults = data.saved_ci_results || [];
        const savedPwfResults = data.saved_pwf_results || [];
        const savedCiSettlement = data.ci_settlement || null;
        const pwfCompleted = Boolean(data.pwf_completed) || savedTrialResults.length > 0;
        const resumeTrialIndex = firstUnansweredTrialIndex(resolvedTrials, savedTrialResults);
        const resolvedMirrorTrialOrder = buildMirrorTrialOrder(resolvedTrials, data.session_id);
        const resumeMirrorOrderIndex = firstUnansweredMirrorOrderIndex(
          resolvedMirrorTrialOrder,
          resolvedTrials,
          savedTrialResults,
        );
        const session = {
          sessionId: data.session_id,
          studentId: sid,
          name: sessionName,
          gender: data.gender || enrollment.gender,
          consentVersion: data.consent_version || enrollment.consentVersion,
          consentAcceptedAt: data.consent_accepted_at || enrollment.consentAcceptedAt,
          studyMode: resolvedStudyMode,
          trials: resolvedTrials,
          experimentMode: data.experiment_mode || "normal",
          timePressureSeconds: data.time_pressure_seconds || 0,
          savedTrialResults,
          savedPwfResults,
          pwfCompleted,
          mirrorTrialOrder: resolvedMirrorTrialOrder,
          resumeMirrorOrderIndex,
        };

        pwfSessionRef.current = session;
        setSessionId(session.sessionId);
        setTrials(session.trials);
        setStudentId(session.studentId);
        setName(session.name);
        setGender(session.gender);
        setConsentVersion(session.consentVersion);
        setConsentAcceptedAt(session.consentAcceptedAt);
        setStudyMode(session.studyMode);
        setExperimentMode(session.experimentMode);
        setTimePressureSeconds(session.timePressureSeconds);
        setPwfRecords(session.savedPwfResults);
        setCiRecords(session.savedTrialResults);
        setCiSettlement(savedCiSettlement);
        setMirrorTrialOrder(session.mirrorTrialOrder);
        setCurrentMirrorOrderIndex(session.resumeMirrorOrderIndex);
        setCurrentTrialIndex(Math.min(resumeTrialIndex, Math.max(resolvedTrials.length - 1, 0)));
        setStepData({});
        if (pwfCompleted) {
          setCurrentStep(stepForTrialResume(
            resolvedTrials,
            resumeTrialIndex,
            session.resumeMirrorOrderIndex,
            savedCiSettlement,
          ));
        }
        return session;
      })
      .finally(() => {
        if (pwfSessionPromiseRef.current?.promise === promise) {
          pwfSessionPromiseRef.current = null;
        }
      });

    pwfSessionPromiseRef.current = { studentId: sid, studyMode: requestedStudyMode, promise };
    return promise;
  }

  function buildPwfRecord(message, session) {
    const record = message?.record;
    if (!record || typeof record !== "object") {
      throw new Error("PWF の記録を取得できませんでした");
    }

    const pwfTrial = Number(record.pwf_trial ?? message?.pwf_trial);
    if (!Number.isFinite(pwfTrial) || pwfTrial < 1) {
      throw new Error("PWF の試行番号を取得できませんでした");
    }

    return {
      ...record,
      session_id: session.sessionId,
      student_id: session.studentId,
      name: session.name,
      gender: session.gender,
      consent_version: session.consentVersion,
      consent_accepted_at: session.consentAcceptedAt,
      study_mode: session.studyMode,
      pwf_trial: pwfTrial,
    };
  }

  function enqueuePwfRecordSave(message) {
    const saveTask = pwfSaveQueueRef.current.then(async () => {
      const session = await ensurePwfSession(message);
      const record = buildPwfRecord(message, session);
      await savePwfResults([record]);
      setPwfRecords((prev) => upsertPwfRecord(prev, record));
    });

    pwfSaveQueueRef.current = saveTask.catch(() => {});
    return saveTask;
  }

  async function handlePwfStart(message) {
    beginOperation();
    setError(null);
    try {
      await ensurePwfSession(message);
    } catch (e) {
      setError(e.message);
    } finally {
      endOperation();
    }
  }

  async function handlePwfRecord(message) {
    beginOperation();
    setError(null);
    try {
      await enqueuePwfRecordSave(message);
    } catch (e) {
      pwfSaveFailedRef.current = true;
      setError(e.message);
    } finally {
      endOperation();
    }
  }

  async function handlePwfComplete(message) {
    beginOperation();
    setError(null);
    try {
      const session = await ensurePwfSession(message);
      await pwfSaveQueueRef.current;
      if (pwfSaveFailedRef.current) {
        throw new Error("PWF 結果の保存に失敗しました");
      }
      await completePwfSession(session.sessionId);
      session.pwfCompleted = true;
      const resumeTrialIndex = firstUnansweredTrialIndex(session.trials, session.savedTrialResults);
      setCurrentTrialIndex(Math.min(resumeTrialIndex, Math.max(session.trials.length - 1, 0)));
      setMirrorTrialOrder(session.mirrorTrialOrder);
      setCurrentMirrorOrderIndex(session.resumeMirrorOrderIndex);
      setStepData({});
      setCurrentStep(stepForTrialResume(
        session.trials,
        resumeTrialIndex,
        session.resumeMirrorOrderIndex,
        null,
      ));
    } catch (e) {
      setError(e.message);
    } finally {
      endOperation();
    }
  }

  function submitStep1(y) {
    setStepData((prev) => ({ ...prev, y }));
    setCurrentStep(2);
  }

  function submitStep2(s) {
    setStepData((prev) => ({ ...prev, s }));
    setCurrentStep(3);
  }

  function submitStep3(yPrime) {
    setStepData((prev) => ({ ...prev, y_prime: yPrime }));
    setCurrentStep(4);
  }

  function advanceAfterStep4() {
    const nextIndex = currentTrialIndex + 1;
    const nextTrial = trials[nextIndex];

    if (nextIndex < totalTrials && nextTrial?.block !== currentTrial?.block) {
      setCurrentTrialIndex(nextIndex);
      setStepData({});
      setCurrentStep(6);
    } else if (nextIndex >= totalTrials) {
      setStepData({});
      setCurrentMirrorOrderIndex(0);
      setCurrentStep(10);
    } else {
      setCurrentTrialIndex(nextIndex);
      setStepData({});
      setCurrentStep(1);
    }
  }

  async function submitStep4(choice, timing = {}) {
    setLoading(true);
    setError(null);
    const trial = currentTrial;
    const N = trial.N;
    const pN = parseFloat((trial.p ** N).toFixed(10));
    const qN = parseFloat((trial.q ** N).toFixed(10));
    const rN = parseFloat((trial.r ** N).toFixed(10));
    const sN = parseFloat((stepData.s ** N).toFixed(10));
    const timedOut = Boolean(timing.timedOut || choice === "Timeout");
    const ciSatisfied = !timedOut && choice === "Indifferent";

    try {
      const record = {
        session_id: sessionId,
        student_id: studentId,
        name,
        gender,
        study_mode: studyMode,
        experiment_mode: experimentMode,
        time_pressure_seconds: timePressureSeconds,
        trial: trial.trial,
        block: trial.block,
        N,
        student_id_last_digit: trial.student_id_last_digit ?? "",
        amount_level: trial.amount_level ?? "low",
        amount_multiplier: trial.amount_multiplier ?? 1,
        p: trial.p,
        q: trial.q,
        r: trial.r,
        x: trial.x,
        x_prime: trial.x_prime,
        y: stepData.y,
        s: stepData.s,
        y_prime: stepData.y_prime,
        pN,
        qN,
        rN,
        sN,
        choice,
        ci_satisfied: ciSatisfied,
        response_time_ms: timing.responseTimeMs ?? null,
        timed_out: timedOut,
        payment_details: {},
        trial_payment_total: 0,
      };
      await saveCiResult(record);
      setCiRecords((previous) => upsertCiRecord(previous, record));
      advanceAfterStep4();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submitMirrorStep4(choice, timing = {}) {
    if (!currentMirrorTrial || !currentMirrorRecord) return false;

    setLoading(true);
    setError(null);
    const timedOut = Boolean(timing.timedOut || choice === "Timeout");
    const mirrorCanonicalChoice = choice === "X" ? "Y" : choice === "Y" ? "X" : choice;
    const mirrorResult = {
      session_id: sessionId,
      trial: currentMirrorTrial.trial,
      mirror_order: currentMirrorOrderIndex + 1,
      mirror_choice: choice,
      mirror_response_time_ms: timing.responseTimeMs ?? null,
      mirror_timed_out: timedOut,
    };

    try {
      await saveCiMirrorResult(mirrorResult);
      setCiRecords((previous) => previous.map((record) => (
        Number(record.trial) === Number(currentMirrorTrial.trial)
          ? {
              ...record,
              ...mirrorResult,
              mirror_left_option: "Y",
              mirror_right_option: "X",
              mirror_canonical_choice: mirrorCanonicalChoice,
              mirror_ci_satisfied: !timedOut && choice === "Indifferent",
            }
          : record
      )));

      const nextMirrorOrderIndex = currentMirrorOrderIndex + 1;
      if (nextMirrorOrderIndex >= mirrorTrialOrder.length) {
        setCurrentStep(9);
      } else {
        setCurrentMirrorOrderIndex(nextMirrorOrderIndex);
      }
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function startNextBlock() {
    setCurrentStep(1);
  }

  function continueToFinish() {
    setCurrentStep(5);
  }

  const loadCiSettlement = useCallback(async () => {
    if (!sessionId || ciSettlement) return;
    pendingOperationsRef.current += 1;
    setLoading(true);
    setError(null);
    try {
      const result = await createCiSettlement(sessionId);
      setCiSettlement(result.settlement);
    } catch (e) {
      setError(e.message);
    } finally {
      pendingOperationsRef.current = Math.max(0, pendingOperationsRef.current - 1);
      if (pendingOperationsRef.current === 0) setLoading(false);
    }
  }, [ciSettlement, sessionId]);

  function continueToPwfSettlement() {
    setCurrentStep(7);
  }

  return {
    studentId,
    gender,
    pwfRecords,
    ciRecords,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    currentMirrorOrderIndex,
    currentMirrorTrial,
    currentMirrorRecord,
    stepData,
    ciSettlement,
    loading,
    error,
    handlePwfStart,
    handlePwfRecord,
    handlePwfComplete,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    submitMirrorStep4,
    startNextBlock,
    loadCiSettlement,
    continueToPwfSettlement,
    continueToFinish,
  };
}
