const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const PWF_COMPREHENSION_VERSION = "2026-07-11-comprehension-v2";
const SAVE_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

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

export async function startSession(studentId, name, studyMode = "full", enrollment = {}) {
  const res = await fetch(`${BASE_URL}/api/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      name,
      study_mode: studyMode,
      gender: enrollment.gender,
      consent_version: enrollment.consentVersion,
      consent_accepted_at: enrollment.consentAcceptedAt,
      pwf_comprehension_version: PWF_COMPREHENSION_VERSION,
    }),
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
  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/api/session/${encodeURIComponent(sessionId)}/pwf-complete`, {
      method: "POST",
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("PWF 完了状態の保存がタイムアウトしました");
    }
    throw error;
  }
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

export async function savePwfComprehensionEvents(events) {
  let res;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/api/pwf-comprehension-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("理解度確認の記録保存がタイムアウトしました");
    }
    throw error;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "理解度確認の記録保存に失敗しました"));
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

export function getPwfComprehensionCsvUrl(studentId) {
  return `${BASE_URL}/api/pwf-comprehension-events/${encodeURIComponent(studentId)}/csv`;
}
