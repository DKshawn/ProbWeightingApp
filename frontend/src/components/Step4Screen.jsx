import { useEffect, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

export default function Step4Screen({
  trial,
  stepData,
  trialIndex,
  totalTrials,
  onNext,
  experimentMode,
  timePressureSeconds,
  loading,
}) {
  const { r, x_prime, N, block } = trial;
  const { s, y_prime } = stepData;
  const rN = (r ** N).toFixed(3);
  const sN = (s ** N).toFixed(3);
  const trialNum = trialIndex + 1;
  const hasTimePressure = experimentMode === "time_pressure" && timePressureSeconds > 0;
  const totalMs = timePressureSeconds * 1000;
  const [remainingSeconds, setRemainingSeconds] = useState(timePressureSeconds);
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);
  const finishedRef = useRef(false);
  const onNextRef = useRef(onNext);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    finishedRef.current = false;
    startTimeRef.current = performance.now();

    if (!hasTimePressure) {
      setRemainingSeconds(0);
      return () => {};
    }

    setRemainingSeconds(timePressureSeconds);

    function updateTimer(now) {
      if (finishedRef.current) return;

      const elapsed = Math.max(0, Math.min(now - startTimeRef.current, totalMs));
      const nextRemainingSeconds = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setRemainingSeconds(nextRemainingSeconds);

      if (elapsed >= totalMs) {
        finishedRef.current = true;
        onNextRef.current("Timeout", {
          responseTimeMs: Math.round(totalMs),
          timedOut: true,
        });
        return;
      }

      frameRef.current = requestAnimationFrame(updateTimer);
    }

    frameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [hasTimePressure, timePressureSeconds, totalMs, trialIndex]);

  function submitChoice(choice) {
    if (finishedRef.current || loading) return;

    finishedRef.current = true;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    const responseTimeMs = startTimeRef.current
      ? Math.round(performance.now() - startTimeRef.current)
      : null;

    onNext(choice, {
      responseTimeMs,
      timedOut: false,
    });
  }

  const buttonsDisabled = loading || finishedRef.current;

  return (
    <div className="screen">
      <ProgressBar current={trialNum} total={totalTrials} block={block} N={N} />

      <div className="step-label">Step 4</div>

      {hasTimePressure && (
        <section className="time-pressure-panel" aria-label="制限時間">
          <div className="time-pressure-copy">
            <span>制限時間</span>
            <strong>{remainingSeconds}秒</strong>
          </div>
          <div className="time-pressure-track">
            <div
              className="time-pressure-bar"
              style={{ animationDuration: `${timePressureSeconds}s` }}
            />
          </div>
        </section>
      )}

      <p className="question-intro">以下の2つのくじを比べてください：</p>

      <div className="lottery-compare">
        <div className="lottery-box lottery-x">
          <div className="lottery-label">X</div>
          <div className="lottery-detail">
            確率 <strong>{rN}</strong> で
          </div>
          <div className="lottery-amount">{x_prime}円</div>
        </div>

        <div className="vs-label">vs</div>

        <div className="lottery-box lottery-y">
          <div className="lottery-label">Y</div>
          <div className="lottery-detail">
            確率 <strong>{sN}</strong> で
          </div>
          <div className="lottery-amount">{y_prime}円</div>
        </div>
      </div>

      <div className="choice-buttons">
        <button
          className="btn-choice btn-x"
          onClick={() => submitChoice("X")}
          disabled={buttonsDisabled}
        >
          Xを好む
        </button>
        <button
          className="btn-choice btn-indifferent"
          onClick={() => submitChoice("Indifferent")}
          disabled={buttonsDisabled}
        >
          ほとんど無差別
        </button>
        <button
          className="btn-choice btn-y"
          onClick={() => submitChoice("Y")}
          disabled={buttonsDisabled}
        >
          Yを好む
        </button>
      </div>

      {loading && <p className="saving">保存中...</p>}
    </div>
  );
}
