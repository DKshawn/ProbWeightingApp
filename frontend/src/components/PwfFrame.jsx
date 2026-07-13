import { useCallback, useEffect, useRef, useState } from "react";

export default function PwfFrame({
  onStart,
  onRecord,
  onComprehensionEvents,
  onComplete,
  onRetryFailedRecords,
  recordRetryAvailable,
  loading,
  error,
}) {
  const completedRef = useRef(false);
  const pendingCompletionRef = useRef(null);
  const frameRef = useRef(null);
  const [completionRetryAvailable, setCompletionRetryAvailable] = useState(false);
  const pwfSrc = buildPwfSrc();

  const submitCompletion = useCallback(async (message) => {
    if (completedRef.current) return;
    completedRef.current = true;
    pendingCompletionRef.current = message;
    setCompletionRetryAvailable(false);

    try {
      const completed = await onComplete(message);
      if (completed === false) {
        completedRef.current = false;
        setCompletionRetryAvailable(true);
      } else {
        pendingCompletionRef.current = null;
      }
    } catch {
      completedRef.current = false;
      setCompletionRetryAvailable(true);
    }
  }, [onComplete]);

  const saveComprehensionEvents = useCallback(async (message) => {
    const attemptedEventIds = Array.isArray(message?.events)
      ? message.events.map((event) => String(event?.event_id || "")).filter(Boolean)
      : [];
    const target = frameRef.current?.contentWindow;

    try {
      const response = await onComprehensionEvents(message);
      const confirmedEventIds = Array.isArray(response?.confirmed_event_ids)
        ? response.confirmed_event_ids.map(String)
        : [];
      if (!attemptedEventIds.every((eventId) => confirmedEventIds.includes(eventId))) {
        throw new Error("Comprehension event acknowledgement is incomplete");
      }
      target?.postMessage({
        type: "pwf-comprehension-events-saved",
        participant: message?.participant,
        session_id: response?.session_id,
        confirmed_event_ids: confirmedEventIds,
        confirmed_pass_event_ids: Array.isArray(response?.confirmed_pass_event_ids)
          ? response.confirmed_pass_event_ids.map(String)
          : [],
      }, window.location.origin);
    } catch {
      target?.postMessage({
        type: "pwf-comprehension-events-error",
        participant: message?.participant,
        attempted_event_ids: attemptedEventIds,
      }, window.location.origin);
    }
  }, [onComprehensionEvents]);

  const retryFailedRecords = useCallback(async () => {
    const recovered = await onRetryFailedRecords();
    if (recovered && pendingCompletionRef.current) {
      await submitCompletion(pendingCompletionRef.current);
    }
  }, [onRetryFailedRecords, submitCompletion]);

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "pwf-start") {
        onStart(event.data);
        return;
      }
      if (event.data?.type === "pwf-record") {
        onRecord(event.data);
        return;
      }
      if (event.data?.type === "pwf-comprehension-events") {
        void saveComprehensionEvents(event.data);
        return;
      }
      if (event.data?.type !== "pwf-complete") return;
      if (completedRef.current) return;

      void submitCompletion(event.data);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onStart, onRecord, saveComprehensionEvents, submitCompletion]);

  return (
    <div className="pwf-host">
      <iframe
        ref={frameRef}
        title="PWF block"
        src={pwfSrc}
        className="pwf-frame"
      />
      {(loading || error || recordRetryAvailable || completionRetryAvailable) && (
        <div className="pwf-overlay">
          {loading && <p>保存中...</p>}
          {error && <p className="error">{error}</p>}
          {recordRetryAvailable && !loading && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void retryFailedRecords()}
            >
              保存を再試行
            </button>
          )}
          {completionRetryAvailable && !recordRetryAvailable && !loading && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void submitCompletion(pendingCompletionRef.current)}
            >
              保存を再試行
            </button>
          )}
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
