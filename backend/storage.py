import hashlib
import json
import os
import random
import time
from datetime import datetime, timezone
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


DATABASE_URL = os.getenv("DATABASE_URL")
ALLOW_MEMORY_STORAGE = os.getenv("ALLOW_MEMORY_STORAGE") == "1"

_schema_ready = False
_SCHEMA_LOCK_ID = 440866261
_RETRYABLE_DB_ERRORS = (
    psycopg.errors.DeadlockDetected,
    psycopg.errors.SerializationFailure,
    psycopg.errors.LockNotAvailable,
    psycopg.OperationalError,
)
_memory_sessions: dict[str, dict[str, Any]] = {}
_memory_ci_results: list[dict[str, Any]] = []
_memory_ci_settlements: dict[str, dict[str, Any]] = {}
_memory_utility_results: list[dict[str, Any]] = []
_memory_pwf_results: list[dict[str, Any]] = []
_memory_pwf_comprehension_events: list[dict[str, Any]] = []


class StorageError(RuntimeError):
    pass


class StorageNotConfiguredError(StorageError):
    pass


class DuplicateSubmissionError(StorageError):
    pass


def hash_student_id(student_id: str) -> str:
    """Return the stable SHA-256 anonymized identifier for a student ID."""
    normalized_id = str(student_id).strip()
    return hashlib.sha256(normalized_id.encode("utf-8")).hexdigest()


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


def _database_schema_ready(cur) -> bool:
    required_columns = {
        "experiment_sessions": {
            "session_id", "student_id", "student_id_hash", "name", "gender", "consent_version", "consent_accepted_at", "study_mode", "experiment_mode",
            "time_pressure_seconds", "trials", "status", "pwf_completed",
            "pwf_completed_at", "pwf_comprehension_version", "completed_at", "last_seen_at", "created_at",
        },
        "ci_results": {
            "session_id", "student_id", "student_id_hash", "name", "gender", "study_mode", "experiment_mode",
            "time_pressure_seconds", "trial", "block", "n", "student_id_last_digit",
            "amount_level", "amount_multiplier", "p", "q", "r", "x", "x_prime",
            "y", "s", "y_prime", "pn", "qn", "rn", "sn", "choice",
            "ci_satisfied", "response_time_ms", "timed_out", "payment_details",
            "trial_payment_total", "mirror_order", "mirror_left_option", "mirror_right_option",
            "mirror_choice", "mirror_canonical_choice", "mirror_ci_satisfied",
            "mirror_response_time_ms", "mirror_timed_out", "mirror_timestamp", "timestamp",
        },
        "ci_settlements": {
            "session_id", "student_id", "student_id_hash", "name", "study_mode",
            "selected_trial", "selected_trial_amount", "payment_rule",
            "selected_trial_payments", "settled_at",
        },
        "utility_results": {
            "session_id", "student_id", "student_id_hash", "name", "study_mode", "experiment_mode",
            "time_pressure_seconds", "utility_trial", "sequence", "row", "p",
            "r_amount", "capital_r_amount", "x_prev", "x_candidate",
            "increment", "choice", "x_estimate", "switch_lower", "switch_upper",
            "switch_status", "response_time_ms", "timed_out", "timestamp",
        },
        "pwf_results": {
            "session_id", "student_id", "student_id_hash", "name", "gender", "study_mode", "pwf_trial",
            "participant", "assignment_group", "assignment_modulus",
            "student_id_last3", "student_id_last_digit", "amount_level",
            "amount_multiplier", "assigned_block_id", "block_id", "block_title",
            "task_id", "is_anchor", "task_index", "task_type", "task_mode",
            "time_limit_seconds", "timed_out", "time_over_seconds",
            "has_memory_task", "memory_digits", "memory_seconds", "memory_number",
            "memory_input_pre", "memory_pre_correct", "memory_input_post",
            "memory_post_correct", "memory_display_duration_ms",
            "memory_pre_response_time_ms", "memory_post_response_time_ms",
            "response_type", "estimate", "switch_lower", "switch_upper",
            "switch_row", "switch_direction", "switch_status", "monotonic",
            "response_time_ms", "prompt", "payload", "source_timestamp", "timestamp",
        },
        "pwf_comprehension_events": {
            "event_id", "session_id", "question_set_version", "sequence",
            "event_type", "outcome", "round_number", "attempt_number",
            "attempt_in_round", "attempt_limit", "attempts_before", "attempts_after",
            "answers", "incorrect_question_ids", "correct_count", "passed",
            "locked_after", "source_timestamp", "timestamp",
        },
    }
    cur.execute(
        """
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY(%s)
        """,
        (list(required_columns),),
    )
    actual_columns: dict[str, set[str]] = {table: set() for table in required_columns}
    for row in cur.fetchall():
        actual_columns.setdefault(row["table_name"], set()).add(row["column_name"])
    return all(
        required.issubset(actual_columns.get(table, set()))
        for table, required in required_columns.items()
    )


def _backfill_student_id_hashes(cur) -> None:
    """Populate the new anonymized identifier for rows saved before this column existed."""
    table_keys = (
        ("experiment_sessions", "session_id"),
        ("ci_results", "id"),
        ("utility_results", "id"),
        ("pwf_results", "id"),
    )
    for table_name, key_column in table_keys:
        cur.execute(
            f"SELECT {key_column}, student_id FROM {table_name} WHERE student_id_hash IS NULL"
        )
        rows = cur.fetchall()
        if not rows:
            continue
        cur.executemany(
            f"UPDATE {table_name} SET student_id_hash = %s WHERE {key_column} = %s",
            [(hash_student_id(row["student_id"]), row[key_column]) for row in rows],
        )


def _with_retry(operation, *, attempts: int = 3):
    for attempt in range(attempts):
        try:
            return operation()
        except _RETRYABLE_DB_ERRORS:
            if attempt + 1 >= attempts:
                raise
            time.sleep((0.05 * (2 ** attempt)) + random.uniform(0, 0.05))
    return None


def ensure_schema() -> None:
    global _schema_ready
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return
    if _schema_ready:
        return

    with _connect() as conn:
        with conn.cursor() as cur:
            if _database_schema_ready(cur):
                _schema_ready = True
                return

            cur.execute("SELECT pg_advisory_xact_lock(%s)", (_SCHEMA_LOCK_ID,))
            if _database_schema_ready(cur):
                _schema_ready = True
                return

            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS experiment_sessions (
                    session_id UUID PRIMARY KEY,
                    student_id TEXT NOT NULL,
                    student_id_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
                    consent_version TEXT NOT NULL,
                    consent_accepted_at TIMESTAMPTZ NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    trials JSONB NOT NULL,
                    status TEXT NOT NULL DEFAULT 'started',
                    pwf_completed BOOLEAN NOT NULL DEFAULT FALSE,
                    pwf_completed_at TIMESTAMPTZ,
                    pwf_comprehension_version TEXT,
                    completed_at TIMESTAMPTZ,
                    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS ci_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    student_id_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
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
                    payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
                    trial_payment_total DOUBLE PRECISION NOT NULL DEFAULT 0,
                    mirror_order INTEGER,
                    mirror_left_option TEXT,
                    mirror_right_option TEXT,
                    mirror_choice TEXT,
                    mirror_canonical_choice TEXT,
                    mirror_ci_satisfied BOOLEAN,
                    mirror_response_time_ms INTEGER,
                    mirror_timed_out BOOLEAN,
                    mirror_timestamp TIMESTAMPTZ,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    UNIQUE (session_id, trial)
                );

                CREATE TABLE IF NOT EXISTS ci_settlements (
                    session_id UUID PRIMARY KEY REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    student_id_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    study_mode TEXT NOT NULL DEFAULT 'full',
                    selected_trial INTEGER NOT NULL,
                    selected_trial_amount DOUBLE PRECISION NOT NULL,
                    payment_rule TEXT NOT NULL,
                    selected_trial_payments JSONB NOT NULL DEFAULT '{}'::jsonb,
                    settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                CREATE TABLE IF NOT EXISTS utility_results (
                    id BIGSERIAL PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
                    student_id TEXT NOT NULL,
                    student_id_hash TEXT NOT NULL,
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
                    student_id_hash TEXT NOT NULL,
                    name TEXT NOT NULL,
                    gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
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

                CREATE TABLE IF NOT EXISTS pwf_comprehension_events (
                    event_id UUID PRIMARY KEY,
                    session_id UUID NOT NULL REFERENCES experiment_sessions(session_id) ON DELETE CASCADE,
                    question_set_version TEXT NOT NULL,
                    sequence INTEGER NOT NULL CHECK (sequence >= 1),
                    event_type TEXT NOT NULL CHECK (event_type IN ('submission', 'unlock')),
                    outcome TEXT NOT NULL CHECK (outcome IN ('failed', 'locked', 'passed', 'unlocked')),
                    round_number INTEGER NOT NULL CHECK (round_number >= 1),
                    attempt_number INTEGER CHECK (attempt_number IS NULL OR attempt_number >= 1),
                    attempt_in_round INTEGER CHECK (attempt_in_round IS NULL OR attempt_in_round >= 1),
                    attempt_limit INTEGER NOT NULL CHECK (attempt_limit BETWEEN 1 AND 3),
                    attempts_before INTEGER NOT NULL CHECK (attempts_before BETWEEN 0 AND 3),
                    attempts_after INTEGER NOT NULL CHECK (attempts_after BETWEEN 0 AND 3),
                    answers JSONB NOT NULL,
                    incorrect_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
                    correct_count INTEGER NOT NULL CHECK (correct_count BETWEEN 0 AND 6),
                    passed BOOLEAN NOT NULL,
                    locked_after BOOLEAN NOT NULL,
                    source_timestamp TIMESTAMPTZ NOT NULL,
                    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );

                ALTER TABLE experiment_sessions
                    ADD COLUMN IF NOT EXISTS student_id_hash TEXT,
                    ADD COLUMN IF NOT EXISTS gender TEXT,
                    ADD COLUMN IF NOT EXISTS consent_version TEXT,
                    ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ,
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    ADD COLUMN IF NOT EXISTS time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'started',
                    ADD COLUMN IF NOT EXISTS pwf_completed BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS pwf_completed_at TIMESTAMPTZ,
                    ADD COLUMN IF NOT EXISTS pwf_comprehension_version TEXT,
                    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
                    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

                ALTER TABLE experiment_sessions
                    DROP CONSTRAINT IF EXISTS experiment_sessions_status_check;

                ALTER TABLE experiment_sessions
                    ADD CONSTRAINT experiment_sessions_status_check
                    CHECK (status IN ('started', 'in_progress', 'completed'));

                ALTER TABLE ci_results
                    ADD COLUMN IF NOT EXISTS student_id_hash TEXT,
                    ADD COLUMN IF NOT EXISTS gender TEXT,
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'normal',
                    ADD COLUMN IF NOT EXISTS time_pressure_seconds INTEGER NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS student_id_last_digit TEXT,
                    ADD COLUMN IF NOT EXISTS amount_level TEXT NOT NULL DEFAULT 'low',
                    ADD COLUMN IF NOT EXISTS amount_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1,
                    ADD COLUMN IF NOT EXISTS response_time_ms INTEGER,
                    ADD COLUMN IF NOT EXISTS timed_out BOOLEAN NOT NULL DEFAULT FALSE,
                    ADD COLUMN IF NOT EXISTS payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
                    ADD COLUMN IF NOT EXISTS trial_payment_total DOUBLE PRECISION NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS mirror_order INTEGER,
                    ADD COLUMN IF NOT EXISTS mirror_left_option TEXT,
                    ADD COLUMN IF NOT EXISTS mirror_right_option TEXT,
                    ADD COLUMN IF NOT EXISTS mirror_choice TEXT,
                    ADD COLUMN IF NOT EXISTS mirror_canonical_choice TEXT,
                    ADD COLUMN IF NOT EXISTS mirror_ci_satisfied BOOLEAN,
                    ADD COLUMN IF NOT EXISTS mirror_response_time_ms INTEGER,
                    ADD COLUMN IF NOT EXISTS mirror_timed_out BOOLEAN,
                    ADD COLUMN IF NOT EXISTS mirror_timestamp TIMESTAMPTZ;

                ALTER TABLE ci_results
                    DROP CONSTRAINT IF EXISTS ci_results_choice_check;

                ALTER TABLE ci_results
                    ADD CONSTRAINT ci_results_choice_check
                    CHECK (choice IN ('X', 'Indifferent', 'Y', 'Timeout'));

                ALTER TABLE ci_results
                    DROP CONSTRAINT IF EXISTS ci_results_mirror_order_check,
                    DROP CONSTRAINT IF EXISTS ci_results_mirror_left_option_check,
                    DROP CONSTRAINT IF EXISTS ci_results_mirror_right_option_check,
                    DROP CONSTRAINT IF EXISTS ci_results_mirror_choice_check,
                    DROP CONSTRAINT IF EXISTS ci_results_mirror_canonical_choice_check;

                ALTER TABLE ci_results
                    ADD CONSTRAINT ci_results_mirror_order_check
                        CHECK (mirror_order IS NULL OR mirror_order >= 1),
                    ADD CONSTRAINT ci_results_mirror_left_option_check
                        CHECK (mirror_left_option IS NULL OR mirror_left_option IN ('X', 'Y')),
                    ADD CONSTRAINT ci_results_mirror_right_option_check
                        CHECK (mirror_right_option IS NULL OR mirror_right_option IN ('X', 'Y')),
                    ADD CONSTRAINT ci_results_mirror_choice_check
                        CHECK (mirror_choice IS NULL OR mirror_choice IN ('X', 'Indifferent', 'Y', 'Timeout')),
                    ADD CONSTRAINT ci_results_mirror_canonical_choice_check
                        CHECK (
                            mirror_canonical_choice IS NULL
                            OR mirror_canonical_choice IN ('X', 'Indifferent', 'Y', 'Timeout')
                        );

                ALTER TABLE utility_results
                    ADD COLUMN IF NOT EXISTS student_id_hash TEXT,
                    ADD COLUMN IF NOT EXISTS study_mode TEXT NOT NULL DEFAULT 'full',
                    ADD COLUMN IF NOT EXISTS timed_out BOOLEAN NOT NULL DEFAULT FALSE;

                ALTER TABLE pwf_results
                    ADD COLUMN IF NOT EXISTS student_id_hash TEXT,
                    ADD COLUMN IF NOT EXISTS gender TEXT,
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

                CREATE INDEX IF NOT EXISTS idx_ci_results_student_id_hash
                    ON ci_results(student_id_hash);

                CREATE INDEX IF NOT EXISTS idx_ci_results_summary
                    ON ci_results(block, n, trial);

                CREATE INDEX IF NOT EXISTS idx_ci_results_experiment_mode
                    ON ci_results(experiment_mode);

                CREATE UNIQUE INDEX IF NOT EXISTS idx_ci_results_mirror_order
                    ON ci_results(session_id, mirror_order)
                    WHERE mirror_order IS NOT NULL;

                CREATE INDEX IF NOT EXISTS idx_ci_settlements_student_id
                    ON ci_settlements(student_id);

                CREATE INDEX IF NOT EXISTS idx_ci_settlements_student_id_hash
                    ON ci_settlements(student_id_hash);

                CREATE INDEX IF NOT EXISTS idx_utility_results_student_id
                    ON utility_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_utility_results_student_id_hash
                    ON utility_results(student_id_hash);

                CREATE INDEX IF NOT EXISTS idx_utility_results_sequence
                    ON utility_results(sequence, row);

                CREATE INDEX IF NOT EXISTS idx_pwf_results_student_id
                    ON pwf_results(student_id);

                CREATE INDEX IF NOT EXISTS idx_pwf_results_student_id_hash
                    ON pwf_results(student_id_hash);

                CREATE INDEX IF NOT EXISTS idx_pwf_results_block
                    ON pwf_results(block_id, task_index);

                CREATE INDEX IF NOT EXISTS idx_pwf_comprehension_events_session
                    ON pwf_comprehension_events(session_id, timestamp, sequence);

                CREATE INDEX IF NOT EXISTS idx_pwf_comprehension_events_outcome
                    ON pwf_comprehension_events(outcome, passed, locked_after);

                CREATE INDEX IF NOT EXISTS idx_experiment_sessions_resume
                    ON experiment_sessions(student_id, study_mode, status, last_seen_at DESC, created_at DESC);

                CREATE INDEX IF NOT EXISTS idx_experiment_sessions_student_id_hash
                    ON experiment_sessions(student_id_hash);

                CREATE UNIQUE INDEX IF NOT EXISTS idx_experiment_sessions_one_completed_per_student_mode
                    ON experiment_sessions(student_id, study_mode)
                    WHERE status = 'completed';
                """
            )
            _backfill_student_id_hashes(cur)
        conn.commit()
    _schema_ready = True


def create_session(
    session_id: str,
    student_id: str,
    name: str,
    gender: str,
    consent_version: str,
    consent_accepted_at: datetime,
    trials: list[dict],
    study_mode: str = "full",
    experiment_mode: str = "normal",
    time_pressure_seconds: int = 0,
    pwf_comprehension_version: str | None = None,
) -> None:
    student_id_hash = hash_student_id(student_id)
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        _memory_sessions[session_id] = {
            "session_id": session_id,
            "student_id": student_id,
            "student_id_hash": student_id_hash,
            "name": name,
            "gender": gender,
            "consent_version": consent_version,
            "consent_accepted_at": consent_accepted_at.isoformat(),
            "study_mode": study_mode,
            "experiment_mode": experiment_mode,
            "time_pressure_seconds": time_pressure_seconds,
            "trials": trials,
            "status": "started",
            "pwf_completed": False,
            "pwf_completed_at": None,
            "pwf_comprehension_version": pwf_comprehension_version,
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
                    session_id, student_id, student_id_hash, name, gender, consent_version, consent_accepted_at,
                    study_mode, experiment_mode, time_pressure_seconds, trials, pwf_comprehension_version
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    session_id,
                    student_id,
                    student_id_hash,
                    name,
                    gender,
                    consent_version,
                    consent_accepted_at,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    Jsonb(trials),
                    pwf_comprehension_version,
                ),
            )
        conn.commit()


def update_session_enrollment(
    session_id: str,
    gender: str,
    consent_version: str,
    consent_accepted_at: datetime,
) -> None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        session = _memory_sessions.get(session_id)
        if session:
            session.update({
                "gender": gender,
                "consent_version": consent_version,
                "consent_accepted_at": consent_accepted_at.isoformat(),
            })
        return

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE experiment_sessions
                SET gender = %s, consent_version = %s, consent_accepted_at = %s
                WHERE session_id = %s
                """,
                (gender, consent_version, consent_accepted_at, session_id),
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
    for field in ("created_at", "last_seen_at", "completed_at", "pwf_completed_at", "consent_accepted_at"):
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
                    student_id_hash,
                    name,
                    gender,
                    consent_version,
                    consent_accepted_at,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trials,
                    status,
                    pwf_completed,
                    pwf_completed_at,
                    pwf_comprehension_version,
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
                    student_id_hash,
                    name,
                    gender,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trials,
                    status,
                    pwf_completed,
                    pwf_completed_at,
                    pwf_comprehension_version,
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
                    student_id_hash,
                    name,
                    gender,
                    study_mode,
                    experiment_mode,
                    time_pressure_seconds,
                    trials,
                    status,
                    pwf_completed,
                    pwf_completed_at,
                    pwf_comprehension_version,
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
    record = {
        **record,
        "student_id_hash": hash_student_id(record["student_id"]),
        "payment_details": {},
        "trial_payment_total": 0,
    }
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
                    session_id, student_id, student_id_hash, name, gender, study_mode, experiment_mode, time_pressure_seconds,
                    trial, block, n, student_id_last_digit, amount_level, amount_multiplier,
                    p, q, r, x, x_prime,
                    y, s, y_prime,
                    pn, qn, rn, sn,
                    choice, ci_satisfied, response_time_ms, timed_out,
                    payment_details, trial_payment_total, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(student_id_hash)s, %(name)s, %(gender)s, %(study_mode)s,
                    %(experiment_mode)s, %(time_pressure_seconds)s,
                    %(trial)s, %(block)s, %(N)s,
                    %(student_id_last_digit)s, %(amount_level)s, %(amount_multiplier)s,
                    %(p)s, %(q)s, %(r)s, %(x)s, %(x_prime)s,
                    %(y)s, %(s)s, %(y_prime)s,
                    %(pN)s, %(qN)s, %(rN)s, %(sN)s,
                    %(choice)s, %(ci_satisfied)s, %(response_time_ms)s, %(timed_out)s,
                    %(payment_details)s, %(trial_payment_total)s, %(timestamp)s
                )
                ON CONFLICT (session_id, trial) DO UPDATE SET
                    student_id = EXCLUDED.student_id,
                    student_id_hash = EXCLUDED.student_id_hash,
                    name = EXCLUDED.name,
                    gender = EXCLUDED.gender,
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
                    payment_details = EXCLUDED.payment_details,
                    trial_payment_total = EXCLUDED.trial_payment_total,
                    timestamp = EXCLUDED.timestamp
                """,
                {**record, "payment_details": Jsonb(record.get("payment_details", {})), "timestamp": timestamp},
            )
        conn.commit()
    touch_session(record["session_id"], "in_progress")


def _canonical_mirror_choice(choice: str) -> str:
    if choice == "X":
        return "Y"
    if choice == "Y":
        return "X"
    return choice


def save_ci_mirror_result(record: dict[str, Any]) -> dict[str, Any]:
    timestamp = datetime.now(timezone.utc)
    mirror_choice = record["mirror_choice"]
    mirror_record = {
        "session_id": record["session_id"],
        "trial": record["trial"],
        "mirror_order": record["mirror_order"],
        "mirror_left_option": "Y",
        "mirror_right_option": "X",
        "mirror_choice": mirror_choice,
        "mirror_canonical_choice": _canonical_mirror_choice(mirror_choice),
        "mirror_ci_satisfied": not record.get("mirror_timed_out", False) and mirror_choice == "Indifferent",
        "mirror_response_time_ms": record.get("mirror_response_time_ms"),
        "mirror_timed_out": bool(record.get("mirror_timed_out", False)),
        "mirror_timestamp": timestamp,
    }

    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        existing = next(
            (
                item
                for item in _memory_ci_results
                if item.get("session_id") == record["session_id"]
                and int(item.get("trial", -1)) == int(record["trial"])
            ),
            None,
        )
        if existing is None:
            raise StorageError("Original CI result was not found for this mirror response")
        duplicate_order = next(
            (
                item
                for item in _memory_ci_results
                if item.get("session_id") == record["session_id"]
                and int(item.get("trial", -1)) != int(record["trial"])
                and item.get("mirror_order") == record["mirror_order"]
            ),
            None,
        )
        if duplicate_order is not None:
            raise StorageError("This mirror order is already assigned to another CI trial")
        existing.update({**mirror_record, "mirror_timestamp": timestamp.isoformat()})
        touch_session(record["session_id"], "in_progress")
        return dict(existing)

    ensure_schema()
    try:
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE ci_results
                    SET
                        mirror_order = %(mirror_order)s,
                        mirror_left_option = %(mirror_left_option)s,
                        mirror_right_option = %(mirror_right_option)s,
                        mirror_choice = %(mirror_choice)s,
                        mirror_canonical_choice = %(mirror_canonical_choice)s,
                        mirror_ci_satisfied = %(mirror_ci_satisfied)s,
                        mirror_response_time_ms = %(mirror_response_time_ms)s,
                        mirror_timed_out = %(mirror_timed_out)s,
                        mirror_timestamp = %(mirror_timestamp)s
                    WHERE session_id = %(session_id)s AND trial = %(trial)s
                    RETURNING
                        mirror_order,
                        mirror_left_option,
                        mirror_right_option,
                        mirror_choice,
                        mirror_canonical_choice,
                        mirror_ci_satisfied,
                        mirror_response_time_ms,
                        mirror_timed_out,
                        mirror_timestamp
                    """,
                    mirror_record,
                )
                saved = cur.fetchone()
                if saved is None:
                    raise StorageError("Original CI result was not found for this mirror response")
            conn.commit()
    except psycopg.errors.UniqueViolation as exc:
        raise StorageError("This mirror order is already assigned to another CI trial") from exc

    touch_session(record["session_id"], "in_progress")
    normalized = dict(saved)
    if isinstance(normalized.get("mirror_timestamp"), datetime):
        normalized["mirror_timestamp"] = normalized["mirror_timestamp"].isoformat()
    return normalized


def save_utility_results(records: list[dict[str, Any]]) -> None:
    records = [{**record, "student_id_hash": hash_student_id(record["student_id"])} for record in records]
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
                    session_id, student_id, student_id_hash, name, study_mode, experiment_mode, time_pressure_seconds,
                    utility_trial, sequence, row,
                    p, r_amount, capital_r_amount,
                    x_prev, x_candidate, increment,
                    choice, x_estimate, switch_lower, switch_upper, switch_status,
                    response_time_ms, timed_out, timestamp
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(student_id_hash)s, %(name)s, %(study_mode)s,
                    %(experiment_mode)s, %(time_pressure_seconds)s,
                    %(utility_trial)s, %(sequence)s, %(row)s,
                    %(p)s, %(r_amount)s, %(R_amount)s,
                    %(x_prev)s, %(x_candidate)s, %(increment)s,
                    %(choice)s, %(x_estimate)s, %(switch_lower)s, %(switch_upper)s,
                    %(switch_status)s, %(response_time_ms)s, %(timed_out)s, %(timestamp)s
                )
                ON CONFLICT (session_id, utility_trial) DO UPDATE SET
                    student_id = EXCLUDED.student_id,
                    student_id_hash = EXCLUDED.student_id_hash,
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
        "student_id_hash": hash_student_id(record["student_id"]),
        "name": record["name"],
        "gender": record["gender"],
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

    def write_records() -> None:
        ensure_schema()
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO pwf_results (
                        session_id, student_id, student_id_hash, name, gender, study_mode, pwf_trial,
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
                        %(session_id)s, %(student_id)s, %(student_id_hash)s, %(name)s, %(gender)s, %(study_mode)s, %(pwf_trial)s,
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
                        student_id_hash = EXCLUDED.student_id_hash,
                        name = EXCLUDED.name,
                        gender = EXCLUDED.gender,
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

    _with_retry(write_records)


def save_pwf_comprehension_events(records: list[dict[str, Any]]) -> None:
    timestamp = datetime.now(timezone.utc)
    normalized_records = [
        {
            **record,
            "event_id": str(record["event_id"]),
            "timestamp": timestamp,
        }
        for record in records
    ]

    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        existing_event_ids = {str(item["event_id"]) for item in _memory_pwf_comprehension_events}
        for record in normalized_records:
            if record["event_id"] in existing_event_ids:
                continue
            _memory_pwf_comprehension_events.append({
                **record,
                "Timestamp": timestamp.isoformat(),
                "source_timestamp": (
                    record["source_timestamp"].isoformat()
                    if isinstance(record.get("source_timestamp"), datetime)
                    else record.get("source_timestamp", "")
                ),
            })
            existing_event_ids.add(record["event_id"])
        if records:
            touch_session(records[0]["session_id"], "in_progress")
        return

    def write_records() -> None:
        ensure_schema()
        with _connect() as conn:
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO pwf_comprehension_events (
                        event_id, session_id, question_set_version, sequence,
                        event_type, outcome, round_number, attempt_number,
                        attempt_in_round, attempt_limit, attempts_before, attempts_after,
                        answers, incorrect_question_ids, correct_count, passed,
                        locked_after, source_timestamp, timestamp
                    )
                    VALUES (
                        %(event_id)s, %(session_id)s, %(question_set_version)s, %(sequence)s,
                        %(event_type)s, %(outcome)s, %(round_number)s, %(attempt_number)s,
                        %(attempt_in_round)s, %(attempt_limit)s, %(attempts_before)s, %(attempts_after)s,
                        %(answers)s, %(incorrect_question_ids)s, %(correct_count)s, %(passed)s,
                        %(locked_after)s, %(source_timestamp)s, %(timestamp)s
                    )
                    ON CONFLICT (event_id) DO NOTHING
                    """,
                    [
                        {
                            **record,
                            "answers": Jsonb(record["answers"]),
                            "incorrect_question_ids": Jsonb(record["incorrect_question_ids"]),
                        }
                        for record in normalized_records
                    ],
                )
            conn.commit()
        if records:
            touch_session(records[0]["session_id"], "in_progress")

    _with_retry(write_records)


def _normalize_result(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    for field in ("Timestamp", "mirror_timestamp"):
        timestamp = normalized.get(field)
        if isinstance(timestamp, datetime):
            normalized[field] = timestamp.isoformat()
    return normalized


def _normalize_pwf_comprehension_event(row: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(row)
    normalized["event_id"] = str(normalized["event_id"])
    normalized["session_id"] = str(normalized["session_id"])
    for field in ("source_timestamp", "timestamp", "Timestamp"):
        value = normalized.get(field)
        if isinstance(value, datetime):
            normalized[field] = value.isoformat()
    return normalized


def _normalize_ci_settlement(row: dict[str, Any] | None) -> dict[str, Any] | None:
    if row is None:
        return None
    normalized = dict(row)
    settled_at = normalized.get("settled_at")
    if isinstance(settled_at, datetime):
        normalized["settled_at"] = settled_at.isoformat()
    normalized["session_id"] = str(normalized["session_id"])
    return normalized


def get_ci_settlement(session_id: str) -> dict[str, Any] | None:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        settlement = _memory_ci_settlements.get(session_id)
        return _normalize_ci_settlement(settlement) if settlement else None

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    session_id::text,
                    student_id,
                    student_id_hash,
                    name,
                    study_mode,
                    selected_trial,
                    selected_trial_amount,
                    payment_rule,
                    selected_trial_payments,
                    settled_at
                FROM ci_settlements
                WHERE session_id = %s
                """,
                (session_id,),
            )
            row = cur.fetchone()
    return _normalize_ci_settlement(row)


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
                    student_id_hash,
                    name,
                    gender,
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
                    payment_details,
                    trial_payment_total,
                    mirror_order,
                    mirror_left_option,
                    mirror_right_option,
                    mirror_choice,
                    mirror_canonical_choice,
                    mirror_ci_satisfied,
                    mirror_response_time_ms,
                    mirror_timed_out,
                    mirror_timestamp,
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
                    student_id_hash,
                    name,
                    gender,
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


def get_pwf_comprehension_events_by_session(session_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return [
            _normalize_pwf_comprehension_event(record)
            for record in sorted(
                _memory_pwf_comprehension_events,
                key=lambda item: (item.get("Timestamp", ""), item.get("sequence", 0)),
            )
            if record.get("session_id") == session_id
        ]

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    event_id::text,
                    session_id::text,
                    question_set_version,
                    sequence,
                    event_type,
                    outcome,
                    round_number,
                    attempt_number,
                    attempt_in_round,
                    attempt_limit,
                    attempts_before,
                    attempts_after,
                    answers,
                    incorrect_question_ids,
                    correct_count,
                    passed,
                    locked_after,
                    source_timestamp,
                    timestamp AS "Timestamp"
                FROM pwf_comprehension_events
                WHERE session_id = %s
                ORDER BY timestamp ASC, sequence ASC
                """,
                (session_id,),
            )
            rows = cur.fetchall()
    return [_normalize_pwf_comprehension_event(row) for row in rows]


def has_passed_pwf_comprehension(session_id: str) -> bool:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        return any(
            record.get("session_id") == session_id
            and record.get("event_type") == "submission"
            and bool(record.get("passed"))
            for record in _memory_pwf_comprehension_events
        )

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM pwf_comprehension_events
                    WHERE session_id = %s
                      AND event_type = 'submission'
                      AND passed = TRUE
                )
                """,
                (session_id,),
            )
            row = cur.fetchone()
    return bool(row["exists"])


def _trial_count_from_session(session: dict[str, Any]) -> int:
    trials = session.get("trials") or []
    if isinstance(trials, str):
        try:
            trials = json.loads(trials)
        except json.JSONDecodeError:
            return 0
    return len(trials) if isinstance(trials, list) else 0


def _ci_mirrors_complete(results: list[dict[str, Any]], expected_trials: int) -> bool:
    if expected_trials <= 0 or len(results) != expected_trials:
        return False
    for row in results:
        choice = row.get("mirror_choice")
        timed_out = row.get("mirror_timed_out")
        if choice is None or timed_out is None or row.get("mirror_timestamp") is None:
            return False
        if row.get("mirror_left_option") != "Y" or row.get("mirror_right_option") != "X":
            return False
        if row.get("mirror_canonical_choice") != _canonical_mirror_choice(choice):
            return False
        if bool(timed_out) != (choice == "Timeout"):
            return False
        expected_satisfied = not bool(timed_out) and choice == "Indifferent"
        if row.get("mirror_ci_satisfied") is not expected_satisfied:
            return False
    try:
        mirror_orders = sorted(int(row["mirror_order"]) for row in results)
    except (KeyError, TypeError, ValueError):
        return False
    return mirror_orders == list(range(1, expected_trials + 1))


def _ci_option(display_option: str, canonical_option: str, probability: float, amount: float) -> dict[str, Any]:
    return {
        "display_option": display_option,
        "canonical_option": canonical_option,
        "probability": float(probability),
        "option_amount": float(amount),
    }


def _ci_decision_pool(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    decisions: list[dict[str, Any]] = []
    for result in results:
        trial = int(result["trial"])
        decisions.extend([
            {
                "trial": trial,
                "decision": "step1",
                "response": "Indifferent",
                "canonical_response": "Indifferent",
                "options": [
                    _ci_option("A", "X", result["p"], result["x"]),
                    _ci_option("B", "Y", result["q"], result["y"]),
                ],
            },
            {
                "trial": trial,
                "decision": "step2",
                "response": "Indifferent",
                "canonical_response": "Indifferent",
                "options": [
                    _ci_option("A", "X", result["r"], result["x"]),
                    _ci_option("B", "Y", result["s"], result["y"]),
                ],
            },
            {
                "trial": trial,
                "decision": "step3",
                "response": "Indifferent",
                "canonical_response": "Indifferent",
                "options": [
                    _ci_option("A", "X", result["pN"], result["x_prime"]),
                    _ci_option("B", "Y", result["qN"], result["y_prime"]),
                ],
            },
            {
                "trial": trial,
                "decision": "step4",
                "response": result["choice"],
                "canonical_response": result["choice"],
                "options": [
                    _ci_option("A", "X", result["rN"], result["x_prime"]),
                    _ci_option("B", "Y", result["sN"], result["y_prime"]),
                ],
            },
            {
                "trial": trial,
                "decision": "mirror_step4",
                "response": result["mirror_choice"],
                "canonical_response": result["mirror_canonical_choice"],
                "options": [
                    _ci_option("A", "Y", result["sN"], result["y_prime"]),
                    _ci_option("B", "X", result["rN"], result["x_prime"]),
                ],
            },
        ])
    return decisions


def _resolve_ci_decision(decision: dict[str, Any]) -> dict[str, Any]:
    response = decision["response"]
    options = decision["options"]

    if response == "Timeout":
        return {
            "trial": decision["trial"],
            "decision": decision["decision"],
            "response": response,
            "canonical_response": decision["canonical_response"],
            "selected_display_option": None,
            "selected_canonical_option": None,
            "selection_method": "timeout_no_payment",
            "probability": None,
            "option_amount": None,
            "random_draw": None,
            "reward_amount": 0.0,
        }

    if response == "Indifferent":
        selected = random.choice(options)
        selection_method = (
            "random_indifference"
            if decision["decision"] in {"step1", "step2", "step3"}
            else "random_indifferent_choice"
        )
    elif response == "X":
        selected = options[0]
        selection_method = "participant_choice"
    elif response == "Y":
        selected = options[1]
        selection_method = "participant_choice"
    else:
        raise StorageError("CI decision contains an invalid response")

    random_draw = random.random()
    reward_amount = selected["option_amount"] if random_draw < selected["probability"] else 0.0
    return {
        "trial": decision["trial"],
        "decision": decision["decision"],
        "response": response,
        "canonical_response": decision["canonical_response"],
        "selected_display_option": selected["display_option"],
        "selected_canonical_option": selected["canonical_option"],
        "selection_method": selection_method,
        "probability": selected["probability"],
        "option_amount": selected["option_amount"],
        "random_draw": random_draw,
        "reward_amount": reward_amount,
    }


def create_ci_settlement(session_id: str) -> dict[str, Any]:
    existing = get_ci_settlement(session_id)
    if existing:
        return existing

    session = get_session(session_id)
    if not session:
        raise StorageError("CI session was not found")

    expected_trials = _trial_count_from_session(session)
    results = get_ci_results_by_session(session_id)
    saved_trials = {int(row["trial"]) for row in results}
    if expected_trials <= 0 or len(saved_trials) != expected_trials or len(results) != expected_trials:
        raise StorageError("CI results are not complete yet")
    if not _ci_mirrors_complete(results, expected_trials):
        raise StorageError("CI mirror results are not complete yet")

    decision_pool = _ci_decision_pool(results)
    expected_decisions = expected_trials * 5
    if len(decision_pool) != expected_decisions:
        raise StorageError("CI decision pool is incomplete")
    selected = _resolve_ci_decision(random.choice(decision_pool))
    settlement = {
        "session_id": session_id,
        "student_id": session["student_id"],
        "student_id_hash": session["student_id_hash"],
        "name": session["name"],
        "study_mode": session["study_mode"],
        "selected_trial": int(selected["trial"]),
        "selected_trial_amount": float(selected["reward_amount"]),
        "payment_rule": "random_single_ci_decision",
        "selected_trial_payments": selected,
        "settled_at": datetime.now(timezone.utc).isoformat(),
    }

    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        stored = _memory_ci_settlements.setdefault(session_id, settlement)
        return _normalize_ci_settlement(stored) or settlement

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ci_settlements (
                    session_id, student_id, student_id_hash, name, study_mode,
                    selected_trial, selected_trial_amount, payment_rule,
                    selected_trial_payments, settled_at
                )
                VALUES (
                    %(session_id)s, %(student_id)s, %(student_id_hash)s, %(name)s, %(study_mode)s,
                    %(selected_trial)s, %(selected_trial_amount)s, %(payment_rule)s,
                    %(selected_trial_payments)s, %(settled_at)s
                )
                ON CONFLICT (session_id) DO NOTHING
                RETURNING
                    session_id::text,
                    student_id,
                    student_id_hash,
                    name,
                    study_mode,
                    selected_trial,
                    selected_trial_amount,
                    payment_rule,
                    selected_trial_payments,
                    settled_at
                """,
                {**settlement, "selected_trial_payments": Jsonb(settlement["selected_trial_payments"])},
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    """
                    SELECT
                        session_id::text,
                        student_id,
                        student_id_hash,
                        name,
                        study_mode,
                        selected_trial,
                        selected_trial_amount,
                        payment_rule,
                        selected_trial_payments,
                        settled_at
                    FROM ci_settlements
                    WHERE session_id = %s
                    """,
                    (session_id,),
                )
                row = cur.fetchone()
        conn.commit()
    normalized = _normalize_ci_settlement(row)
    if normalized is None:
        raise StorageError("CI final settlement could not be saved")
    return normalized


def mark_session_completed_if_ready(session_id: str) -> bool:
    session = get_session(session_id)
    if not session:
        return False
    comprehension_required = bool(session.get("pwf_comprehension_version"))
    if comprehension_required:
        if not session.get("pwf_completed"):
            return False
        if not has_passed_pwf_comprehension(session_id):
            return False

    expected_trials = _trial_count_from_session(session)
    if expected_trials <= 0:
        return False

    ci_results = get_ci_results_by_session(session_id)
    saved_trials = {int(row["trial"]) for row in ci_results}
    if len(saved_trials) < expected_trials:
        return False
    if not _ci_mirrors_complete(ci_results, expected_trials):
        return False
    if not get_ci_settlement(session_id):
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
        results = []
        for record in sorted(
            _memory_ci_results,
            key=lambda item: (item.get("Timestamp", ""), item.get("session_id", ""), item.get("trial", 0)),
        ):
            if record.get("student_id") != student_id:
                continue
            settlement = _memory_ci_settlements.get(record["session_id"])
            results.append({
                **record,
                "ci_final_payment_selected": bool(
                    settlement and int(record["trial"]) == int(settlement["selected_trial"])
                ),
                "ci_final_selected_trial": settlement.get("selected_trial", "") if settlement else "",
                "ci_final_payment_total": settlement.get("selected_trial_amount", "") if settlement else "",
                "ci_final_payment_rule": settlement.get("payment_rule", "") if settlement else "",
                "ci_final_selected_decision_details": settlement.get("selected_trial_payments", {}) if settlement else {},
                "ci_final_settled_at": settlement.get("settled_at", "") if settlement else "",
            })
        return results

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    cr.student_id,
                    cr.student_id_hash,
                    cr.name,
                    cr.gender,
                    cr.study_mode,
                    cr.experiment_mode,
                    cr.time_pressure_seconds,
                    cr.trial,
                    cr.block,
                    cr.n AS "N",
                    cr.student_id_last_digit,
                    cr.amount_level,
                    cr.amount_multiplier,
                    cr.p,
                    cr.q,
                    cr.r,
                    cr.x,
                    cr.x_prime,
                    cr.y,
                    cr.s,
                    cr.y_prime,
                    cr.pn AS "pN",
                    cr.qn AS "qN",
                    cr.rn AS "rN",
                    cr.sn AS "sN",
                    cr.choice,
                    cr.ci_satisfied,
                    cr.response_time_ms,
                    cr.timed_out,
                    cr.payment_details,
                    cr.trial_payment_total,
                    cr.mirror_order,
                    cr.mirror_left_option,
                    cr.mirror_right_option,
                    cr.mirror_choice,
                    cr.mirror_canonical_choice,
                    cr.mirror_ci_satisfied,
                    cr.mirror_response_time_ms,
                    cr.mirror_timed_out,
                    cr.mirror_timestamp,
                    (cs.session_id IS NOT NULL AND cr.trial = cs.selected_trial) AS ci_final_payment_selected,
                    cs.selected_trial AS ci_final_selected_trial,
                    cs.selected_trial_amount AS ci_final_payment_total,
                    cs.payment_rule AS ci_final_payment_rule,
                    cs.selected_trial_payments AS ci_final_selected_decision_details,
                    cs.settled_at AS ci_final_settled_at,
                    cr.timestamp AS "Timestamp"
                FROM ci_results AS cr
                LEFT JOIN ci_settlements AS cs ON cs.session_id = cr.session_id
                WHERE cr.student_id = %s
                ORDER BY cr.timestamp ASC, cr.session_id ASC, cr.trial ASC
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
                    student_id_hash,
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
                    student_id_hash,
                    name,
                    gender,
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


def get_pwf_comprehension_events_by_student(student_id: str) -> list[dict[str, Any]]:
    if ALLOW_MEMORY_STORAGE and not DATABASE_URL:
        session_metadata = {
            session_id: session
            for session_id, session in _memory_sessions.items()
            if session.get("student_id") == student_id
        }
        results = []
        for record in sorted(
            _memory_pwf_comprehension_events,
            key=lambda item: (item.get("Timestamp", ""), item.get("sequence", 0)),
        ):
            session = session_metadata.get(record.get("session_id"))
            if not session:
                continue
            results.append(_normalize_pwf_comprehension_event({
                **record,
                "student_id": session.get("student_id", ""),
                "student_id_hash": session.get("student_id_hash", ""),
                "name": session.get("name", ""),
                "gender": session.get("gender", ""),
                "study_mode": session.get("study_mode", "full"),
            }))
        return results

    ensure_schema()
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    event.event_id::text,
                    event.session_id::text,
                    session.student_id,
                    session.student_id_hash,
                    session.name,
                    session.gender,
                    session.study_mode,
                    event.question_set_version,
                    event.sequence,
                    event.event_type,
                    event.outcome,
                    event.round_number,
                    event.attempt_number,
                    event.attempt_in_round,
                    event.attempt_limit,
                    event.attempts_before,
                    event.attempts_after,
                    event.answers,
                    event.incorrect_question_ids,
                    event.correct_count,
                    event.passed,
                    event.locked_after,
                    event.source_timestamp,
                    event.timestamp AS "Timestamp"
                FROM pwf_comprehension_events AS event
                JOIN experiment_sessions AS session ON session.session_id = event.session_id
                WHERE session.student_id = %s
                ORDER BY event.timestamp ASC, event.sequence ASC
                """,
                (student_id,),
            )
            rows = cur.fetchall()
    return [_normalize_pwf_comprehension_event(row) for row in rows]


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
