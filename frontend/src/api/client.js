const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function formatApiError(errorBody, fallbackMessage) {
  const detail = errorBody?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item?.msg === "string") return item.msg;
        if (typeof item?.message === "string") return item.message;
        return "";
      })
      .filter(Boolean);

    return messages.length ? messages.join(" / ") : fallbackMessage;
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || fallbackMessage;
  }

  return errorBody?.message || fallbackMessage;
}

export async function startSession(studentId, name, studyMode = "full") {
  const res = await fetch(`${BASE_URL}/api/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, name, study_mode: studyMode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "セッション開始に失敗しました"));
  }
  return res.json();
}

export async function saveResult(data) {
  const res = await fetch(`${BASE_URL}/api/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "結果の保存に失敗しました"));
  }
  return res.json();
}

export async function saveUtilityResults(results) {
  const res = await fetch(`${BASE_URL}/api/utility-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Utility 結果の保存に失敗しました"));
  }
  return res.json();
}

export function getCsvUrl(studentId) {
  return `${BASE_URL}/api/results/${encodeURIComponent(studentId)}/csv`;
}

export function getUtilityCsvUrl(studentId) {
  return `${BASE_URL}/api/utility-results/${encodeURIComponent(studentId)}/csv`;
}
