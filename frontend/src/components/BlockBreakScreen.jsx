export default function BlockBreakScreen({ nextTrial, onContinue }) {
  const nextBlock = nextTrial?.block ?? 2;
  const nextN = nextTrial?.N ?? "";
  const completedBlock = Math.max(1, nextBlock - 1);

  return (
    <div className="screen break-screen">
      <div className="break-content">
        <h2>第{completedBlock}ブロックが終了しました</h2>
        <p>お疲れ様でした。</p>
        <p>次は第{nextBlock}ブロック{nextN && `（N=${nextN}）`}です。</p>
        <p>引き続きよろしくお願いします。</p>
        <button className="btn-primary" onClick={onContinue}>
          第{nextBlock}ブロックを始める
        </button>
      </div>
    </div>
  );
}
