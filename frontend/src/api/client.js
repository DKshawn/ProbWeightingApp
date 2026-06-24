const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function startSession(studentId, name) {
  const res = await fetch(`${BASE_URL}/api/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ student_id: studentId, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "セッション開始に失敗しました");
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
    throw new Error(err.detail || "結果の保存に失敗しました");
  }
  return res.json();
}

export function getCsvUrl(studentId) {
  return `${BASE_URL}/api/results/${encodeURIComponent(studentId)}/csv`;
}
