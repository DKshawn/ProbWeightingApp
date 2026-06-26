export default function ProgressBar({ current, total, block, N }) {
  const pct = Math.round((current / total) * 100);
  const blockLabel = `第${block}ブロック：N=${N}`;

  return (
    <div className="progress-bar-wrapper">
      <div className="progress-info">
        <span>試行 {current} / {total}</span>
        <span className="block-label">{blockLabel}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
