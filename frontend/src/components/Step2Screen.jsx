import { useState } from "react";
import ProgressBar from "./ProgressBar";

export default function Step2Screen({ trial, stepData, trialIndex, totalTrials, onNext }) {
  const [s, setS] = useState("");
  const [validationError, setValidationError] = useState("");

  const { r, x, N, block } = trial;
  const y = stepData.y;
  const trialNum = trialIndex + 1;

  function handleSubmit(e) {
    e.preventDefault();
    const val = parseFloat(s);
    if (isNaN(val) || val <= 0 || val >= 1) {
      setValidationError("0より大きく1より小さい確率を入力してください");
      return;
    }
    if (x > y && val < r) {
      setValidationError(`金額 ${y}円は金額 ${x}円より小さいため、確率 ? は確率 ${r.toFixed(3)} より小さくできません`);
      return;
    }
    if (x < y && val > r) {
      setValidationError(`金額 ${y}円は金額 ${x}円より大きいため、確率 ? は確率 ${r.toFixed(3)} より大きくできません`);
      return;
    }
    if (val ** N < 0.05) {
      setValidationError(
        `その確率では次のステップで確率が小さくなりすぎます（${val.toFixed(3)}^${N} = ${(val ** N).toFixed(4)} < 0.05）。別の値を入力してください`
      );
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
        <p>
          <strong>（確率 {r.toFixed(3)} で {x}円）</strong> と無差別になる
        </p>
        <p>
          <strong>（確率 <span className="unknown">?</span> で {y}円）</strong> を答えてください
        </p>
        <p className="hint">※ 入力値 s について s^{N} ≥ 0.05 が必要です</p>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="field">
          <label htmlFor="s">確率 s（0〜1）</label>
          <input
            id="s"
            type="number"
            min="0"
            max="1"
            step="0.001"
            value={s}
            onChange={(e) => setS(e.target.value)}
            placeholder="例：0.480"
            autoFocus
          />
        </div>
        {validationError && <p className="error">{validationError}</p>}
        <button type="submit" className="btn-primary">次へ</button>
      </form>
    </div>
  );
}
