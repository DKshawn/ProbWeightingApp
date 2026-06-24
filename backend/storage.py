import os
from datetime import datetime, timezone
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


DATABASE_URL = os.getenv("DATABASE_URL")
ALLOW_MEMORY_STORAGE = os.getenv("ALLOW_MEMORY_STORAGE") == "1"

_schema_ready = False
_memory_sessions: dict[str, dict[str, Any]] = {}
_memory_results: list[dict[str, Any]] = []


class StorageError(RuntimeError):
    pass


class StorageNotConfiguredError(StorageError):
    pass


def storage_mode() -> str:
    if DATABASE_URL:
        return "postgres"
    if ALLOW_MEMORY_STORAGE:
        return "memory"
    return "unconfigured"


def _ensure_database_configured() -> None:
    if not DATABASE_URL:
        raise StorageNotConfiguredError(
            "DATABASE_URL is not configured. Set it to your Neon Postgres connection string, "
            "or set ALLOW_MEMORY_STORAGE=1 for local-only development."
        )


def _connect():
    _ensure_database_configured()
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def ensure_schema() -> None:
    global _schema_ready
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return
    if _schema_ready:
        return

    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS prob_sessions (
                    session_id UUID PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    trials JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS trial_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES prob_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    trial INTEGER NOT NULL,
                    block INTEGER NOT NULL,
                    n INTEGER NOT NULL,
                    p DOUBLE PRECISION NOT NULL,
                    q DOUBLE PRECISION NOT NULL,
                    r DOUBLE PRECISION NOT NULL,
                    x DOUBLE PRECISION NOT NULL,
                    x_prime DOUBLE PRECISION NOT NULL,
                    y DOUBLE PRECISION NOT NULL,
                    s DOUBLE PRECISION NOT NULL,
                    y_prime DOUBLE PRECISION NOT NULL,
                    pn DOUBLE PRECISION NOT NULL,
                    qn DOUBLE PRECISION NOT NULL,
                    rn DOUBLE PRECISION NOT NULL,
                    sn DOUBLE PRECISION NOT NULL,
                    choice TEXT NOT NULL CHECK (choice IN ('X', 'Indifferent', 'Y')),
                    ci_satisfied BOOLEAN NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (session_id, trial)
                );

                CREATE INDEX IF NOT EXISTS idx_trial_results_student_id
                    ON trial_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_trial_results_summary
                    ON trial_results(block, n, trial);
                """
            )
        conn.commit()
    _schema_ready = True


def create_session(session_id: str, student_id: str, name: str, trials: list[dict]) -> None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        _memory_sessions[session_id] = {
            "student_id": student_id,
            "name": name,
            "trials": trials,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO prob_sessions (session_id, student_id, name, trials)
                VALUES (%s, %s, %s, %s)
                """,
                (session_id, student_id, name, Jsonb(trials)),
            )
        conn.commit()


def session_exists(session_id: str) -> bool:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return session_id in _memory_sessions

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT EXISTS (SELECT 1 FROM prob_sessions WHERE session_id = %s)",
                (session_id,),
            )
            row = cur.fetchone()
    return bool(row["exists"])


def save_result(record: dict[str, Any]) -> None:
    timestamp = datetime.now(timezone.utc)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        memory_record = {**record, "Timestamp": timestamp.isoformat()}
        existing_index = next(
            (
                i
                for i, item in enumerate(_memory_results)
                if item["session_id"] == record["session_id"] and item["trial"] == record["trial"]
            ),
            None,
        )
        if existing_index is None:
            _memory_results.append(memory_record)
        else:
            _memory_results[existing_index] = memory_record
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO trial_results (
                    session_id, student_id, name, trial, block, n,
                    p, q, r, x, x_prime,
                    y, s, y_prime,
                    pn, qn, rn, sn,
                    choice, ci_satisfied, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(name)s, %(trial)s, %(block)s, %(N)s,
                    %(p)s, %(q)s, %(r)s, %(x)s, %(x_prime)s,
                    %(y)s, %(s)s, %(y_prime)s,
                    %(pN)s, %(qN)s, %(rN)s, %(sN)s,
                    %(choice)s, %(ci_satisfied)s, %(timestamp)s
                )
                ON CONFLICT (session_id, trial) DO UPDATE SET
                    student_id = EXCLUDED.student_id,
                    name = EXCLUDED.name,
                    block = EXCLUDED.block,
                    n = EXCLUDED.n,
                    p = EXCLUDED.p,
                    q = EXCLUDED.q,
                    r = EXCLUDED.r,
                    x = EXCLUDED.x,
                    x_prime = EXCLUDED.x_prime,
                    y = EXCLUDED.y,
                    s = EXCLUDED.s,
                    y_prime = EXCLUDED.y_prime,
                    pn = EXCLUDED.pn,
                    qn = EXCLUDED.qn,
                    rn = EXCLUDED.rn,
                    sn = EXCLUDED.sn,
                    choice = EXCLUDED.choice,
                    ci_satisfied = EXCLUDED.ci_satisfied,
                    timestamp = EXCLUDED.timestamp
                """,
                {**record, "timestamp": timestamp},
            )
        conn.commit()


def _normalize_result(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    timestamp = normalized.get("Timestamp")
    if isinstance(timestamp, datetime):
        normalized["Timestamp"] = timestamp.isoformat()
    return normalized


def get_results_by_student(student_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            r
            for r in sorted(
                _memory_results,
                key=lambda item: (item.get("Timestamp", ""), item.get("session_id", ""), item.get("trial", 0)),
            )
            if r.get("student_id") == student_id
        ]

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    student_id,
                    name,
                    trial,
                    block,
                    n AS "N",
                    p,
                    q,
                    r,
                    x,
                    x_prime,
                    y,
                    s,
                    y_prime,
                    pn AS "pN",
                    qn AS "qN",
                    rn AS "rN",
                    sn AS "sN",
                    choice,
                    ci_satisfied,
                    timestamp AS "Timestamp"
                FROM trial_results
                WHERE student_id = %s
                ORDER BY timestamp ASC, session_id ASC, trial ASC
                """,
                (student_id,),
            )
            rows = cur.fetchall()
    return [_normalize_result(row) for row in rows]


def _rate(ci_count: int, total: int) -> float | None:
    return round(ci_count / total, 4) if total else None


def get_summary() -> dict[str, Any]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return _summary_from_rows(_memory_results)

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM trial_results
                """
            )
            overall = cur.fetchone()

            cur.execute(
                """
                SELECT block, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM trial_results
                GROUP BY block
                ORDER BY block
                """
            )
            by_block_rows = cur.fetchall()

            cur.execute(
                """
                SELECT n, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM trial_results
                GROUP BY n
                ORDER BY n
                """
            )
            by_n_rows = cur.fetchall()

            cur.execute(
                """
                SELECT trial, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM trial_results
                GROUP BY trial
                ORDER BY trial
                """
            )
            by_trial_rows = cur.fetchall()

    return _format_summary(overall, by_block_rows, by_n_rows, by_trial_rows)


def _summary_from_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    overall = {
        "total": len(rows),
        "ci_count": sum(1 for row in rows if row.get("ci_satisfied")),
    }

    grouped: dict[str, dict[str, dict[str, int]]] = {
        "block": {},
        "N": {},
        "trial": {},
    }
    for row in rows:
        for field in grouped:
            key = str(row[field])
            grouped[field].setdefault(key, {"total": 0, "ci_count": 0})
            grouped[field][key]["total"] += 1
            if row.get("ci_satisfied"):
                grouped[field][key]["ci_count"] += 1

    by_block_rows = [
        {"block": int(k), **v} for k, v in sorted(grouped["block"].items(), key=lambda item: int(item[0]))
    ]
    by_n_rows = [{"n": int(k), **v} for k, v in sorted(grouped["N"].items(), key=lambda item: int(item[0]))]
    by_trial_rows = [
        {"trial": int(k), **v} for k, v in sorted(grouped["trial"].items(), key=lambda item: int(item[0]))
    ]
    return _format_summary(overall, by_block_rows, by_n_rows, by_trial_rows)


def _format_summary(
    overall: dict[str, Any],
    by_block_rows: list[dict[str, Any]],
    by_n_rows: list[dict[str, Any]],
    by_trial_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    total = int(overall["total"])
    ci_count = int(overall["ci_count"])

    return {
        "total_trials": total,
        "ci_rate_overall": _rate(ci_count, total),
        "by_block": {
            str(row["block"]): {
                "total": int(row["total"]),
                "ci_count": int(row["ci_count"]),
                "ci_rate": _rate(int(row["ci_count"]), int(row["total"])),
            }
            for row in by_block_rows
        },
        "by_N": {
            str(row["n"]): {
                "total": int(row["total"]),
                "ci_count": int(row["ci_count"]),
                "ci_rate": _rate(int(row["ci_count"]), int(row["total"])),
            }
            for row in by_n_rows
        },
        "by_trial": {
            str(row["trial"]): {
                "total": int(row["total"]),
                "ci_count": int(row["ci_count"]),
                "ci_rate": _rate(int(row["ci_count"]), int(row["total"])),
            }
            for row in by_trial_rows
        },
    }
