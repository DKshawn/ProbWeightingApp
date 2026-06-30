import { useEffect, useRef } from "react";

export default function UtilityCurvatureFrame({ onComplete, loading, error }) {
  const completedRef = useRef(false);

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "utility-curvature-complete") return;
      if (completedRef.current) return;

      completedRef.current = true;
      onComplete(event.data);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onComplete]);

  return (
    <div className="utility-curvature-host">
      <iframe
        title="Utility curvature block"
        src="/utility-curvature/index.html?embedded=1"
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
