import { useState } from "react";
import ProgressBar from "./ProgressBar";

export default function Step1Screen({ trial, trialIndex, totalTrials, onNext }) {
  const [y, setY] = useState("");
  const [validationError, setValidationError] = useState("");

  const { p, q, x, N, block } = trial;
  const trialNum = trialIndex + 1;

  function handleSubmit(e) {
    e.preventDefault();
    const val = parseFloat(y);
    if (isNaN(val) || val < 1 || val > 100_000_000 || !Number.isFinite(val)) {
      setValidationError("1〜100,000,000 の数値を入力してください");
      return;
    }
    if (p > q && val < x) {
      setValidationError(`確率 ${q.toFixed(3)} は確率 ${p.toFixed(3)} より小さいため、?円は${x}円より小さくできません`);
      return;
    }
    if (p < q && val > x) {
      setValidationError(`確率 ${q.toFixed(3)} は確率 ${p.toFixed(3)} より大きいため、?円は${x}円より大きくできません`);
      return;
    }
    setValidationError("");
    onNext(val);
  }

  return (
    <div className="screen">
      <ProgressBar current={trialNum} total={totalTrials} block={block} N={N} />

      <div className="step-label">Step 1</div>

      <div className="question-box">
        <p>
          <strong>（確率 {p.toFixed(3)} で {x}円）</strong> と無差別になる
        </p>
        <p>
          <strong>（確率 {q.toFixed(3)} で <span className="unknown">?円</span>）</strong> を答えてください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="field">
          <label htmlFor="y">金額 y（円）</label>
          <input
            id="y"
            type="number"
            min="1"
            max="100000000"
            step="any"
            value={y}
            onChange={(e) => setY(e.target.value)}
            placeholder="例：50"
            autoFocus
          />
        </div>
        {validationError && <p className="error">{validationError}</p>}
        <button type="submit" className="btn-primary">次へ</button>
      </form>
    </div>
  );
}
