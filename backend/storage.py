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
_memory_utility_results: list[dict[str, Any]] = []


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
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    trials JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS trial_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES prob_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
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
                    choice TEXT NOT NULL CHECK (choice IN ('X', 'Indifferent', 'Y', 'Timeout')),
                    ci_satisfied BOOLEAN NOT NULL,
                    response_time_ms INTEGER,
                    timed_out BOOLEAN NOT NULL DEFAULT FALSE,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (session_id, trial)
                );

                CREATE TABLE IF NOT EXISTS utility_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES prob_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    utility_trial INTEGER NOT NULL,
                    sequence INTEGER NOT NULL,
                    row INTEGER NOT NULL,
                    p DOUBLE PRECISION NOT NULL,
                    r_amount DOUBLE PRECISION NOT NULL,
                    capital_r_amount DOUBLE PRECISION NOT NULL,
                    x_prev DOUBLE PRECISION NOT NULL,
                    x_candidate DOUBLE PRECISION NOT NULL,
                    increment DOUBLE PRECISION NOT NULL,
                    choice TEXT NOT NULL CHECK (choice IN ('A', 'B', 'Timeout')),
                    x_estimate DOUBLE PRECISION,
                    switch_lower DOUBLE PRECISION,
                    switch_upper DOUBLE PRECISION,
                    switch_status TEXT NOT NULL CHECK (
                        switch_status IN ('bracketed', 'below_range', 'above_range', 'timeout')
                    ),
                    response_time_ms INTEGER,
                    timed_out BOOLEAN NOT NULL DEFAULT FALSE,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (session_id, utility_trial)
                );

                ALTER TABLE prob_sessions
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    ADD COLUMN IF NOT EXISTS time_pressure_seconds INTEGER NOT NULL DEFAULT 0;

                ALTER TABLE trial_results
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    ADD COLUMN IF NOT EXISTS time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
                    ADD COLUMN IF NOT EXISTS timed_out BOOLEAN NOT NULL DEFAULT FALSE;

                ALTER TABLE trial_results
                    DROP CONSTRAINT IF EXISTS trial_results_choice_check;

                ALTER TABLE trial_results
                    ADD CONSTRAINT trial_results_choice_check
                    CHECK (choice IN ('X', 'Indifferent', 'Y', 'Timeout'));

                ALTER TABLE utility_results
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS timed_out BOOLEAN NOT NULL DEFAULT FALSE;

                ALTER TABLE utility_results
                    DROP CONSTRAINT IF EXISTS utility_results_choice_check;

                ALTER TABLE utility_results
                    ADD CONSTRAINT utility_results_choice_check
                    CHECK (choice IN ('A', 'B', 'Timeout'));

                ALTER TABLE utility_results
                    DROP CONSTRAINT IF EXISTS utility_results_switch_status_check;

                ALTER TABLE utility_results
                    ADD CONSTRAINT utility_results_switch_status_check
                    CHECK (switch_status IN ('bracketed', 'below_range', 'above_range', 'timeout'));

                CREATE INDEX IF NOT EXISTS idx_trial_results_student_id
                    ON trial_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_trial_results_summary
                    ON trial_results(block, n, trial);

                CREATE INDEX IF NOT EXISTS idx_trial_results_experiment_mode
                    ON trial_results(experiment_mode);

                CREATE INDEX IF NOT EXISTS idx_utility_results_student_id
                    ON utility_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_utility_results_sequence
                    ON utility_results(sequence, row);
                """
            )
        conn.commit()
    _schema_ready = True


def create_session(
    session_id: str,
    student_id: str,
    name: str,
    trials: list[dict],
    study_mode: str = "full",
    experiment_mode: str = "normal",
    time_pressure_seconds: int = 0,
) -> None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        _memory_sessions[session_id] = {
            "student_id": student_id,
            "name": name,
            "study_mode": study_mode,
            "experiment_mode": experiment_mode,
            "time_pressure_seconds": time_pressure_seconds,
            "trials": trials,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO prob_sessions (
                    session_id, student_id, name, study_mode, experiment_mode, time_pressure_seconds, trials
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (session_id, student_id, name, study_mode, experiment_mode, time_pressure_seconds, Jsonb(trials)),
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
                    session_id, student_id, name, study_mode, experiment_mode, time_pressure_seconds,
                    trial, block, n,
                    p, q, r, x, x_prime,
                    y, s, y_prime,
                    pn, qn, rn, sn,
                    choice, ci_satisfied, response_time_ms, timed_out, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(name)s, %(study_mode)s,
                    %(experiment_mode)s, %(time_pressure_seconds)s,
                    %(trial)s, %(block)s, %(N)s,
                    %(p)s, %(q)s, %(r)s, %(x)s, %(x_prime)s,
                    %(y)s, %(s)s, %(y_prime)s,
                    %(pN)s, %(qN)s, %(rN)s, %(sN)s,
                    %(choice)s, %(ci_satisfied)s, %(response_time_ms)s, %(timed_out)s, %(timestamp)s
                )
                ON CONFLICT (session_id, trial) DO UPDATE SET
                    student_id = EXCLUDED.student_id,
                    name = EXCLUDED.name,
                    study_mode = EXCLUDED.study_mode,
                    experiment_mode = EXCLUDED.experiment_mode,
                    time_pressure_seconds = EXCLUDED.time_pressure_seconds,
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
                    response_time_ms = EXCLUDED.response_time_ms,
                    timed_out = EXCLUDED.timed_out,
                    timestamp = EXCLUDED.timestamp
                """,
                {**record, "timestamp": timestamp},
            )
        conn.commit()


def save_utility_results(records: list[dict[str, Any]]) -> None:
    timestamp = datetime.now(timezone.utc)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        for record in records:
            memory_record = {**record, "Timestamp": timestamp.isoformat()}
            existing_index = next(
                (
                    i
                    for i, item in enumerate(_memory_utility_results)
                    if (
                        item["session_id"] == record["session_id"]
                        and item["utility_trial"] == record["utility_trial"]
                    )
                ),
                None,
            )
            if existing_index is None:
                _memory_utility_results.append(memory_record)
            else:
                _memory_utility_results[existing_index] = memory_record
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO utility_results (
                    session_id, student_id, name, study_mode, experiment_mode, time_pressure_seconds,
                    utility_trial, sequence, row,
                    p, r_amount, capital_r_amount,
                    x_prev, x_candidate, increment,
                    choice, x_estimate, switch_lower, switch_upper, switch_status,
                    response_time_ms, timed_out, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(name)s, %(study_mode)s,
                    %(experiment_mode)s, %(time_pressure_seconds)s,
                    %(utility_trial)s, %(sequence)s, %(row)s,
                    %(p)s, %(r_amount)s, %(R_amount)s,
                    %(x_prev)s, %(x_candidate)s, %(increment)s,
                    %(choice)s, %(x_estimate)s, %(switch_lower)s, %(switch_upper)s,
                    %(switch_status)s, %(response_time_ms)s, %(timed_out)s, %(timestamp)s
                )
                ON CONFLICT (session_id, utility_trial) DO UPDATE SET
                    student_id = EXCLUDED.student_id,
                    name = EXCLUDED.name,
                    study_mode = EXCLUDED.study_mode,
                    experiment_mode = EXCLUDED.experiment_mode,
                    time_pressure_seconds = EXCLUDED.time_pressure_seconds,
                    sequence = EXCLUDED.sequence,
                    row = EXCLUDED.row,
                    p = EXCLUDED.p,
                    r_amount = EXCLUDED.r_amount,
                    capital_r_amount = EXCLUDED.capital_r_amount,
                    x_prev = EXCLUDED.x_prev,
                    x_candidate = EXCLUDED.x_candidate,
                    increment = EXCLUDED.increment,
                    choice = EXCLUDED.choice,
                    x_estimate = EXCLUDED.x_estimate,
                    switch_lower = EXCLUDED.switch_lower,
                    switch_upper = EXCLUDED.switch_upper,
                    switch_status = EXCLUDED.switch_status,
                    response_time_ms = EXCLUDED.response_time_ms,
                    timed_out = EXCLUDED.timed_out,
                    timestamp = EXCLUDED.timestamp
                """,
                [{**record, "timestamp": timestamp} for record in records],
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
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
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
                    response_time_ms,
                    timed_out,
                    timestamp AS "Timestamp"
                FROM trial_results
                WHERE student_id = %s
                ORDER BY timestamp ASC, session_id ASC, trial ASC
                """,
                (student_id,),
            )
            rows = cur.fetchall()
    return [_normalize_result(row) for row in rows]


def get_utility_results_by_student(student_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            r
            for r in sorted(
                _memory_utility_results,
                key=lambda item: (item.get("Timestamp", ""), item.get("session_id", ""), item.get("utility_trial", 0)),
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
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    utility_trial,
                    sequence,
                    row,
                    p,
                    r_amount,
                    capital_r_amount AS "R_amount",
                    x_prev,
                    x_candidate,
                    increment,
                    choice,
                    x_estimate,
                    switch_lower,
                    switch_upper,
                    switch_status,
                    response_time_ms,
                    timed_out,
                    timestamp AS "Timestamp"
                FROM utility_results
                WHERE student_id = %s
                ORDER BY timestamp ASC, session_id ASC, utility_trial ASC
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
                SELECT experiment_mode, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM trial_results
                GROUP BY experiment_mode
                ORDER BY experiment_mode
                """
            )
            by_mode_rows = cur.fetchall()

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

    return _format_summary(overall, by_mode_rows, by_block_rows, by_n_rows, by_trial_rows)


def _summary_from_rows(rows: list[dict[str, Any]]) -> dict[str, Any]:
    overall = {
        "total": len(rows),
        "ci_count": sum(1 for row in rows if row.get("ci_satisfied")),
    }

    grouped: dict[str, dict[str, dict[str, int]]] = {
        "experiment_mode": {},
        "block": {},
        "N": {},
        "trial": {},
    }
    for row in rows:
        for field in grouped:
            key = str(row.get(field, "normal"))
            grouped[field].setdefault(key, {"total": 0, "ci_count": 0})
            grouped[field][key]["total"] += 1
            if row.get("ci_satisfied"):
                grouped[field][key]["ci_count"] += 1

    by_mode_rows = [
        {"experiment_mode": k, **v} for k, v in sorted(grouped["experiment_mode"].items())
    ]
    by_block_rows = [
        {"block": int(k), **v} for k, v in sorted(grouped["block"].items(), key=lambda item: int(item[0]))
    ]
    by_n_rows = [{"n": int(k), **v} for k, v in sorted(grouped["N"].items(), key=lambda item: int(item[0]))]
    by_trial_rows = [
        {"trial": int(k), **v} for k, v in sorted(grouped["trial"].items(), key=lambda item: int(item[0]))
    ]
    return _format_summary(overall, by_mode_rows, by_block_rows, by_n_rows, by_trial_rows)


def _format_summary(
    overall: dict[str, Any],
    by_mode_rows: list[dict[str, Any]],
    by_block_rows: list[dict[str, Any]],
    by_n_rows: list[dict[str, Any]],
    by_trial_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    total = int(overall["total"])
    ci_count = int(overall["ci_count"])

    return {
        "total_trials": total,
        "ci_rate_overall": _rate(ci_count, total),
        "by_experiment_mode": {
            row["experiment_mode"]: {
                "total": int(row["total"]),
                "ci_count": int(row["ci_count"]),
                "ci_rate": _rate(int(row["ci_count"]), int(row["total"])),
            }
            for row in by_mode_rows
        },
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
