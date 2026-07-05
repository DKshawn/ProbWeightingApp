import json
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
_memory_ci_results: list[dict[str, Any]] = []
_memory_utility_results: list[dict[str, Any]] = []
_memory_pwf_results: list[dict[str, Any]] = []


class StorageError(RuntimeError):
    pass


class StorageNotConfiguredError(StorageError):
    pass


class DuplicateSubmissionError(StorageError):
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
                CREATE TABLE IF NOT EXISTS experiment_sessions (
                    session_id UUID PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    trials JSONB NOT NULL,
                    status TEXT NOT NULL DEFAULT 'started',
                    pwf_completed BOOLEAN NOT NULL DEFAULT FALSE,
                    pwf_completed_at TIMESTAMPTZ,
                    completed_at TIMESTAMPTZ,
                    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS ci_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    trial INTEGER NOT NULL,
                    block INTEGER NOT NULL,
                    n INTEGER NOT NULL,
                    student_id_last_digit TEXT,
                    amount_level TEXT NOT NULL DEFAULT 'low',
                    amount_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1,
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
                    session_id UUID NOT NULL REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
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

                CREATE TABLE IF NOT EXISTS pwf_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    pwf_trial INTEGER NOT NULL,
                    participant TEXT NOT NULL,
                    assignment_group INTEGER,
                    assignment_modulus INTEGER,
                    student_id_last3 TEXT,
                    student_id_last_digit TEXT,
                    amount_level TEXT,
                    amount_multiplier DOUBLE PRECISION,
                    assigned_block_id TEXT,
                    block_id TEXT,
                    block_title TEXT,
                    task_id TEXT,
                    is_anchor BOOLEAN NOT NULL DEFAULT FALSE,
                    task_index INTEGER,
                    task_type TEXT,
                    task_mode TEXT,
                    time_limit_seconds INTEGER,
                    timed_out BOOLEAN NOT NULL DEFAULT FALSE,
                    time_over_seconds DOUBLE PRECISION,
                    has_memory_task BOOLEAN NOT NULL DEFAULT FALSE,
                    memory_digits INTEGER,
                    memory_seconds INTEGER,
                    memory_number TEXT,
                    memory_input_pre TEXT,
                    memory_pre_correct BOOLEAN,
                    memory_input_post TEXT,
                    memory_post_correct BOOLEAN,
                    memory_display_duration_ms INTEGER,
                    memory_pre_response_time_ms INTEGER,
                    memory_post_response_time_ms INTEGER,
                    response_type TEXT,
                    estimate DOUBLE PRECISION,
                    switch_lower DOUBLE PRECISION,
                    switch_upper DOUBLE PRECISION,
                    switch_row INTEGER,
                    switch_direction TEXT,
                    switch_status TEXT,
                    monotonic BOOLEAN,
                    response_time_ms INTEGER,
                    prompt TEXT,
                    payload JSONB NOT NULL,
                    source_timestamp TEXT,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (session_id, pwf_trial)
                );

                ALTER TABLE experiment_sessions
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    ADD COLUMN IF NOT EXISTS time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'started',
                    ADD COLUMN IF NOT EXISTS pwf_completed BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS pwf_completed_at TIMESTAMPTZ,
                    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
                    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

                ALTER TABLE experiment_sessions
                    DROP CONSTRAINT IF EXISTS experiment_sessions_status_check;

                ALTER TABLE experiment_sessions
                    ADD CONSTRAINT experiment_sessions_status_check
                    CHECK (status IN ('started', 'in_progress', 'completed'));

                ALTER TABLE ci_results
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    ADD COLUMN IF NOT EXISTS time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS student_id_last_digit TEXT,
                    ADD COLUMN IF NOT EXISTS amount_level TEXT NOT NULL DEFAULT 'low',
                    ADD COLUMN IF NOT EXISTS amount_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1,
                    ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
                    ADD COLUMN IF NOT EXISTS timed_out BOOLEAN NOT NULL DEFAULT FALSE;

                ALTER TABLE ci_results
                    DROP CONSTRAINT IF EXISTS ci_results_choice_check;

                ALTER TABLE ci_results
                    ADD CONSTRAINT ci_results_choice_check
                    CHECK (choice IN ('X', 'Indifferent', 'Y', 'Timeout'));

                ALTER TABLE utility_results
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS timed_out BOOLEAN NOT NULL DEFAULT FALSE;

                ALTER TABLE pwf_results
                    ADD COLUMN IF NOT EXISTS student_id_last_digit TEXT,
                    ADD COLUMN IF NOT EXISTS amount_level TEXT,
                    ADD COLUMN IF NOT EXISTS amount_multiplier DOUBLE PRECISION,
                    ADD COLUMN IF NOT EXISTS has_memory_task BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS memory_digits INTEGER,
                    ADD COLUMN IF NOT EXISTS memory_seconds INTEGER,
                    ADD COLUMN IF NOT EXISTS memory_number TEXT,
                    ADD COLUMN IF NOT EXISTS memory_input_pre TEXT,
                    ADD COLUMN IF NOT EXISTS memory_pre_correct BOOLEAN,
                    ADD COLUMN IF NOT EXISTS memory_input_post TEXT,
                    ADD COLUMN IF NOT EXISTS memory_post_correct BOOLEAN,
                    ADD COLUMN IF NOT EXISTS memory_display_duration_ms INTEGER,
                    ADD COLUMN IF NOT EXISTS memory_pre_response_time_ms INTEGER,
                    ADD COLUMN IF NOT EXISTS memory_post_response_time_ms INTEGER;

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

                CREATE INDEX IF NOT EXISTS idx_ci_results_student_id
                    ON ci_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_ci_results_summary
                    ON ci_results(block, n, trial);

                CREATE INDEX IF NOT EXISTS idx_ci_results_experiment_mode
                    ON ci_results(experiment_mode);

                CREATE INDEX IF NOT EXISTS idx_utility_results_student_id
                    ON utility_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_utility_results_sequence
                    ON utility_results(sequence, row);

                CREATE INDEX IF NOT EXISTS idx_pwf_results_student_id
                    ON pwf_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_pwf_results_block
                    ON pwf_results(block_id, task_index);

                CREATE INDEX IF NOT EXISTS idx_experiment_sessions_resume
                    ON experiment_sessions(student_id, study_mode, status, last_seen_at DESC, created_at DESC);

                CREATE UNIQUE INDEX IF NOT EXISTS idx_experiment_sessions_one_completed_per_student_mode
                    ON experiment_sessions(student_id, study_mode)
                    WHERE status = 'completed';
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
            "session_id": session_id,
            "student_id": student_id,
            "name": name,
            "study_mode": study_mode,
            "experiment_mode": experiment_mode,
            "time_pressure_seconds": time_pressure_seconds,
            "trials": trials,
            "status": "started",
            "pwf_completed": False,
            "pwf_completed_at": None,
            "completed_at": None,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO experiment_sessions (
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
                "SELECT EXISTS (SELECT 1 FROM experiment_sessions WHERE session_id = %s)",
                (session_id,),
            )
            row = cur.fetchone()
    return bool(row["exists"])


def _normalize_session(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    normalized = dict(row)
    for field in ("created_at", "last_seen_at", "completed_at", "pwf_completed_at"):
        value = normalized.get(field)
        if isinstance(value, datetime):
            normalized[field] = value.isoformat()
    normalized["session_id"] = str(normalized["session_id"])
    return normalized


def get_session(session_id: str) -> dict[str, Any] | None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        session = _memory_sessions.get(session_id)
        return _normalize_session(session) if session else None

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    name,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trials,
                    status,
                    pwf_completed,
                    pwf_completed_at,
                    completed_at,
                    last_seen_at,
                    created_at
                FROM experiment_sessions
                WHERE session_id = %s
                """,
                (session_id,),
            )
            row = cur.fetchone()
    return _normalize_session(row)


def find_completed_submission(student_id: str, study_mode: str) -> dict[str, Any] | None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        completed = [
            session
            for session in _memory_sessions.values()
            if (
                session.get("student_id") == student_id
                and session.get("study_mode") == study_mode
                and session.get("status") == "completed"
            )
        ]
        if not completed:
            return None
        completed.sort(key=lambda item: (item.get("completed_at") or "", item.get("created_at") or ""), reverse=True)
        return _normalize_session(completed[0])

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    name,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trials,
                    status,
                    pwf_completed,
                    pwf_completed_at,
                    completed_at,
                    last_seen_at,
                    created_at
                FROM experiment_sessions
                WHERE student_id = %s AND study_mode = %s AND status = 'completed'
                ORDER BY completed_at DESC NULLS LAST, created_at DESC
                LIMIT 1
                """,
                (student_id, study_mode),
            )
            row = cur.fetchone()
    return _normalize_session(row)


def get_resume_session(student_id: str, study_mode: str) -> dict[str, Any] | None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        active = [
            session
            for session in _memory_sessions.values()
            if (
                session.get("student_id") == student_id
                and session.get("study_mode") == study_mode
                and session.get("status") != "completed"
            )
        ]
        if not active:
            return None
        active.sort(key=lambda item: (item.get("last_seen_at") or "", item.get("created_at") or ""), reverse=True)
        return _normalize_session(active[0])

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    name,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trials,
                    status,
                    pwf_completed,
                    pwf_completed_at,
                    completed_at,
                    last_seen_at,
                    created_at
                FROM experiment_sessions
                WHERE student_id = %s AND study_mode = %s AND status <> 'completed'
                ORDER BY last_seen_at DESC NULLS LAST, created_at DESC
                LIMIT 1
                """,
                (student_id, study_mode),
            )
            row = cur.fetchone()
    return _normalize_session(row)


def touch_session(session_id: str, status: str | None = None) -> None:
    timestamp = datetime.now(timezone.utc)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        session = _memory_sessions.get(session_id)
        if not session:
            return
        session["last_seen_at"] = timestamp.isoformat()
        if status and session.get("status") != "completed":
            session["status"] = status
        return

    ensure_schema()
    status_sql = ", status = %s" if status else ""
    params: tuple[Any, ...] = (timestamp, status, session_id) if status else (timestamp, session_id)
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                UPDATE experiment_sessions
                SET last_seen_at = %s{status_sql}
                WHERE session_id = %s AND status <> 'completed'
                """,
                params,
            )
        conn.commit()


def has_other_completed_submission(session_id: str) -> bool:
    session = get_session(session_id)
    if not session:
        return False

    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return any(
            item.get("session_id") != session_id
            and item.get("student_id") == session["student_id"]
            and item.get("study_mode") == session["study_mode"]
            and item.get("status") == "completed"
            for item in _memory_sessions.values()
        )

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM experiment_sessions
                    WHERE student_id = %s
                      AND study_mode = %s
                      AND status = 'completed'
                      AND session_id <> %s
                )
                """,
                (session["student_id"], session["study_mode"], session_id),
            )
            row = cur.fetchone()
    return bool(row["exists"])


def mark_pwf_completed(session_id: str) -> None:
    timestamp = datetime.now(timezone.utc)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        session = _memory_sessions.get(session_id)
        if not session:
            return
        if session.get("status") != "completed":
            session["status"] = "in_progress"
        session["pwf_completed"] = True
        session["pwf_completed_at"] = timestamp.isoformat()
        session["last_seen_at"] = timestamp.isoformat()
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE experiment_sessions
                SET
                    pwf_completed = TRUE,
                    pwf_completed_at = COALESCE(pwf_completed_at, %s),
                    last_seen_at = %s,
                    status = CASE WHEN status = 'completed' THEN status ELSE 'in_progress' END
                WHERE session_id = %s
                """,
                (timestamp, timestamp, session_id),
            )
        conn.commit()


def save_ci_result(record: dict[str, Any]) -> None:
    timestamp = datetime.now(timezone.utc)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        memory_record = {**record, "Timestamp": timestamp.isoformat()}
        existing_index = next(
            (
                i
                for i, item in enumerate(_memory_ci_results)
                if item["session_id"] == record["session_id"] and item["trial"] == record["trial"]
            ),
            None,
        )
        if existing_index is None:
            _memory_ci_results.append(memory_record)
        else:
            _memory_ci_results[existing_index] = memory_record
        touch_session(record["session_id"], "in_progress")
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ci_results (
                    session_id, student_id, name, study_mode, experiment_mode, time_pressure_seconds,
                    trial, block, n, student_id_last_digit, amount_level, amount_multiplier,
                    p, q, r, x, x_prime,
                    y, s, y_prime,
                    pn, qn, rn, sn,
                    choice, ci_satisfied, response_time_ms, timed_out, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(name)s, %(study_mode)s,
                    %(experiment_mode)s, %(time_pressure_seconds)s,
                    %(trial)s, %(block)s, %(N)s,
                    %(student_id_last_digit)s, %(amount_level)s, %(amount_multiplier)s,
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
                    student_id_last_digit = EXCLUDED.student_id_last_digit,
                    amount_level = EXCLUDED.amount_level,
                    amount_multiplier = EXCLUDED.amount_multiplier,
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
    touch_session(record["session_id"], "in_progress")


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
            touch_session(record["session_id"], "in_progress")
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
    if records:
        touch_session(records[0]["session_id"], "in_progress")


def _none_if_blank(value: Any) -> Any:
    return None if value == "" else value


def _optional_int(value: Any) -> int | None:
    value = _none_if_blank(value)
    if value is None:
        return None
    return int(value)


def _optional_float(value: Any) -> float | None:
    value = _none_if_blank(value)
    if value is None:
        return None
    return float(value)


def _optional_bool(value: Any) -> bool | None:
    value = _none_if_blank(value)
    if value is None:
        return None
    return bool(value)


def _flatten_pwf_record(record: dict[str, Any], timestamp: datetime) -> dict[str, Any]:
    payload = record.get("payload") or {}
    feedback = payload.get("feedback") if isinstance(payload.get("feedback"), dict) else {}
    estimate = (
        payload.get("ce_estimate")
        if payload.get("ce_estimate") is not None
        else payload.get("estimate")
        if payload.get("estimate") is not None
        else payload.get("value")
    )
    return {
        "session_id": record["session_id"],
        "student_id": record["student_id"],
        "name": record["name"],
        "study_mode": record.get("study_mode", "full"),
        "pwf_trial": record["pwf_trial"],
        "participant": record.get("participant") or record["student_id"],
        "assignment_group": _optional_int(record.get("assignment_group")),
        "assignment_modulus": _optional_int(record.get("assignment_modulus")),
        "student_id_last3": record.get("student_id_last3", ""),
        "student_id_last_digit": record.get("student_id_last_digit", ""),
        "amount_level": record.get("amount_level", ""),
        "amount_multiplier": _optional_float(record.get("amount_multiplier")),
        "assigned_block_id": record.get("assigned_block_id", ""),
        "block_id": record.get("block_id", ""),
        "block_title": record.get("block_title", ""),
        "task_id": record.get("task_id", ""),
        "is_anchor": bool(record.get("is_anchor", False)),
        "task_index": _optional_int(record.get("task_index")),
        "task_type": record.get("task_type", ""),
        "task_mode": record.get("task_mode", ""),
        "time_limit_seconds": _optional_int(record.get("time_limit_seconds")),
        "timed_out": bool(record.get("timed_out", False)),
        "time_over_seconds": _optional_float(record.get("time_over_seconds")),
        "has_memory_task": bool(record.get("has_memory_task", False)),
        "memory_digits": _optional_int(record.get("memory_digits")),
        "memory_seconds": _optional_int(record.get("memory_seconds")),
        "memory_number": record.get("memory_number", ""),
        "memory_input_pre": record.get("memory_input_pre", ""),
        "memory_pre_correct": _optional_bool(record.get("memory_pre_correct")),
        "memory_input_post": record.get("memory_input_post", ""),
        "memory_post_correct": _optional_bool(record.get("memory_post_correct")),
        "memory_display_duration_ms": _optional_int(record.get("memory_display_duration_ms")),
        "memory_pre_response_time_ms": _optional_int(record.get("memory_pre_response_time_ms")),
        "memory_post_response_time_ms": _optional_int(record.get("memory_post_response_time_ms")),
        "response_type": payload.get("response_type", ""),
        "estimate": _optional_float(estimate),
        "switch_lower": _optional_float(payload.get("switch_lower") if payload.get("switch_lower") is not None else payload.get("final_low")),
        "switch_upper": _optional_float(payload.get("switch_upper") if payload.get("switch_upper") is not None else payload.get("final_high")),
        "switch_row": _optional_int(payload.get("switch_row")),
        "switch_direction": payload.get("switch_direction", ""),
        "switch_status": payload.get("switch_status", ""),
        "monotonic": _optional_bool(payload.get("monotonic")),
        "response_time_ms": _optional_int(record.get("response_time_ms")),
        "reward_total_amount": _optional_float(feedback.get("total_amount")),
        "reward_raw_total_amount": _optional_float(feedback.get("raw_total_amount")),
        "reward_item_count": _optional_int(feedback.get("item_count")),
        "reward_penalty_reasons": "; ".join(feedback.get("penalty_reasons", []) or []),
        "reward_settled_at": feedback.get("settled_at", ""),
        "prompt": record.get("prompt", ""),
        "payload": payload,
        "source_timestamp": record.get("timestamp", ""),
        "timestamp": timestamp,
    }


def save_pwf_results(records: list[dict[str, Any]]) -> None:
    timestamp = datetime.now(timezone.utc)
    flattened_records = [_flatten_pwf_record(record, timestamp) for record in records]

    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        for record in flattened_records:
            memory_record = {**record, "Timestamp": timestamp.isoformat()}
            existing_index = next(
                (
                    i
                    for i, item in enumerate(_memory_pwf_results)
                    if (
                        item["session_id"] == record["session_id"]
                        and item["pwf_trial"] == record["pwf_trial"]
                    )
                ),
                None,
            )
            if existing_index is None:
                _memory_pwf_results.append(memory_record)
            else:
                _memory_pwf_results[existing_index] = memory_record
            touch_session(record["session_id"], "in_progress")
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO pwf_results (
                    session_id, student_id, name, study_mode, pwf_trial,
                    participant, assignment_group, assignment_modulus, student_id_last3,
                    student_id_last_digit, amount_level, amount_multiplier,
                    assigned_block_id, block_id, block_title, task_id, is_anchor,
                    task_index, task_type, task_mode, time_limit_seconds, timed_out,
                    time_over_seconds, has_memory_task, memory_digits, memory_seconds,
                    memory_number, memory_input_pre, memory_pre_correct, memory_input_post,
                    memory_post_correct, memory_display_duration_ms, memory_pre_response_time_ms,
                    memory_post_response_time_ms, response_type, estimate, switch_lower, switch_upper,
                    switch_row, switch_direction, switch_status, monotonic,
                    response_time_ms, prompt, payload, source_timestamp, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(name)s, %(study_mode)s, %(pwf_trial)s,
                    %(participant)s, %(assignment_group)s, %(assignment_modulus)s, %(student_id_last3)s,
                    %(student_id_last_digit)s, %(amount_level)s, %(amount_multiplier)s,
                    %(assigned_block_id)s, %(block_id)s, %(block_title)s, %(task_id)s, %(is_anchor)s,
                    %(task_index)s, %(task_type)s, %(task_mode)s, %(time_limit_seconds)s, %(timed_out)s,
                    %(time_over_seconds)s, %(has_memory_task)s, %(memory_digits)s, %(memory_seconds)s,
                    %(memory_number)s, %(memory_input_pre)s, %(memory_pre_correct)s, %(memory_input_post)s,
                    %(memory_post_correct)s, %(memory_display_duration_ms)s, %(memory_pre_response_time_ms)s,
                    %(memory_post_response_time_ms)s, %(response_type)s, %(estimate)s, %(switch_lower)s, %(switch_upper)s,
                    %(switch_row)s, %(switch_direction)s, %(switch_status)s, %(monotonic)s,
                    %(response_time_ms)s, %(prompt)s, %(payload)s, %(source_timestamp)s, %(timestamp)s
                )
                ON CONFLICT (session_id, pwf_trial) DO UPDATE SET
                    student_id = EXCLUDED.student_id,
                    name = EXCLUDED.name,
                    study_mode = EXCLUDED.study_mode,
                    participant = EXCLUDED.participant,
                    assignment_group = EXCLUDED.assignment_group,
                    assignment_modulus = EXCLUDED.assignment_modulus,
                    student_id_last3 = EXCLUDED.student_id_last3,
                    student_id_last_digit = EXCLUDED.student_id_last_digit,
                    amount_level = EXCLUDED.amount_level,
                    amount_multiplier = EXCLUDED.amount_multiplier,
                    assigned_block_id = EXCLUDED.assigned_block_id,
                    block_id = EXCLUDED.block_id,
                    block_title = EXCLUDED.block_title,
                    task_id = EXCLUDED.task_id,
                    is_anchor = EXCLUDED.is_anchor,
                    task_index = EXCLUDED.task_index,
                    task_type = EXCLUDED.task_type,
                    task_mode = EXCLUDED.task_mode,
                    time_limit_seconds = EXCLUDED.time_limit_seconds,
                    timed_out = EXCLUDED.timed_out,
                    time_over_seconds = EXCLUDED.time_over_seconds,
                    has_memory_task = EXCLUDED.has_memory_task,
                    memory_digits = EXCLUDED.memory_digits,
                    memory_seconds = EXCLUDED.memory_seconds,
                    memory_number = EXCLUDED.memory_number,
                    memory_input_pre = EXCLUDED.memory_input_pre,
                    memory_pre_correct = EXCLUDED.memory_pre_correct,
                    memory_input_post = EXCLUDED.memory_input_post,
                    memory_post_correct = EXCLUDED.memory_post_correct,
                    memory_display_duration_ms = EXCLUDED.memory_display_duration_ms,
                    memory_pre_response_time_ms = EXCLUDED.memory_pre_response_time_ms,
                    memory_post_response_time_ms = EXCLUDED.memory_post_response_time_ms,
                    response_type = EXCLUDED.response_type,
                    estimate = EXCLUDED.estimate,
                    switch_lower = EXCLUDED.switch_lower,
                    switch_upper = EXCLUDED.switch_upper,
                    switch_row = EXCLUDED.switch_row,
                    switch_direction = EXCLUDED.switch_direction,
                    switch_status = EXCLUDED.switch_status,
                    monotonic = EXCLUDED.monotonic,
                    response_time_ms = EXCLUDED.response_time_ms,
                    prompt = EXCLUDED.prompt,
                    payload = EXCLUDED.payload,
                    source_timestamp = EXCLUDED.source_timestamp,
                    timestamp = EXCLUDED.timestamp
                """,
                [{**record, "payload": Jsonb(record["payload"])} for record in flattened_records],
            )
        conn.commit()
    if records:
        touch_session(records[0]["session_id"], "in_progress")


def _normalize_result(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    timestamp = normalized.get("Timestamp")
    if isinstance(timestamp, datetime):
        normalized["Timestamp"] = timestamp.isoformat()
    return normalized


def get_ci_results_by_session(session_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            r
            for r in sorted(
                _memory_ci_results,
                key=lambda item: (item.get("trial", 0), item.get("Timestamp", "")),
            )
            if r.get("session_id") == session_id
        ]

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    name,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trial,
                    block,
                    n AS "N",
                    student_id_last_digit,
                    amount_level,
                    amount_multiplier,
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
                FROM ci_results
                WHERE session_id = %s
                ORDER BY trial ASC
                """,
                (session_id,),
            )
            rows = cur.fetchall()
    return [_normalize_result(row) for row in rows]


def get_pwf_results_by_session(session_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            r
            for r in sorted(
                _memory_pwf_results,
                key=lambda item: (item.get("pwf_trial", 0), item.get("Timestamp", "")),
            )
            if r.get("session_id") == session_id
        ]

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    name,
                    study_mode,
                    pwf_trial,
                    participant,
                    assignment_group,
                    assignment_modulus,
                    student_id_last3,
                    student_id_last_digit,
                    amount_level,
                    amount_multiplier,
                    assigned_block_id,
                    block_id,
                    block_title,
                    task_id,
                    is_anchor,
                    task_index,
                    task_type,
                    task_mode,
                    time_limit_seconds,
                    timed_out,
                    time_over_seconds,
                    has_memory_task,
                    memory_digits,
                    memory_seconds,
                    memory_number,
                    memory_input_pre,
                    memory_pre_correct,
                    memory_input_post,
                    memory_post_correct,
                    memory_display_duration_ms,
                    memory_pre_response_time_ms,
                    memory_post_response_time_ms,
                    response_type,
                    estimate,
                    switch_lower,
                    switch_upper,
                    switch_row,
                    switch_direction,
                    switch_status,
                    monotonic,
                    response_time_ms,
                    prompt,
                    payload,
                    source_timestamp,
                    timestamp AS "Timestamp"
                FROM pwf_results
                WHERE session_id = %s
                ORDER BY pwf_trial ASC
                """,
                (session_id,),
            )
            rows = cur.fetchall()
    return [_normalize_result(row) for row in rows]


def _trial_count_from_session(session: dict[str, Any]) -> int:
    trials = session.get("trials") or []
    if isinstance(trials, str):
        try:
            trials = json.loads(trials)
        except json.JSONDecodeError:
            return 0
    return len(trials) if isinstance(trials, list) else 0


def mark_session_completed_if_ready(session_id: str) -> bool:
    session = get_session(session_id)
    if not session:
        return False

    expected_trials = _trial_count_from_session(session)
    if expected_trials <= 0:
        return False

    saved_trials = {int(row["trial"]) for row in get_ci_results_by_session(session_id)}
    if len(saved_trials) < expected_trials:
        return False

    timestamp = datetime.now(timezone.utc)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        if has_other_completed_submission(session_id):
            raise DuplicateSubmissionError("This student already has a completed submission for this study mode.")
        memory_session = _memory_sessions.get(session_id)
        if not memory_session:
            return False
        memory_session["status"] = "completed"
        memory_session["completed_at"] = memory_session.get("completed_at") or timestamp.isoformat()
        memory_session["last_seen_at"] = timestamp.isoformat()
        return True

    ensure_schema()
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE experiment_sessions
                    SET
                        status = 'completed',
                        completed_at = COALESCE(completed_at, %s),
                        last_seen_at = %s
                    WHERE session_id = %s
                    """,
                    (timestamp, timestamp, session_id),
                )
            conn.commit()
    except psycopg.errors.UniqueViolation as exc:
        raise DuplicateSubmissionError("This student already has a completed submission for this study mode.") from exc

    return True


def get_ci_results_by_student(student_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            r
            for r in sorted(
                _memory_ci_results,
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
                    student_id_last_digit,
                    amount_level,
                    amount_multiplier,
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
                FROM ci_results
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


def get_pwf_results_by_student(student_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            r
            for r in sorted(
                _memory_pwf_results,
                key=lambda item: (item.get("Timestamp", ""), item.get("session_id", ""), item.get("pwf_trial", 0)),
            )
            if r.get("student_id") == student_id
        ]

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    name,
                    study_mode,
                    pwf_trial,
                    participant,
                    assignment_group,
                    assignment_modulus,
                    student_id_last3,
                    student_id_last_digit,
                    amount_level,
                    amount_multiplier,
                    assigned_block_id,
                    block_id,
                    block_title,
                    task_id,
                    is_anchor,
                    task_index,
                    task_type,
                    task_mode,
                    time_limit_seconds,
                    timed_out,
                    time_over_seconds,
                    has_memory_task,
                    memory_digits,
                    memory_seconds,
                    memory_number,
                    memory_input_pre,
                    memory_pre_correct,
                    memory_input_post,
                    memory_post_correct,
                    memory_display_duration_ms,
                    memory_pre_response_time_ms,
                    memory_post_response_time_ms,
                    response_type,
                    estimate,
                    switch_lower,
                    switch_upper,
                    switch_row,
                    switch_direction,
                    switch_status,
                    monotonic,
                    response_time_ms,
                    prompt,
                    payload,
                    source_timestamp,
                    timestamp AS "Timestamp"
                FROM pwf_results
                WHERE student_id = %s
                ORDER BY timestamp ASC, session_id ASC, pwf_trial ASC
                """,
                (student_id,),
            )
            rows = cur.fetchall()
    return [_normalize_result(row) for row in rows]


def _rate(ci_count: int, total: int) -> float | None:
    return round(ci_count / total, 4) if total else None


def get_summary() -> dict[str, Any]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return _summary_from_rows(_memory_ci_results)

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM ci_results
                """
            )
            overall = cur.fetchone()

            cur.execute(
                """
                SELECT experiment_mode, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM ci_results
                GROUP BY experiment_mode
                ORDER BY experiment_mode
                """
            )
            by_mode_rows = cur.fetchall()

            cur.execute(
                """
                SELECT block, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM ci_results
                GROUP BY block
                ORDER BY block
                """
            )
            by_block_rows = cur.fetchall()

            cur.execute(
                """
                SELECT n, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM ci_results
                GROUP BY n
                ORDER BY n
                """
            )
            by_n_rows = cur.fetchall()

            cur.execute(
                """
                SELECT trial, COUNT(*) AS total, COUNT(*) FILTER (WHERE ci_satisfied) AS ci_count
                FROM ci_results
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
