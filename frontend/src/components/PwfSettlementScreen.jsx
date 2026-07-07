import { useMemo } from "react";

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

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function settlementRecordKey({ record, amount }) {
  return [
    record?.session_id ?? "",
    record?.student_id ?? "",
    record?.study_mode ?? "",
    record?.pwf_trial ?? "",
    record?.task_id ?? "",
    record?.block_id ?? "",
    amount,
  ].join(":");
}

function storedSelectedIndex(signature, count) {
  if (!signature || count < 1) return -1;
  const fallback = () => Math.floor(Math.random() * count);

  try {
    const key = `pwf-final-payment-index:${hashString(signature)}`;
    const storedValue = window.localStorage.getItem(key);
    if (storedValue !== null) {
      const stored = Number(storedValue);
      if (Number.isInteger(stored) && stored >= 0 && stored < count) return stored;
    }

    const next = fallback();
    window.localStorage.setItem(key, String(next));
    return next;
  } catch {
    return fallback();
  }
}

export default function PwfSettlementScreen({ records, onNext }) {
  const rewardRecords = useMemo(
    () =>
      (records || [])
        .map((record) => ({ record, amount: rewardAmount(record) }))
        .filter((item) => item.amount !== null)
        .sort((a, b) => trialOrder(a.record) - trialOrder(b.record)),
    [records],
  );
  const recordsSignature = useMemo(
    () => rewardRecords.map(settlementRecordKey).join("|"),
    [rewardRecords],
  );
  const selectedIndex = useMemo(
    () => storedSelectedIndex(recordsSignature, rewardRecords.length),
    [recordsSignature, rewardRecords.length],
  );
  const selectedReward = selectedIndex >= 0 ? rewardRecords[selectedIndex] : null;

  return (
    <div className="screen settlement-screen">
      <div className="settlement-content">
        <div className="step-label">PWF 最終結果</div>
        <h2>PWF課題の最終支払額</h2>
        <div className="settlement-total">
          <span>抽選された課題の獲得金額</span>
          <strong>{formatYen(selectedReward?.amount ?? 0)}</strong>
        </div>
        {selectedReward && (
          <p className="settlement-note">
            PWF課題の中から1題を抽選し、その課題の獲得金額を最終支払額とします。
          </p>
        )}
        <div className="settlement-list">
          {rewardRecords.length > 0 ? (
            rewardRecords.map(({ record, amount }, index) => {
              const reasons = penaltyReasons(record);
              const selectedForPayment = index === selectedIndex;
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
          CSV保存画面へ進む
        </button>
      </div>
    </div>
  );
}
