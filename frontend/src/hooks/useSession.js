import { useState } from "react";
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

  const currentTrial = trials[currentTrialIndex] ?? null;
  const totalTrials = trials.length;

  async function handleUtilityCurvatureComplete(message) {
    const sid = String(message?.participant ?? "").trim();
    const utilityRecords = Array.isArray(message?.records) ? message.records : [];

    if (!sid) {
      setError("学籍番号を取得できませんでした");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sessionName = sid;
      const requestedStudyMode = getStudyModeFromUrl();
      const data = await startSession(sid, sessionName, requestedStudyMode);
      const resolvedStudyMode = data.study_mode || requestedStudyMode;

      const records = utilityRecords.map((record, index) => ({
        ...record,
        session_id: data.session_id,
        student_id: sid,
        name: sessionName,
        study_mode: resolvedStudyMode,
        curvature_trial: index + 1,
      }));

      await saveUtilityCurvatureResults(records);

      setSessionId(data.session_id);
      setTrials(data.trials);
      setStudentId(sid);
      setName(sessionName);
      setStudyMode(resolvedStudyMode);
      setExperimentMode(data.experiment_mode || "normal");
      setTimePressureSeconds(data.time_pressure_seconds || 0);
      setCurrentTrialIndex(0);
      setStepData({});
      setCurrentStep(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
    handleUtilityCurvatureComplete,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
  };
}
