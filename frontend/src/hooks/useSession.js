import { useRef, useState } from "react";
import {
  completePwfSession,
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

function stepForTrialResume(trials, trialIndex) {
  if (!trials.length) return 5;
  if (trialIndex >= trials.length) return 7;
  if (trialIndex > 0 && trials[trialIndex]?.block !== trials[trialIndex - 1]?.block) return 6;
  return 1;
}

function upsertPwfRecord(records, nextRecord) {
  const key = `${nextRecord.session_id ?? ""}:${nextRecord.pwf_trial}`;
  const withoutDuplicate = records.filter((record) => `${record.session_id ?? ""}:${record.pwf_trial}` !== key);
  return [...withoutDuplicate, nextRecord].sort((a, b) => Number(a.pwf_trial) - Number(b.pwf_trial));
}

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [studyMode, setStudyMode] = useState(getStudyModeFromUrl());
  const [experimentMode, setExperimentMode] = useState("normal");
  const [timePressureSeconds, setTimePressureSeconds] = useState(0);
  const [pwfRecords, setPwfRecords] = useState([]);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0=pwf,1,2,3,4,5=finish,6=block_break,7=pwf_settlement
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pendingOperationsRef = useRef(0);
  const pwfSessionRef = useRef(null);
  const pwfSessionPromiseRef = useRef(null);
  const pwfSaveQueueRef = useRef(Promise.resolve());
  const pwfSaveFailedRef = useRef(false);

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

  function extractPwfStudentId(message) {
    const sid = String(message?.participant ?? "").trim();
    if (!sid) {
      throw new Error("学籍番号を取得できませんでした");
    }
    return sid;
  }

  async function ensurePwfSession(message) {
    const sid = extractPwfStudentId(message);
    const requestedStudyMode = getStudyModeFromUrl();
    const currentSession = pwfSessionRef.current;
    if (currentSession?.studentId === sid && currentSession?.studyMode === requestedStudyMode) return currentSession;

    const currentPromise = pwfSessionPromiseRef.current;
    if (currentPromise?.studentId === sid && currentPromise?.studyMode === requestedStudyMode) return currentPromise.promise;

    pwfSaveQueueRef.current = Promise.resolve();
    pwfSaveFailedRef.current = false;

    const sessionName = sid;
    const promise = startSession(sid, sessionName, requestedStudyMode)
      .then((data) => {
        const resolvedStudyMode = data.study_mode || requestedStudyMode;
        const resolvedTrials = data.trials || [];
        const savedTrialResults = data.saved_ci_results || [];
        const savedPwfResults = data.saved_pwf_results || [];
        const pwfCompleted = Boolean(data.pwf_completed) || savedTrialResults.length > 0;
        const resumeTrialIndex = firstUnansweredTrialIndex(resolvedTrials, savedTrialResults);
        const session = {
          sessionId: data.session_id,
          studentId: sid,
          name: sessionName,
          studyMode: resolvedStudyMode,
          trials: resolvedTrials,
          experimentMode: data.experiment_mode || "normal",
          timePressureSeconds: data.time_pressure_seconds || 0,
          savedTrialResults,
          savedPwfResults,
          pwfCompleted,
        };

        pwfSessionRef.current = session;
        setSessionId(session.sessionId);
        setTrials(session.trials);
        setStudentId(session.studentId);
        setName(session.name);
        setStudyMode(session.studyMode);
        setExperimentMode(session.experimentMode);
        setTimePressureSeconds(session.timePressureSeconds);
        setPwfRecords(session.savedPwfResults);
        setCurrentTrialIndex(Math.min(resumeTrialIndex, Math.max(resolvedTrials.length - 1, 0)));
        setStepData({});
        if (pwfCompleted) {
          setCurrentStep(stepForTrialResume(resolvedTrials, resumeTrialIndex));
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
      setStepData({});
      setCurrentStep(stepForTrialResume(session.trials, resumeTrialIndex));
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
      await saveCiResult({
        session_id: sessionId,
        student_id: studentId,
        name,
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
      });

      const nextIndex = currentTrialIndex + 1;
      const nextTrial = trials[nextIndex];

      if (nextIndex < totalTrials && nextTrial?.block !== trial.block) {
        setCurrentTrialIndex(nextIndex);
        setStepData({});
        setCurrentStep(6);
      } else if (nextIndex >= totalTrials) {
        setStepData({});
        setCurrentStep(7);
      } else {
        setCurrentTrialIndex(nextIndex);
        setStepData({});
        setCurrentStep(1);
      }
    } catch (e) {
      setError(e.message);
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

  return {
    studentId,
    pwfRecords,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    stepData,
    loading,
    error,
    handlePwfStart,
    handlePwfRecord,
    handlePwfComplete,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
    continueToFinish,
  };
}
