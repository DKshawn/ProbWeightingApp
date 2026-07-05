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

export default function PwfSettlementScreen({ records, onNext }) {
  const rewardRecords = (records || [])
    .map((record) => ({ record, amount: rewardAmount(record) }))
    .filter((item) => item.amount !== null)
    .sort((a, b) => Number(a.record.pwf_trial) - Number(b.record.pwf_trial));
  const total = rewardRecords.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="screen settlement-screen">
      <div className="settlement-content">
        <div className="step-label">PWF 結果</div>
        <h2>PWF課題の獲得金額</h2>
        <div className="settlement-total">
          <span>合計</span>
          <strong>{formatYen(total)}</strong>
        </div>
        <div className="settlement-list">
          {rewardRecords.length > 0 ? (
            rewardRecords.map(({ record, amount }) => {
              const reasons = penaltyReasons(record);
              return (
                <div
                  className={`settlement-row${reasons.length ? " settlement-row-zero" : ""}`}
                  key={`${record.session_id ?? ""}-${record.pwf_trial}`}
                >
                  <div>
                    <strong>{taskLabel(record)}</strong>
                    <span>{record.block_title}</span>
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
          CSV保存画面へ進む
        </button>
      </div>
    </div>
  );
}
