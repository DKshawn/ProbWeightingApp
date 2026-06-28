import { useSession } from "./hooks/useSession";
import SetupScreen from "./components/SetupScreen";
import Step1Screen from "./components/Step1Screen";
import Step2Screen from "./components/Step2Screen";
import Step3Screen from "./components/Step3Screen";
import Step4Screen from "./components/Step4Screen";
import BlockBreakScreen from "./components/BlockBreakScreen";
import UtilityIntroScreen from "./components/UtilityIntroScreen";
import UtilityElicitationScreen from "./components/UtilityElicitationScreen";
import FinishScreen from "./components/FinishScreen";
import "./App.css";

export default function App() {
  const {
    studentId,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    stepData,
    utilitySequenceIndex,
    utilityXPrev,
    includeProbabilityCsv,
    experimentMode,
    timePressureSeconds,
    utilityExperimentMode,
    utilityTimePressureSeconds,
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
  } = useSession();

  const totalTrials = trials.length;

  switch (currentStep) {
    case 0:
      return <SetupScreen onSetup={handleSetup} loading={loading} error={error} />;
    case 1:
      return (
        <Step1Screen
          trial={currentTrial}
          trialIndex={currentTrialIndex}
          totalTrials={totalTrials}
          onNext={submitStep1}
        />
      );
    case 2:
      return (
        <Step2Screen
          trial={currentTrial}
          stepData={stepData}
          trialIndex={currentTrialIndex}
          totalTrials={totalTrials}
          onNext={submitStep2}
        />
      );
    case 3:
      return (
        <Step3Screen
          trial={currentTrial}
          trialIndex={currentTrialIndex}
          totalTrials={totalTrials}
          onNext={submitStep3}
        />
      );
    case 4:
      return (
        <Step4Screen
          trial={currentTrial}
          stepData={stepData}
          trialIndex={currentTrialIndex}
          totalTrials={totalTrials}
          onNext={submitStep4}
          experimentMode={experimentMode}
          timePressureSeconds={timePressureSeconds}
          loading={loading}
        />
      );
    case 5:
      return <FinishScreen studentId={studentId} includeProbabilityCsv={includeProbabilityCsv} />;
    case 6:
      return <BlockBreakScreen nextTrial={currentTrial} onContinue={startNextBlock} />;
    case 7:
      return <UtilityIntroScreen onContinue={startUtilityBlock} />;
    case 8:
      return (
        <UtilityElicitationScreen
          key={utilitySequenceIndex}
          sequenceIndex={utilitySequenceIndex}
          xPrev={utilityXPrev}
          onSubmit={submitUtilitySequence}
          experimentMode={utilityExperimentMode}
          timePressureSeconds={utilityTimePressureSeconds}
          loading={loading}
          error={error}
        />
      );
    default:
      return null;
  }
}
