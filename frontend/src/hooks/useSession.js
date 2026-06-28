import { useEffect, useRef, useState } from "react";
import { startSession, saveResult, saveUtilityResults } from "../api/client";
import { UTILITY_DESIGN } from "../utilityDesign";

const UTILITY_TIME_PRESSURE_SECONDS = 15;

function getUtilityAssignment(studentId, data) {
  if (data.utility_experiment_mode && data.utility_time_pressure_seconds !== undefined) {
    return {
      mode: data.utility_experiment_mode,
      seconds: data.utility_time_pressure_seconds || 0,
    };
  }

  const lastDigit = studentId.match(/\d$/)?.[0];
  const hasUtilityTimePressure = lastDigit !== undefined && Number(lastDigit) % 2 === 0;
  return {
    mode: hasUtilityTimePressure ? "time_pressure" : "normal",
    seconds: hasUtilityTimePressure ? UTILITY_TIME_PRESSURE_SECONDS : 0,
  };
}

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
  const [utilityExperimentMode, setUtilityExperimentMode] = useState("normal");
  const [utilityTimePressureSeconds, setUtilityTimePressureSeconds] = useState(0);
  const [trials, setTrials] = useState([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0=setup,1,2,3,4,5=finish,6=block_break,7=utility_intro,8=utility
  const [stepData, setStepData] = useState({});
  const [utilitySequenceIndex, setUtilitySequenceIndex] = useState(0);
  const [utilityXPrev, setUtilityXPrev] = useState(UTILITY_DESIGN.initialXPrev);
  const [includeProbabilityCsv, setIncludeProbabilityCsv] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const utilityDebugStartedRef = useRef(false);

  const currentTrial = trials[currentTrialIndex] ?? null;
  const totalTrials = trials.length;

  useEffect(() => {
    if (!import.meta.env.DEV || utilityDebugStartedRef.current) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") !== "utility") {
      return;
    }

    utilityDebugStartedRef.current = true;
    const sid = params.get("student_id") || params.get("studentId") || "9998";
    const sname = params.get("name") || "Utility Debug";
    const skipIntro = params.get("screen") === "task" || params.get("skip_intro") === "1";
    const studyMode = getStudyModeFromUrl();

    async function startUtilityDebugSession() {
      setLoading(true);
      setError(null);
      try {
        const data = await startSession(sid, sname, studyMode);
        setSessionId(data.session_id);
        setTrials(data.trials);
        setStudentId(sid);
        setName(sname);
        setStudyMode(data.study_mode || studyMode);
        setExperimentMode(data.experiment_mode || "normal");
        setTimePressureSeconds(data.time_pressure_seconds || 0);
        const utilityAssignment = getUtilityAssignment(sid, data);
        setUtilityExperimentMode(utilityAssignment.mode);
        setUtilityTimePressureSeconds(utilityAssignment.seconds);
        setCurrentTrialIndex(0);
        setStepData({});
        setUtilitySequenceIndex(0);
        setUtilityXPrev(UTILITY_DESIGN.initialXPrev);
        setIncludeProbabilityCsv(false);
        setCurrentStep(skipIntro ? 8 : 7);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    startUtilityDebugSession();
  }, []);

  async function handleSetup(sid, sname) {
    setLoading(true);
    setError(null);
    try {
      const data = await startSession(sid, sname, getStudyModeFromUrl());
      setSessionId(data.session_id);
      setTrials(data.trials);
      setStudentId(sid);
      setName(sname);
      setStudyMode(data.study_mode || getStudyModeFromUrl());
      setExperimentMode(data.experiment_mode || "normal");
      setTimePressureSeconds(data.time_pressure_seconds || 0);
      const utilityAssignment = getUtilityAssignment(sid, data);
      setUtilityExperimentMode(utilityAssignment.mode);
      setUtilityTimePressureSeconds(utilityAssignment.seconds);
      setCurrentTrialIndex(0);
      setStepData({});
      setUtilitySequenceIndex(0);
      setUtilityXPrev(UTILITY_DESIGN.initialXPrev);
      setIncludeProbabilityCsv(true);
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
        setCurrentStep(6); // block break
      } else if (nextIndex >= totalTrials) {
        setStepData({});
        setUtilitySequenceIndex(0);
        setUtilityXPrev(UTILITY_DESIGN.initialXPrev);
        setCurrentStep(7); // utility intro
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

  function startUtilityBlock() {
    setCurrentStep(8);
  }

  async function submitUtilitySequence(rows, evaluation, timing = {}) {
    setLoading(true);
    setError(null);
    const sequence = utilitySequenceIndex + 1;
    const utilityTrialOffset = utilitySequenceIndex * UTILITY_DESIGN.increments.length;

    const records = rows.map((row) => ({
      session_id: sessionId,
      student_id: studentId,
      name,
      study_mode: studyMode,
      experiment_mode: utilityExperimentMode,
      time_pressure_seconds: utilityTimePressureSeconds,
      utility_trial: utilityTrialOffset + row.row,
      sequence,
      row: row.row,
      p: UTILITY_DESIGN.probability,
      r_amount: UTILITY_DESIGN.rAmount,
      R_amount: UTILITY_DESIGN.RAmount,
      x_prev: utilityXPrev,
      x_candidate: row.xCandidate,
      increment: row.increment,
      choice: row.choice,
      x_estimate: evaluation.estimate,
      switch_lower: evaluation.lower,
      switch_upper: evaluation.upper,
      switch_status: evaluation.status,
      response_time_ms: timing.responseTimeMs ?? null,
      timed_out: Boolean(timing.timedOut),
    }));

    try {
      await saveUtilityResults(records);

      const nextSequenceIndex = utilitySequenceIndex + 1;
      if (nextSequenceIndex >= UTILITY_DESIGN.sequenceCount) {
        setCurrentStep(5);
      } else {
        setUtilitySequenceIndex(nextSequenceIndex);
        setUtilityXPrev(Number.isFinite(evaluation.estimate) ? evaluation.estimate : utilityXPrev);
        setCurrentStep(8);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return {
    sessionId,
    studentId,
    experimentMode,
    timePressureSeconds,
    utilityExperimentMode,
    utilityTimePressureSeconds,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    stepData,
    utilitySequenceIndex,
    utilityXPrev,
    includeProbabilityCsv,
    loading,
    error,
    handleSetup,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
    startUtilityBlock,
    submitUtilitySequence,
  };
}
