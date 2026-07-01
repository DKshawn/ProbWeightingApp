import { useRef, useState } from "react";
import { saveResult, saveUtilityCurvatureResults, startSession } from "../api/client";

function getStudyModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("mode") === "pilot" || params.get("study_mode") === "pilot" || params.get("pilot") === "1") {
    return "pilot";
  }
  return "full";
}

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [studyMode, setStudyMode] = useState(getStudyModeFromUrl());
  const [experimentMode, setExperimentMode] = useState("normal");
  const [timePressureSeconds, setTimePressureSeconds] = useState(0);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0=utility_curvature,1,2,3,4,5=finish,6=block_break
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pendingOperationsRef = useRef(0);
  const utilitySessionRef = useRef(null);
  const utilitySessionPromiseRef = useRef(null);
  const utilitySaveQueueRef = useRef(Promise.resolve());
  const utilitySaveFailedRef = useRef(false);

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

  function extractUtilityStudentId(message) {
    const sid = String(message?.participant ?? "").trim();
    if (!sid) {
      throw new Error("学籍番号を取得できませんでした");
    }
    return sid;
  }

  async function ensureUtilityCurvatureSession(message) {
    const sid = extractUtilityStudentId(message);
    const currentSession = utilitySessionRef.current;
    if (currentSession?.studentId === sid) return currentSession;

    const currentPromise = utilitySessionPromiseRef.current;
    if (currentPromise?.studentId === sid) return currentPromise.promise;

    utilitySaveQueueRef.current = Promise.resolve();
    utilitySaveFailedRef.current = false;

    const sessionName = sid;
    const requestedStudyMode = getStudyModeFromUrl();
    const promise = startSession(sid, sessionName, requestedStudyMode)
      .then((data) => {
        const resolvedStudyMode = data.study_mode || requestedStudyMode;
        const session = {
          sessionId: data.session_id,
          studentId: sid,
          name: sessionName,
          studyMode: resolvedStudyMode,
          trials: data.trials,
          experimentMode: data.experiment_mode || "normal",
          timePressureSeconds: data.time_pressure_seconds || 0,
        };

        utilitySessionRef.current = session;
        setSessionId(session.sessionId);
        setTrials(session.trials);
        setStudentId(session.studentId);
        setName(session.name);
        setStudyMode(session.studyMode);
        setExperimentMode(session.experimentMode);
        setTimePressureSeconds(session.timePressureSeconds);
        setCurrentTrialIndex(0);
        setStepData({});
        return session;
      })
      .finally(() => {
        if (utilitySessionPromiseRef.current?.promise === promise) {
          utilitySessionPromiseRef.current = null;
        }
      });

    utilitySessionPromiseRef.current = { studentId: sid, promise };
    return promise;
  }

  function buildUtilityCurvatureRecord(message, session) {
    const record = message?.record;
    if (!record || typeof record !== "object") {
      throw new Error("Utility curvature の記録を取得できませんでした");
    }

    const curvatureTrial = Number(record.curvature_trial ?? message?.curvature_trial);
    if (!Number.isFinite(curvatureTrial) || curvatureTrial < 1) {
      throw new Error("Utility curvature の試行番号を取得できませんでした");
    }

    return {
      ...record,
      session_id: session.sessionId,
      student_id: session.studentId,
      name: session.name,
      study_mode: session.studyMode,
      curvature_trial: curvatureTrial,
    };
  }

  function enqueueUtilityCurvatureRecordSave(message) {
    const saveTask = utilitySaveQueueRef.current.then(async () => {
      const session = await ensureUtilityCurvatureSession(message);
      const record = buildUtilityCurvatureRecord(message, session);
      await saveUtilityCurvatureResults([record]);
    });

    utilitySaveQueueRef.current = saveTask.catch(() => {});
    return saveTask;
  }

  async function handleUtilityCurvatureStart(message) {
    beginOperation();
    setError(null);
    try {
      await ensureUtilityCurvatureSession(message);
    } catch (e) {
      setError(e.message);
    } finally {
      endOperation();
    }
  }

  async function handleUtilityCurvatureRecord(message) {
    beginOperation();
    setError(null);
    try {
      await enqueueUtilityCurvatureRecordSave(message);
    } catch (e) {
      utilitySaveFailedRef.current = true;
      setError(e.message);
    } finally {
      endOperation();
    }
  }

  async function handleUtilityCurvatureComplete(message) {
    beginOperation();
    setError(null);
    try {
      await ensureUtilityCurvatureSession(message);
      await utilitySaveQueueRef.current;
      if (utilitySaveFailedRef.current) {
        throw new Error("Utility curvature 結果の保存に失敗しました");
      }
      setCurrentStep(1);
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
      await saveResult({
        session_id: sessionId,
        student_id: studentId,
        name,
        study_mode: studyMode,
        experiment_mode: experimentMode,
        time_pressure_seconds: timePressureSeconds,
        trial: trial.trial,
        block: trial.block,
        N,
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
        setCurrentStep(5);
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

  return {
    studentId,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    stepData,
    loading,
    error,
    handleUtilityCurvatureStart,
    handleUtilityCurvatureRecord,
    handleUtilityCurvatureComplete,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
  };
}
