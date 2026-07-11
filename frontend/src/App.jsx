import { useSession } from "./hooks/useSession";
import Step1Screen from "./components/Step1Screen";
import Step2Screen from "./components/Step2Screen";
import Step3Screen from "./components/Step3Screen";
import Step4Screen from "./components/Step4Screen";
import CiSettlementScreen from "./components/CiSettlementScreen";
import BlockBreakScreen from "./components/BlockBreakScreen";
import PwfFrame from "./components/PwfFrame";
import PwfSettlementScreen from "./components/PwfSettlementScreen";
import FinishScreen from "./components/FinishScreen";
import "./App.css";

export default function App() {
  const {
    studentId,
    pwfRecords,
    trials,
    currentTrialIndex,
    currentStep,
    currentTrial,
    stepData,
    ciSettlement,
    pwfComprehensionRequired,
    loading,
    error,
    handlePwfStart,
    handlePwfRecord,
    handlePwfComprehensionEvents,
    handlePwfComplete,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    startNextBlock,
    loadCiSettlement,
    continueToPwfSettlement,
    continueToFinish,
  } = useSession();

  const totalTrials = trials.length;

  switch (currentStep) {
    case 0:
      return (
        <PwfFrame
          onStart={handlePwfStart}
          onRecord={handlePwfRecord}
          onComprehensionEvents={handlePwfComprehensionEvents}
          onComplete={handlePwfComplete}
          loading={loading}
          error={error}
        />
      );
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
          loading={loading}
          error={error}
        />
      );
    case 5:
      return (
        <FinishScreen
          studentId={studentId}
          includePwfComprehension={pwfComprehensionRequired}
        />
      );
    case 6:
      return <BlockBreakScreen nextTrial={currentTrial} onContinue={startNextBlock} />;
    case 7:
      return <PwfSettlementScreen records={pwfRecords} onNext={continueToFinish} />;
    case 9:
      return (
        <CiSettlementScreen
          settlement={ciSettlement}
          loading={loading}
          error={error}
          onLoad={loadCiSettlement}
          onNext={continueToPwfSettlement}
        />
      );
    default:
      return null;
  }
}
