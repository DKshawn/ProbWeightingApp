import { useEffect, useRef } from "react";

function rewardAmount(record) {
  const amount = Number(record?.payload?.feedback?.total_amount);
  return Number.isFinite(amount) ? Math.round(amount) : null;
}

function formatYen(value) {
  const rounded = Math.round(Number(value) || 0);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}¥${Math.abs(rounded).toLocaleString("ja-JP")}`;
}

function taskLabel(record) {
  const index = record?.task_index ?? record?.pwf_trial ?? "";
  const taskId = record?.task_id ? ` | ${record.task_id}` : "";
  return `PWF課題 ${index}${taskId}`;
}

function penaltyReasons(record) {
  const reasons = record?.payload?.feedback?.penalty_reasons;
  return Array.isArray(reasons) ? reasons.filter(Boolean) : [];
}

function trialOrder(record) {
  const trial = Number(record?.pwf_trial ?? record?.task_index ?? 0);
  return Number.isFinite(trial) ? trial : 0;
}

export default function PwfSettlementScreen({ records, settlement, loading, error, onLoad, onNext }) {
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!settlement && !loading && !requestedRef.current) {
      requestedRef.current = true;
      onLoad();
    }
  }, [settlement, loading, onLoad]);

  const rewardRecords = (records || [])
    .map((record) => ({ record, amount: rewardAmount(record) }))
    .filter((item) => item.amount !== null)
    .sort((a, b) => trialOrder(a.record) - trialOrder(b.record));
  const selectedTrial = Number(settlement?.selected_pwf_trial);
  const selectedPayment = settlement?.selected_pwf_payment || null;

  return (
    <div className="screen settlement-screen">
      <div className="settlement-content">
        <div className="step-label">PWF 最終結果</div>
        <h2>PWF課題の最終支払額</h2>

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
              <span>抽選された課題の獲得金額</span>
              <strong>{formatYen(settlement.selected_pwf_amount)}</strong>
            </div>
            <p className="settlement-note">
              PWF課題の中から1題をサーバーで抽選し、その結果を保存しました。
            </p>
            {selectedPayment && (
              <p className="settlement-note">
                抽選された課題：{selectedPayment.pwf_trial}（{selectedPayment.block_title || "PWF"}）
              </p>
            )}
            <div className="settlement-list">
              {rewardRecords.length > 0 ? (
                rewardRecords.map(({ record, amount }) => {
                  const reasons = penaltyReasons(record);
                  const selectedForPayment = Number(record.pwf_trial) === selectedTrial;
                  return (
                    <div
                      className={`settlement-row${reasons.length ? " settlement-row-zero" : ""}${
                        selectedForPayment ? " settlement-row-selected" : ""
                      }`}
                      key={`${record.session_id ?? ""}-${record.pwf_trial}`}
                    >
                      <div>
                        <strong>{taskLabel(record)}</strong>
                        <span>{record.block_title}</span>
                        {selectedForPayment && (
                          <span className="settlement-selected-badge">最終支払対象</span>
                        )}
                        {reasons.map((reason) => (
                          <span className="settlement-zero-reason" key={reason}>{reason}</span>
                        ))}
                      </div>
                      <strong>{formatYen(amount)}</strong>
                    </div>
                  );
                })
              ) : (
                <p className="settlement-empty">PWF課題の獲得金額を取得できませんでした。</p>
              )}
            </div>
            <button type="button" className="btn-primary" onClick={onNext}>
              ZIP保存画面へ進む
            </button>
          </>
        )}
      </div>
    </div>
  );
}
