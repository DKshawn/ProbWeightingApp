import { useState } from "react";
import ProgressBar from "./ProgressBar";

function formatPercentage(probability) {
  return `${(Number(probability) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export default function Step2Screen({ trial, stepData, trialIndex, totalTrials, onNext }) {
  const [s, setS] = useState("");
  const [validationError, setValidationError] = useState("");

  const { r, x, N, block } = trial;
  const y = stepData.y;
  const trialNum = trialIndex + 1;

  function handleSubmit(e) {
    e.preventDefault();
    const percent = parseFloat(s);
    if (isNaN(percent) || percent < 1 || percent >= 100) {
      setValidationError("1以上100未満の確率（%）を入力してください");
      return;
    }
    const val = percent / 100;
    if (x > y && val < r) {
      setValidationError(`金額 ${y}円は金額 ${x}円より小さいため、確率 ? は確率 ${formatPercentage(r)} より小さくできません`);
      return;
    }
    if (x < y && val > r) {
      setValidationError(`金額 ${y}円は金額 ${x}円より大きいため、確率 ? は確率 ${formatPercentage(r)} より大きくできません`);
      return;
    }
    setValidationError("");
    onNext(val);
  }

  return (
    <div className="screen">
      <ProgressBar current={trialNum} total={totalTrials} block={block} N={N} />

      <div className="step-label">Step 2</div>

      <div className="question-box">
        <div className="ci-option-list">
          <p><span className="ci-option-label">選択肢A</span><strong>（確率 {formatPercentage(r)} で {x}円）</strong></p>
          <p><span className="ci-option-label">選択肢B</span><strong>（確率 <span className="unknown">?</span>% で {y}円）</strong></p>
        </div>
        <p>上の2つが無差別になるように、選択肢Bの確率を答えてください。</p>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="field">
          <label htmlFor="s">確率 s（%）</label>
          <input
            id="s"
            type="number"
            min="1"
            max="100"
            step="0.1"
            value={s}
            onChange={(e) => setS(e.target.value)}
            placeholder="例：48"
            autoFocus
          />
        </div>
        {validationError && <p className="error">{validationError}</p>}
        <button type="submit" className="btn-primary">次へ</button>
      </form>
    </div>
  );
}
