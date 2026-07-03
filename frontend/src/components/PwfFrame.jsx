import { useEffect, useRef } from "react";

export default function PwfFrame({ onStart, onRecord, onComplete, loading, error }) {
  const completedRef = useRef(false);
  const pwfSrc = buildPwfSrc();

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "pwf-start") {
        onStart(event.data);
        return;
      }
      if (event.data?.type === "pwf-record") {
        onRecord(event.data);
        return;
      }
      if (event.data?.type !== "pwf-complete") return;
      if (completedRef.current) return;

      completedRef.current = true;
      onComplete(event.data);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onStart, onRecord, onComplete]);

  return (
    <div className="pwf-host">
      <iframe
        title="PWF block"
        src={pwfSrc}
        className="pwf-frame"
      />
      {(loading || error) && (
        <div className="pwf-overlay">
          {loading && <p>保存中...</p>}
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
}

function buildPwfSrc() {
  const sourceParams = new URLSearchParams(window.location.search);
  const targetParams = new URLSearchParams({ embedded: "1" });
  const isPilot =
    sourceParams.get("mode") === "pilot" ||
    sourceParams.get("study_mode") === "pilot" ||
    sourceParams.get("pilot") === "1";
  if (isPilot) targetParams.set("mode", "pilot");
  return `/pwf/index.html?${targetParams.toString()}`;
}
