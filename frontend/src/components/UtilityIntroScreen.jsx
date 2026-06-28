import { UTILITY_DESIGN } from "../utilityDesign";

export default function UtilityIntroScreen({ onContinue }) {
  const totalRows = UTILITY_DESIGN.sequenceCount * UTILITY_DESIGN.increments.length;

  return (
    <div className="screen break-screen">
      <div className="break-content utility-intro">
        <div className="step-label">Utility block</div>
        <h2>効用測定ブロック</h2>
        <p>
          全部で {UTILITY_DESIGN.sequenceCount} セット、合計 {totalRows} 行です。
        </p>
        <button className="btn-primary" onClick={onContinue}>
          Utility block を始める
        </button>
      </div>
    </div>
  );
}
