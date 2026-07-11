import { useEffect, useRef } from "react";

function formatYen(value) {
  const amount = Math.round(Number(value) || 0);
  return `${amount.toLocaleString("ja-JP")}円`;
}

function paymentRows(paymentDetails) {
  return [1, 2, 3, 4].map((step) => {
    const detail = paymentDetails?.[`step${step}`] || {};
    return {
      step,
      selectedOption: detail.selected_option || "—",
      rewardAmount: detail.reward_amount,
    };
  });
}

export default function CiSettlementScreen({ settlement, loading, error, onLoad, onNext }) {
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!settlement && !loading && !requestedRef.current) {
      requestedRef.current = true;
      onLoad();
    }
  }, [settlement, loading, onLoad]);

  const rows = paymentRows(settlement?.selected_trial_payments);

  return (
    <div className="screen settlement-screen">
      <div className="settlement-content ci-settlement-content">
        <div className="step-label">CI 最終結果</div>
        <h2>CI module の最終総支払額</h2>

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
              <span>抽選された CI trial の合計金額</span>
              <strong>{formatYen(settlement.selected_trial_amount)}</strong>
            </div>
            <p className="settlement-note">
              全 CI trial の中から trial {settlement.selected_trial} をランダムに1つ選び、4つの Step の抽選結果を合計しています。
            </p>
            <section className="ci-settlement-steps" aria-label="抽選された CI trial の各 Step の結果">
              {rows.map((row) => (
                <div className="ci-settlement-step" key={row.step}>
                  <span>Step {row.step}</span>
                  <span>選択肢{row.selectedOption}</span>
                  <strong>{formatYen(row.rewardAmount)}</strong>
                </div>
              ))}
            </section>
            <button type="button" className="btn-primary" onClick={onNext}>
              PWF 最終結果へ進む
            </button>
          </>
        )}
      </div>
    </div>
  );
}
