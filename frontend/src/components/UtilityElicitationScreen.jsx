import { useEffect, useMemo, useRef, useState } from "react";
import { buildUtilityRows, evaluateUtilitySwitch, UTILITY_DESIGN } from "../utilityDesign";

function formatAmount(value) {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

const LOTTERY_A_LABEL = "くじΑ";
const LOTTERY_B_LABEL = "くじΒ";

export default function UtilityElicitationScreen({
  sequenceIndex,
  xPrev,
  onSubmit,
  experimentMode = "normal",
  timePressureSeconds = 0,
  loading,
  error,
}) {
  const [choices, setChoices] = useState({});
  const [switchSelection, setSwitchSelection] = useState(null);
  const [selectionTimeMs, setSelectionTimeMs] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(timePressureSeconds);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);
  const finishedRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  const choicesRef = useRef(choices);
  const rowsRef = useRef([]);
  const xPrevRef = useRef(xPrev);
  const selectionTimeMsRef = useRef(selectionTimeMs);
  const rows = useMemo(() => buildUtilityRows(xPrev), [xPrev]);
  const sequence = sequenceIndex + 1;
  const completedCount = sequenceIndex + (switchSelection ? 1 : 0);
  const progressPct = Math.round((completedCount / UTILITY_DESIGN.sequenceCount) * 100);
  const hasTimePressure = experimentMode === "time_pressure" && timePressureSeconds > 0;
  const totalMs = timePressureSeconds * 1000;

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    choicesRef.current = choices;
  }, [choices]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    xPrevRef.current = xPrev;
  }, [xPrev]);

  useEffect(() => {
    selectionTimeMsRef.current = selectionTimeMs;
  }, [selectionTimeMs]);

  function cancelTimer() {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }

  function submitRows(nextRows, evaluation, timing = {}) {
    if (finishedRef.current || loading) return;

    finishedRef.current = true;
    setIsFinished(true);
    cancelTimer();
    onSubmitRef.current(nextRows, evaluation, timing);
  }

  function submitTimeout() {
    const latestRows = rowsRef.current;
    const latestChoices = choicesRef.current;
    const latestEvaluation = evaluateUtilitySwitch(latestRows, latestChoices, xPrevRef.current);

    if (latestEvaluation.ok) {
      submitRows(
        latestRows.map((row) => ({
          ...row,
          choice: latestChoices[row.row],
        })),
        latestEvaluation,
        {
          responseTimeMs: selectionTimeMsRef.current ?? Math.round(totalMs),
          timedOut: false,
        },
      );
      return;
    }

    submitRows(
      latestRows.map((row) => ({
        ...row,
        choice: "Timeout",
      })),
      {
        ok: true,
        status: "timeout",
        estimate: null,
        lower: null,
        upper: null,
      },
      {
        responseTimeMs: Math.round(totalMs),
        timedOut: true,
      },
    );
  }

  useEffect(() => {
    finishedRef.current = false;
    setIsFinished(false);
    setRemainingSeconds(timePressureSeconds);
    startTimeRef.current = performance.now();

    if (!hasTimePressure) {
      cancelTimer();
      return () => {};
    }

    function updateTimer(now) {
      if (finishedRef.current) return;

      const elapsed = Math.max(0, Math.min(now - startTimeRef.current, totalMs));
      const nextRemainingSeconds = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
      setRemainingSeconds(nextRemainingSeconds);

      if (elapsed >= totalMs) {
        submitTimeout();
        return;
      }

      frameRef.current = requestAnimationFrame(updateTimer);
    }

    frameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      cancelTimer();
    };
  }, [hasTimePressure, timePressureSeconds, totalMs, sequenceIndex]);

  function buildSwitchChoices(clickedRow, clickedChoice) {
    return Object.fromEntries(
      rows.map((row) => [
        row.row,
        clickedChoice === "B"
          ? (row.row >= clickedRow ? "B" : "A")
          : (row.row <= clickedRow ? "A" : "B"),
      ]),
    );
  }

  function buildSwitchSummary() {
    if (!switchSelection) {
      return "切り替え点を選択してください。";
    }

    const { row, choice } = switchSelection;
    if (choice === "B" && row === 1) {
      return `すべての行で ${LOTTERY_B_LABEL} を選ぶことを表します。`;
    }
    if (choice === "A" && row === rows.length) {
      return `すべての行で ${LOTTERY_A_LABEL} を選ぶことを表します。`;
    }
    if (choice === "B") {
      return `Row ${row - 1}までは ${LOTTERY_A_LABEL}、Row ${row}から ${LOTTERY_B_LABEL} を選ぶことを表します。`;
    }
    return `Row ${row}までは ${LOTTERY_A_LABEL}、Row ${row + 1}から ${LOTTERY_B_LABEL} を選ぶことを表します。`;
  }

  function selectChoice(row, choice) {
    if (finishedRef.current || loading) return;

    const responseTimeMs = startTimeRef.current
      ? Math.round(performance.now() - startTimeRef.current)
      : null;
    setChoices(buildSwitchChoices(row, choice));
    setSwitchSelection({ row, choice });
    selectionTimeMsRef.current = responseTimeMs;
    setSelectionTimeMs(responseTimeMs);
    setValidationError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (finishedRef.current || loading) return;

    const evaluation = evaluateUtilitySwitch(rows, choices, xPrev);
    if (!evaluation.ok) {
      setValidationError(evaluation.message);
      return;
    }

    const responseTimeMs = selectionTimeMs ?? (
      startTimeRef.current
        ? Math.round(performance.now() - startTimeRef.current)
        : null
    );

    submitRows(
      rows.map((row) => ({
        ...row,
        choice: choices[row.row],
      })),
      evaluation,
      { responseTimeMs, timedOut: false },
    );
  }

  return (
    <div className="screen utility-screen">
      <div className="progress-bar-wrapper">
        <div className="progress-info">
          <span>{sequence}/{UTILITY_DESIGN.sequenceCount}</span>
          <span className="block-label">完了 {completedCount} / {UTILITY_DESIGN.sequenceCount}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {hasTimePressure && (
        <section className="time-pressure-panel" aria-label="制限時間">
          <div className="time-pressure-copy">
            <span>制限時間</span>
            <strong>{remainingSeconds}秒</strong>
          </div>
          <div className="time-pressure-track">
            <div
              key={`${sequenceIndex}-${timePressureSeconds}`}
              className="time-pressure-bar"
              style={{ animationDuration: `${timePressureSeconds}s` }}
            />
          </div>
        </section>
      )}

      <div className="question-box utility-question">
        <p>
          <strong>{LOTTERY_A_LABEL}</strong> と <strong>{LOTTERY_B_LABEL}</strong> のどちらを好むか、
          切り替え点となる行を1つ選んでください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="utility-form">
        <div className="utility-table" role="table" aria-label="効用測定表">
          <div className="utility-row utility-row-head" role="row">
            <div role="columnheader">Row</div>
            <div role="columnheader">{LOTTERY_A_LABEL}</div>
            <div role="columnheader">{LOTTERY_B_LABEL}</div>
            <div role="columnheader">選択</div>
          </div>

          {rows.map((row) => {
            const selectedChoice = choices[row.row];
            return (
              <div className="utility-row" role="row" key={row.row}>
                <div className="utility-row-num" role="cell">{row.row}</div>
                <div className="utility-lottery" role="cell">
                  <span>{Math.round(UTILITY_DESIGN.probability * 100)}%: {formatAmount(xPrev)}</span>
                  <span>{Math.round((1 - UTILITY_DESIGN.probability) * 100)}%: {formatAmount(UTILITY_DESIGN.RAmount)}</span>
                </div>
                <div className="utility-lottery" role="cell">
                  <span>{Math.round(UTILITY_DESIGN.probability * 100)}%: {formatAmount(row.xCandidate)}</span>
                  <span>{Math.round((1 - UTILITY_DESIGN.probability) * 100)}%: {formatAmount(UTILITY_DESIGN.rAmount)}</span>
                </div>
                <div className="utility-choice" role="cell">
                  <button
                    type="button"
                    className={`utility-choice-btn ${selectedChoice === "A" ? "selected" : ""} ${switchSelection?.row === row.row && switchSelection?.choice === "A" ? "is-clicked" : ""}`}
                    onClick={() => selectChoice(row.row, "A")}
                    disabled={loading || isFinished}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    className={`utility-choice-btn ${selectedChoice === "B" ? "selected" : ""} ${switchSelection?.row === row.row && switchSelection?.choice === "B" ? "is-clicked" : ""}`}
                    onClick={() => selectChoice(row.row, "B")}
                    disabled={loading || isFinished}
                  >
                    B
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className={`selection-summary ${switchSelection ? "" : "muted"}`}>
          {buildSwitchSummary()}
        </p>
        {validationError && <p className="error">{validationError}</p>}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading || isFinished || !switchSelection}>
          {loading ? "保存中..." : "次へ"}
        </button>
      </form>
    </div>
  );
}
