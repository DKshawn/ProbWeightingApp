import { useState } from "react";
import ProgressBar from "./ProgressBar";
import { formatCiProbability } from "../utils/formatCiProbability";

export default function Step3Screen({ trial, trialIndex, totalTrials, onNext }) {
  const [yPrime, setYPrime] = useState("");
  const [validationError, setValidationError] = useState("");

  const { p, q, x_prime, N, block } = trial;
  const pNValue = p ** N;
  const qNValue = q ** N;
  const pN = formatCiProbability(pNValue);
  const qN = formatCiProbability(qNValue);
  const trialNum = trialIndex + 1;

  function handleSubmit(e) {
    e.preventDefault();
    const val = parseFloat(yPrime);
    if (isNaN(val) || val < 1 || val > 100_000_000 || !Number.isFinite(val)) {
      setValidationError("1〜100,000,000 の数値を入力してください");
      return;
    }
    if (pNValue > qNValue && val < x_prime) {
      setValidationError(`確率 ${qN} は確率 ${pN} より小さいため、?円は${x_prime}円より小さくできません`);
      return;
    }
    if (pNValue < qNValue && val > x_prime) {
      setValidationError(`確率 ${qN} は確率 ${pN} より大きいため、?円は${x_prime}円より大きくできません`);
      return;
    }
    setValidationError("");
    onNext(val);
  }

  return (
    <div className="screen">
      <ProgressBar current={trialNum} total={totalTrials} block={block} N={N} />

      <div className="step-label">Step 3</div>

      <div className="question-box">
        <div className="ci-option-list">
          <p><span className="ci-option-label">選択肢A</span><strong>（確率 {pN} で {x_prime}円）</strong></p>
          <p><span className="ci-option-label">選択肢B</span><strong>（確率 {qN} で <span className="unknown">?円</span>）</strong></p>
        </div>
        <p>上の2つが無差別になるように、選択肢Bの金額を答えてください。</p>
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <div className="field">
          <label htmlFor="yPrime">金額 y'（円）</label>
          <input
            id="yPrime"
            type="number"
            min="1"
            max="100000000"
            step="any"
            value={yPrime}
            onChange={(e) => setYPrime(e.target.value)}
            placeholder="例：30"
            autoFocus
          />
        </div>
        {validationError && <p className="error">{validationError}</p>}
        <button type="submit" className="btn-primary">次へ</button>
      </form>
    </div>
  );
}
