import { useState } from "react";

export default function SetupScreen({ onSetup, loading, error }) {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [validationError, setValidationError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedStudentId = studentId.trim();
    const trimmedName = name.trim();

    if (!trimmedStudentId || !trimmedName) {
      setValidationError("学籍番号と氏名の両方を入力してください");
      return;
    }
    if (!/\d$/.test(trimmedStudentId)) {
      setValidationError("学籍番号の末尾は数字で入力してください");
      return;
    }
    setValidationError("");
    onSetup(trimmedStudentId, trimmedName);
  }

  return (
    <div className="screen setup-screen">
      <h1>確率加重実験</h1>
      <p className="subtitle">Compound Invariance 公理検証</p>

      <form onSubmit={handleSubmit} className="setup-form">
        <div className="field">
          <label htmlFor="studentId">学籍番号</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="例：2024001"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="name">氏名</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：山田太郎"
          />
        </div>

        {validationError && <p className="error">{validationError}</p>}
        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "読み込み中..." : "実験を始める"}
        </button>
      </form>
    </div>
  );
}
