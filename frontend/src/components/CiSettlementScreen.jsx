import { useEffect, useRef } from "react";

function formatYen(value) {
  const amount = Math.round(Number(value) || 0);
  return `${amount.toLocaleString("ja-JP")}円`;
}

function decisionLabel(decision) {
  if (decision === "mirror_step4") return "くじの比較";
  if (typeof decision === "string" && decision.startsWith("step")) {
    return `Step ${decision.slice(4)}`;
  }
  return "CI decision";
}

export default function CiSettlementScreen({ settlement, loading, error, onLoad, onNext }) {
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!settlement && !loading && !requestedRef.current) {
      requestedRef.current = true;
      onLoad();
    }
  }, [settlement, loading, onLoad]);

  const payment = settlement?.selected_trial_payments || null;

  return (
    <div className="screen settlement-screen">
      <div className="settlement-content ci-settlement-content">
        <div className="step-label">CI 最終結果</div>
        <h2>CI module の最終支払額</h2>

        {loading && <p className="saving">最終支払額を抽選しています...</p>}
        {error && (
          <div className="ci-settlement-error">
            <p className="error">{error}</p>
            <button type="button" className="btn-secondary" onClick={onLoad}>もう一度抽選する</button>
          </div>
        )}

        {settlement && (
          <>
            <div className="settlement-total">
              <span>抽選された1つの decision の獲得金額</span>
              <strong>{formatYen(settlement.selected_trial_amount)}</strong>
            </div>
            <p className="settlement-note">
              すべての CI decision の中から1つをランダムに選び、そのくじだけを抽選しました。
            </p>
            {payment && (
              <section className="ci-settlement-steps" aria-label="抽選された CI decision の結果">
                <div className="ci-settlement-step">
                  <span>{decisionLabel(payment.decision)}</span>
                  <span>選択肢{payment.selected_display_option || "—"}</span>
                  <strong>{formatYen(payment.reward_amount)}</strong>
                </div>
              </section>
            )}
            <button type="button" className="btn-primary" onClick={onNext}>
              PWF 最終結果へ進む
            </button>
          </>
        )}
      </div>
    </div>
  );
}
