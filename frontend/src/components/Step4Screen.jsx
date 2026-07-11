import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

function formatPercentage(probability) {
  return `${(Number(probability) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export default function Step4Screen({
  trial,
  stepData,
  trialIndex,
  totalTrials,
  onNext,
  loading,
}) {
  const { r, x_prime, N, block } = trial;
  const { s, y_prime } = stepData;
  const rN = formatPercentage(r ** N);
  const sN = formatPercentage(s ** N);
  const trialNum = trialIndex + 1;
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, [trialIndex]);

  function submitChoice(choice, event) {
    if (finishedRef.current || loading) return;

    finishedRef.current = true;
    setIsFinished(true);

    const responseTimeMs = startTimeRef.current !== null
      ? Math.max(0, Math.round(event.timeStamp - startTimeRef.current))
      : null;

    onNext(choice, {
      responseTimeMs,
      timedOut: false,
    });
  }

  const buttonsDisabled = loading || isFinished;

  return (
    <div className="screen">
      <ProgressBar current={trialNum} total={totalTrials} block={block} N={N} />

      <div className="step-label">Step 4</div>

      <p className="question-intro">以下の2つのくじを比べてください：</p>

      <div className="lottery-compare">
        <div className="lottery-box lottery-x">
          <div className="lottery-label">選択肢A</div>
          <div className="lottery-detail">
            確率 <strong>{rN}</strong> で
          </div>
          <div className="lottery-amount">{x_prime}円</div>
        </div>

        <div className="vs-label">vs</div>

        <div className="lottery-box lottery-y">
          <div className="lottery-label">選択肢B</div>
          <div className="lottery-detail">
            確率 <strong>{sN}</strong> で
          </div>
          <div className="lottery-amount">{y_prime}円</div>
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
    </div>
  );
}
