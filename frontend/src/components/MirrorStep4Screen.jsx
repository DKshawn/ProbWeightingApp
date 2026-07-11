import { useEffect, useRef, useState } from "react";

function formatPercentage(probability) {
  return `${(Number(probability) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export default function MirrorStep4Screen({ record, onNext, loading, error }) {
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, []);

  async function submitChoice(choice, event) {
    if (finishedRef.current || loading) return;

    finishedRef.current = true;
    setIsFinished(true);

    const responseTimeMs = startTimeRef.current !== null
      ? Math.max(0, Math.round(event.timeStamp - startTimeRef.current))
      : null;

    try {
      const saved = await onNext(choice, {
        responseTimeMs,
        timedOut: false,
      });
      if (saved !== false) return;
    } catch {
      // The hook normally converts save failures to `false`; this keeps the screen retryable if one escapes.
    }

    finishedRef.current = false;
    setIsFinished(false);
    startTimeRef.current = performance.now();
  }

  const buttonsDisabled = loading || isFinished;

  return (
    <div className="screen">
      <div className="step-label">くじの比較</div>

      <p className="question-intro">以下の2つのくじを比べてください：</p>

      <div className="lottery-compare">
        <div className="lottery-box lottery-x">
          <div className="lottery-label">選択肢A</div>
          <div className="lottery-detail">
            確率 <strong>{formatPercentage(record.sN)}</strong> で
          </div>
          <div className="lottery-amount">{record.y_prime}円</div>
        </div>

        <div className="vs-label">vs</div>

        <div className="lottery-box lottery-y">
          <div className="lottery-label">選択肢B</div>
          <div className="lottery-detail">
            確率 <strong>{formatPercentage(record.rN)}</strong> で
          </div>
          <div className="lottery-amount">{record.x_prime}円</div>
        </div>
      </div>

      <div className="choice-buttons">
        <button
          className="btn-choice btn-x"
          onClick={(event) => submitChoice("X", event)}
          disabled={buttonsDisabled}
        >
          Aを好む
        </button>
        <button
          className="btn-choice btn-indifferent"
          onClick={(event) => submitChoice("Indifferent", event)}
          disabled={buttonsDisabled}
        >
          ほとんど無差別
        </button>
        <button
          className="btn-choice btn-y"
          onClick={(event) => submitChoice("Y", event)}
          disabled={buttonsDisabled}
        >
          Bを好む
        </button>
      </div>

      {loading && <p className="saving">保存中...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
