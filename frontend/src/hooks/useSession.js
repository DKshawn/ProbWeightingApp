import { useState } from "react";
import { startSession, saveResult } from "../api/client";

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [experimentMode, setExperimentMode] = useState("normal");
  const [timePressureSeconds, setTimePressureSeconds] = useState(0);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0=setup,1,2,3,4,5=finish,6=block_break
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTrial = trials[currentTrialIndex] ?? null;
  const totalTrials = trials.length;

  async function handleSetup(sid, sname) {
    setLoading(true);
    setError(null);
    try {
      const data = await startSession(sid, sname);
      setSessionId(data.session_id);
      setTrials(data.trials);
      setStudentId(sid);
      setName(sname);
      setExperimentMode(data.experiment_mode || "normal");
      setTimePressureSeconds(data.time_pressure_seconds || 0);
      setCurrentTrialIndex(0);
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
        setCurrentStep(6); // block break
      } else if (nextIndex >= totalTrials) {
        setCurrentStep(5); // finish
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
    sessionId,
    studentId,
    experimentMode,
    timePressureSeconds,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    stepData,
    loading,
    error,
    handleSetup,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
  };
}
