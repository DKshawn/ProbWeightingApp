import { useEffect, useRef } from "react";

export default function UtilityCurvatureFrame({ onStart, onRecord, onComplete, loading, error }) {
  const completedRef = useRef(false);
  const utilityCurvatureSrc = buildUtilityCurvatureSrc();

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "utility-curvature-start") {
        onStart(event.data);
        return;
      }
      if (event.data?.type === "utility-curvature-record") {
        onRecord(event.data);
        return;
      }
      if (event.data?.type !== "utility-curvature-complete") return;
      if (completedRef.current) return;

      completedRef.current = true;
      onComplete(event.data);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onStart, onRecord, onComplete]);

  return (
    <div className="utility-curvature-host">
      <iframe
        title="Utility curvature block"
        src={utilityCurvatureSrc}
        className="utility-curvature-frame"
      />
      {(loading || error) && (
        <div className="utility-curvature-overlay">
          {loading && <p>保存中...</p>}
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

function buildUtilityCurvatureSrc() {
  const sourceParams = new URLSearchParams(window.location.search);
  const targetParams = new URLSearchParams({ embedded: "1" });
  const isPilot =
    sourceParams.get("mode") === "pilot" ||
    sourceParams.get("study_mode") === "pilot" ||
    sourceParams.get("pilot") === "1";
  if (isPilot) targetParams.set("mode", "pilot");
  return `/utility-curvature/index.html?${targetParams.toString()}`;
}
