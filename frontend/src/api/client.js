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

export async function saveCiResult(data) {
  const res = await fetch(`${BASE_URL}/api/ci-results`, {
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

export async function createCiSettlement(sessionId) {
  const res = await fetch(`${BASE_URL}/api/session/${encodeURIComponent(sessionId)}/ci-settlement`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "CI 最終支払額の抽選に失敗しました"));
  }
  return res.json();
}

export async function completePwfSession(sessionId) {
  const res = await fetch(`${BASE_URL}/api/session/${encodeURIComponent(sessionId)}/pwf-complete`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "PWF 完了状態の保存に失敗しました"));
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

export async function savePwfResults(results) {
  const res = await fetch(`${BASE_URL}/api/pwf-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ results }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "PWF 結果の保存に失敗しました"));
  }
  return res.json();
}

export function getCiCsvUrl(studentId) {
  return `${BASE_URL}/api/ci-results/${encodeURIComponent(studentId)}/csv`;
}

export function getUtilityCsvUrl(studentId) {
  return `${BASE_URL}/api/utility-results/${encodeURIComponent(studentId)}/csv`;
}

export function getPwfCsvUrl(studentId) {
  return `${BASE_URL}/api/pwf-results/${encodeURIComponent(studentId)}/csv`;
}
