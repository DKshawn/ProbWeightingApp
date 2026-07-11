import ProgressBar from "./ProgressBar";
import { formatCiProbability } from "../utils/formatCiProbability";

export default function StepFeedbackScreen({ trial, trialIndex, totalTrials, feedback, onNext }) {
  const trialNum = trialIndex + 1;
  const selectedOption = feedback?.selectedOption;
  const reward = Number(feedback?.rewardAmount) || 0;
  const isStep4 = Number(feedback?.step) === 4;
  const wasParticipantChoice = feedback?.selectionMethod === "participant_choice";
  const wasIndifferentChoice = feedback?.selectionMethod === "random_indifferent_choice";
  const heading = wasParticipantChoice
    ? "あなたが選んだ選択肢をもとに抽選しました"
    : isStep4 && wasIndifferentChoice
    ? "無差別のため、A と B からランダムに選びました"
    : "この2つの選択肢は無差別として扱います";
  const explanation = wasParticipantChoice
    ? "あなたが選んだくじの確率に従って、獲得金額を決めました。"
    : "A と B からランダムに1つを選び、選ばれたくじの確率に従って獲得金額を決めました。";
  const selectedBadge = wasParticipantChoice
    ? "あなたが選んだ選択肢"
    : "ランダムに選ばれた選択肢";
  const nextLabel = isStep4 ? "次の課題へ進む" : `Step ${Number(feedback?.step) + 1} へ進む`;

  return (
    <div className="screen">
      <ProgressBar current={trialNum} total={totalTrials} block={trial.block} N={trial.N} />

      <div className="step-label">Step {feedback?.step} 抽選結果</div>

      <section className="ci-feedback-card">
        <h2>{heading}</h2>
        <p>{explanation}</p>

        <div className="ci-feedback-options">
          {feedback?.options?.map((option) => {
            const selected = option.label === selectedOption;
            return (
              <div key={option.label} className={`lottery-box ci-feedback-option ${selected ? "selected" : "muted"}`}>
                <div className="lottery-label">選択肢{option.label}</div>
                <div className="lottery-detail">確率 <strong>{formatCiProbability(option.probability)}</strong> で</div>
                <div className="lottery-amount">{option.amount.toLocaleString("ja-JP")}円</div>
                {selected && <span className="ci-feedback-selected">{selectedBadge}</span>}
              </div>
            );
          })}
        </div>

        <div className="ci-feedback-reward">
          <span>獲得金額</span>
          <strong>{reward.toLocaleString("ja-JP")}円</strong>
        </div>

        <button type="button" className="btn-primary" onClick={onNext}>
          {nextLabel}
        </button>
      </section>
    </div>
  );
}
