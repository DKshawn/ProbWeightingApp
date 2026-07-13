import { useCallback, useRef, useState } from "react";
import {
  completePwfSession,
  createCiSettlement,
  createPwfSettlement,
  saveCiResult,
  savePwfComprehensionEvents,
  savePwfResults,
  startSession,
} from "../api/client";

const PWF_FAILED_RECORDS_STORAGE_KEY = "pwf-failed-records";

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

function stepForTrialResume(trials, trialIndex, ciSettlement) {
  if (!trials.length) return 5;
  if (trialIndex >= trials.length) {
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
  const [_consentVersion, setConsentVersion] = useState("");
  const [_consentAcceptedAt, setConsentAcceptedAt] = useState("");
  const [studyMode, setStudyMode] = useState(getStudyModeFromUrl());
  const [experimentMode, setExperimentMode] = useState("normal");
  const [timePressureSeconds, setTimePressureSeconds] = useState(0);
  const [pwfComprehensionRequired, setPwfComprehensionRequired] = useState(false);
  const [pwfRecords, setPwfRecords] = useState([]);
  const [ciRecords, setCiRecords] = useState([]);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0=pwf, 1-4=CI steps, 5=finish, 6=block break, 7=PWF settlement, 9=CI settlement
  const [stepData, setStepData] = useState({});
  const [ciSettlement, setCiSettlement] = useState(null);
  const [pwfSettlement, setPwfSettlement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pwfRecordRetryAvailable, setPwfRecordRetryAvailable] = useState(false);
  const pendingOperationsRef = useRef(0);
  const pwfSessionRef = useRef(null);
  const pwfSessionPromiseRef = useRef(null);
  const pwfSaveQueueRef = useRef(Promise.resolve());
  const pwfSaveFailedRef = useRef(false);
  const failedPwfRecordsRef = useRef(new Map());
  const comprehensionSaveQueueRef = useRef(Promise.resolve());
  const comprehensionSaveFailedRef = useRef(false);
  const comprehensionSaveErrorRef = useRef(null);

  const currentTrial = trials[currentTrialIndex] ?? null;
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

  function pwfRecordRetryKey(message, record = null) {
    const participant = String(
      record?.session_id
      ?? pwfSessionRef.current?.sessionId
      ?? message?.participant
      ?? "",
    ).trim();
    const pwfTrial = Number(record?.pwf_trial ?? message?.record?.pwf_trial ?? message?.pwf_trial);
    return `${participant}:${Number.isFinite(pwfTrial) ? pwfTrial : "unknown"}`;
  }

  function syncPwfRecordRetryState() {
    const hasFailedRecords = failedPwfRecordsRef.current.size > 0;
    pwfSaveFailedRef.current = hasFailedRecords;
    setPwfRecordRetryAvailable(hasFailedRecords);
  }

  function persistFailedPwfRecords(studentId, resolvedStudyMode) {
    try {
      if (!window.sessionStorage) return;
      const records = [...failedPwfRecordsRef.current.entries()].map(([key, entry]) => ({
        key,
        message: entry.message,
      }));
      if (!records.length) {
        window.sessionStorage.removeItem(PWF_FAILED_RECORDS_STORAGE_KEY);
        return;
      }
      window.sessionStorage.setItem(PWF_FAILED_RECORDS_STORAGE_KEY, JSON.stringify({
        studentId: String(studentId ?? ""),
        studyMode: resolvedStudyMode,
        records,
      }));
    } catch {
      // The in-memory retry queue still works when browser storage is unavailable.
    }
  }

  function restoreFailedPwfRecords(studentId, resolvedStudyMode) {
    failedPwfRecordsRef.current.clear();
    try {
      const saved = JSON.parse(window.sessionStorage?.getItem(PWF_FAILED_RECORDS_STORAGE_KEY) || "null");
      if (
        saved?.studentId === String(studentId)
        && saved?.studyMode === resolvedStudyMode
        && Array.isArray(saved.records)
      ) {
        saved.records.forEach((entry) => {
          if (!entry?.key || !entry?.message || typeof entry.message !== "object") return;
          failedPwfRecordsRef.current.set(entry.key, { message: entry.message });
        });
      }
    } catch {
      // Ignore corrupt local state and allow the participant to continue normally.
    }
    syncPwfRecordRetryState();
  }

  function rememberFailedPwfRecord(message, record = null) {
    failedPwfRecordsRef.current.set(pwfRecordRetryKey(message, record), { message, record });
    syncPwfRecordRetryState();
    persistFailedPwfRecords(
      pwfSessionRef.current?.studentId ?? message?.participant,
      pwfSessionRef.current?.studyMode ?? getStudyModeFromUrl(),
    );
  }

  function clearFailedPwfRecord(message, record = null) {
    failedPwfRecordsRef.current.delete(pwfRecordRetryKey(message));
    failedPwfRecordsRef.current.delete(pwfRecordRetryKey(message, record));
    syncPwfRecordRetryState();
    persistFailedPwfRecords(
      pwfSessionRef.current?.studentId ?? message?.participant,
      pwfSessionRef.current?.studyMode ?? getStudyModeFromUrl(),
    );
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
    restoreFailedPwfRecords(sid, requestedStudyMode);
    comprehensionSaveQueueRef.current = Promise.resolve();
    comprehensionSaveFailedRef.current = false;
    comprehensionSaveErrorRef.current = null;

    const sessionName = sid;
    const promise = startSession(sid, sessionName, requestedStudyMode, enrollment)
      .then((data) => {
        const resolvedStudyMode = data.study_mode || requestedStudyMode;
        const resolvedTrials = data.trials || [];
        const savedTrialResults = data.saved_ci_results || [];
        const savedPwfResults = data.saved_pwf_results || [];
        const savedCiSettlement = data.ci_settlement || null;
        const savedPwfSettlement = data.pwf_settlement || null;
        const comprehensionRequired = Boolean(data.pwf_comprehension_required);
        const pwfCompleted = Boolean(data.pwf_completed)
          || (!comprehensionRequired && savedTrialResults.length > 0);
        const resumeTrialIndex = firstUnansweredTrialIndex(resolvedTrials, savedTrialResults);
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
          pwfComprehensionRequired: comprehensionRequired,
          savedTrialResults,
          savedPwfResults,
          savedPwfSettlement,
          pwfCompleted,
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
        setPwfComprehensionRequired(session.pwfComprehensionRequired);
        setPwfRecords(session.savedPwfResults);
        setCiRecords(session.savedTrialResults);
        setCiSettlement(savedCiSettlement);
        setPwfSettlement(savedPwfSettlement);
        setCurrentTrialIndex(Math.min(resumeTrialIndex, Math.max(resolvedTrials.length - 1, 0)));
        setStepData({});
        if (pwfCompleted) {
          setCurrentStep(stepForTrialResume(
            resolvedTrials,
            resumeTrialIndex,
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
      let record = null;
      try {
        const session = await ensurePwfSession(message);
        record = buildPwfRecord(message, session);
        await savePwfResults([record]);
        clearFailedPwfRecord(message, record);
        setPwfRecords((prev) => upsertPwfRecord(prev, record));
      } catch (error) {
        // Keep the exact task payload so a later retry can recreate an upsert safely.
        rememberFailedPwfRecord(message, record);
        throw error;
      }
    });

    pwfSaveQueueRef.current = saveTask.catch(() => {});
    return saveTask;
  }

  function buildPwfComprehensionEvents(message, session) {
    const events = message?.events;
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error("理解度確認の記録を取得できませんでした");
    }
    return events.map((event) => ({
      ...event,
      session_id: session.sessionId,
    }));
  }

  async function saveComprehensionEventsWithRetry(events, maxAttempts = 3) {
    let lastError = null;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await savePwfComprehensionEvents(events);
      } catch (error) {
        lastError = error;
        if (attempt + 1 < maxAttempts) {
          await new Promise((resolve) => window.setTimeout(resolve, 250 * (2 ** attempt)));
        }
      }
    }
    throw lastError || new Error("理解度確認の記録保存に失敗しました");
  }

  function enqueuePwfComprehensionSave(message) {
    const saveTask = comprehensionSaveQueueRef.current.then(async () => {
      try {
        const session = await ensurePwfSession(message);
        const events = buildPwfComprehensionEvents(message, session);
        const response = await saveComprehensionEventsWithRetry(events);
        comprehensionSaveFailedRef.current = false;
        comprehensionSaveErrorRef.current = null;
        return response;
      } catch (error) {
        comprehensionSaveFailedRef.current = true;
        comprehensionSaveErrorRef.current = error;
        throw error;
      }
    });

    comprehensionSaveQueueRef.current = saveTask.catch(() => {});
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
      setError(e.message);
    } finally {
      endOperation();
    }
  }

  async function retryFailedPwfRecords() {
    const failedRecords = [...failedPwfRecordsRef.current.values()];
    if (!failedRecords.length) return true;

    beginOperation();
    setError(null);
    let lastError = null;
    try {
      for (const { message } of failedRecords) {
        try {
          await enqueuePwfRecordSave(message);
        } catch (error) {
          lastError = error;
        }
      }
      if (failedPwfRecordsRef.current.size > 0) {
        throw lastError || new Error("PWF 結果の保存に失敗しました");
      }
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      endOperation();
    }
  }

  async function handlePwfComprehensionEvents(message) {
    return enqueuePwfComprehensionSave(message);
  }

  async function handlePwfComplete(message) {
    beginOperation();
    setError(null);
    try {
      const session = await ensurePwfSession(message);
      await pwfSaveQueueRef.current;
      if (Array.isArray(message?.comprehension_events) && message.comprehension_events.length > 0) {
        await enqueuePwfComprehensionSave({
          ...message,
          events: message.comprehension_events,
        });
      } else {
        await comprehensionSaveQueueRef.current;
      }
      if (pwfSaveFailedRef.current) {
        throw new Error("PWF 結果の保存に失敗しました");
      }
      if (comprehensionSaveFailedRef.current) {
        throw comprehensionSaveErrorRef.current || new Error("理解度確認の記録保存に失敗しました");
      }
      await completePwfSession(session.sessionId);
      session.pwfCompleted = true;
      const resumeTrialIndex = firstUnansweredTrialIndex(session.trials, session.savedTrialResults);
      setCurrentTrialIndex(Math.min(resumeTrialIndex, Math.max(session.trials.length - 1, 0)));
      setStepData({});
      setCurrentStep(stepForTrialResume(
        session.trials,
        resumeTrialIndex,
        null,
      ));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
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
      setCurrentStep(9);
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
        ci_assignment_block: trial.ci_assignment_block ?? null,
        ci_assignment_position: trial.ci_assignment_position ?? null,
        ci_assignment_block_size: trial.ci_assignment_block_size ?? null,
        ci_assignment_condition: trial.ci_assignment_condition ?? null,
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
      if (result.pwf_settlement) setPwfSettlement(result.pwf_settlement);
    } catch (e) {
      setError(e.message);
    } finally {
      pendingOperationsRef.current = Math.max(0, pendingOperationsRef.current - 1);
      if (pendingOperationsRef.current === 0) setLoading(false);
    }
  }, [ciSettlement, sessionId]);

  const loadPwfSettlement = useCallback(async () => {
    if (!sessionId || pwfSettlement) return;
    pendingOperationsRef.current += 1;
    setLoading(true);
    setError(null);
    try {
      const result = await createPwfSettlement(sessionId);
      setPwfSettlement(result.settlement);
    } catch (e) {
      setError(e.message);
    } finally {
      pendingOperationsRef.current = Math.max(0, pendingOperationsRef.current - 1);
      if (pendingOperationsRef.current === 0) setLoading(false);
    }
  }, [pwfSettlement, sessionId]);

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
    stepData,
    ciSettlement,
    pwfSettlement,
    pwfComprehensionRequired,
    loading,
    error,
    pwfRecordRetryAvailable,
    handlePwfStart,
    handlePwfRecord,
    handlePwfComprehensionEvents,
    handlePwfComplete,
    retryFailedPwfRecords,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
    loadCiSettlement,
    loadPwfSettlement,
    continueToPwfSettlement,
    continueToFinish,
  };
}
