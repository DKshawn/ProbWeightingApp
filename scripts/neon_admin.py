#!/usr/bin/env python3
"""Local, deliberately guarded administration commands for the Neon database.

This script connects directly to the database used by the deployed app. It does
not import the FastAPI storage module, so inspection never runs application
schema migration code.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable

import psycopg
from psycopg import sql
from psycopg.rows import dict_row


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILE = ROOT / ".env.db.local"
FALLBACK_ENV_FILES = (ROOT / ".env.neon.local", ROOT / ".env.local")
READ_ONLY_PREFIX = re.compile(r"^\s*(?:select|with|explain|show)\b", re.IGNORECASE)
MAX_TERMINAL_ROWS = 200


def load_env_file(path: Path) -> bool:
    """Load simple KEY=VALUE entries without overwriting an actual shell env."""
    if not path.exists():
        return False

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip().removeprefix("export ").strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        if key and key not in os.environ:
            os.environ[key] = value
    return True


def database_url(env_file: Path) -> str:
    if not os.getenv("DATABASE_URL"):
        load_env_file(env_file)
        if env_file == DEFAULT_ENV_FILE:
            for fallback in FALLBACK_ENV_FILES:
                load_env_file(fallback)

    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not configured. Create .env.db.local from .env.example "
            "and put the Neon connection string there, or export DATABASE_URL in this shell."
        )
    return url


def connect(env_file: Path):
    return psycopg.connect(database_url(env_file), row_factory=dict_row)


def stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"), default=str)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def print_table(rows: list[dict[str, Any]], *, max_rows: int = MAX_TERMINAL_ROWS) -> None:
    if not rows:
        print("(0 rows)")
        return

    visible_rows = rows[:max_rows]
    headers = list(visible_rows[0].keys())
    values = [[stringify(row.get(header)) for header in headers] for row in visible_rows]
    widths = [
        min(42, max(len(header), *(len(row[index]) for row in values)))
        for index, header in enumerate(headers)
    ]

    def clipped(text: str, width: int) -> str:
        return text if len(text) <= width else f"{text[: width - 3]}..."

    def render(row: Iterable[str]) -> str:
        return " | ".join(clipped(value, widths[index]).ljust(widths[index]) for index, value in enumerate(row))

    print(render(headers))
    print("-+-".join("-" * width for width in widths))
    for row in values:
        print(render(row))
    if len(rows) > max_rows:
        print(f"... {len(rows) - max_rows} more rows omitted (use --csv to export all rows).")


def write_csv(path: Path, rows: list[dict[str, Any]], columns: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    header = columns or (list(rows[0].keys()) if rows else [])
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=header, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({column: stringify(row.get(column)) for column in header})


def build_session_filter(
    *, alias: str, student_ids: list[str] | None, completed_only: bool
) -> tuple[str, list[Any]]:
    clauses: list[str] = []
    params: list[Any] = []
    if student_ids:
        clauses.append(f"{alias}.student_id = ANY(%s)")
        params.append(student_ids)
    if completed_only:
        clauses.append(f"{alias}.status = 'completed'")
    return (f" WHERE {' AND '.join(clauses)}" if clauses else "", params)


def command_tables(args: argparse.Namespace) -> None:
    with connect(args.env_file) as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_type = 'BASE TABLE'
              AND table_schema = %s
            ORDER BY table_name
            """,
            (args.schema,),
        )
        tables = cur.fetchall()
        rows: list[dict[str, Any]] = []
        for item in tables:
            cur.execute(
                sql.SQL("SELECT COUNT(*) AS row_count FROM {}.{}").format(
                    sql.Identifier(item["table_schema"]), sql.Identifier(item["table_name"])
                )
            )
            rows.append({**item, "row_count": cur.fetchone()["row_count"]})
    print_table(rows)


def command_describe(args: argparse.Namespace) -> None:
    with connect(args.env_file) as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                ordinal_position,
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_schema = %s AND table_name = %s
            ORDER BY ordinal_position
            """,
            (args.schema, args.table),
        )
        rows = cur.fetchall()
    if not rows:
        raise RuntimeError(f"Table {args.schema}.{args.table} was not found.")
    print_table(rows)


def fetch_export_rows(
    cur: psycopg.Cursor,
    *,
    table: str,
    student_ids: list[str] | None,
    completed_only: bool,
) -> tuple[list[dict[str, Any]], list[str]]:
    session_filter, params = build_session_filter(
        alias="s", student_ids=student_ids, completed_only=completed_only
    )
    if table == "sessions":
        query = f"SELECT s.* FROM experiment_sessions AS s{session_filter} ORDER BY s.created_at, s.session_id"
    elif table == "ci_results":
        query = (
            "SELECT r.* FROM ci_results AS r "
            "JOIN experiment_sessions AS s ON s.session_id = r.session_id"
            f"{session_filter} ORDER BY r.timestamp, r.session_id, r.trial"
        )
    elif table == "pwf_results":
        query = (
            "SELECT r.* FROM pwf_results AS r "
            "JOIN experiment_sessions AS s ON s.session_id = r.session_id"
            f"{session_filter} ORDER BY r.timestamp, r.session_id, r.pwf_trial"
        )
    elif table == "pwf_comprehension_events":
        query = (
            "SELECT r.* FROM pwf_comprehension_events AS r "
            "JOIN experiment_sessions AS s ON s.session_id = r.session_id"
            f"{session_filter} ORDER BY r.timestamp, r.session_id, r.sequence"
        )
    else:
        raise ValueError(f"Unsupported export table: {table}")

    cur.execute(query, params)
    rows = cur.fetchall()
    columns = [column.name for column in cur.description or []]
    return rows, columns


def command_show(args: argparse.Namespace) -> None:
    with connect(args.env_file) as conn, conn.cursor() as cur:
        session_filter, params = build_session_filter(
            alias="s", student_ids=args.student_ids, completed_only=args.completed_only
        )
        cur.execute(
            """
            SELECT
                s.student_id,
                s.session_id::text AS session_id,
                s.study_mode,
                s.status,
                s.pwf_completed,
                s.experiment_mode,
                s.created_at,
                s.completed_at
            FROM experiment_sessions AS s
            """
            + session_filter
            + " ORDER BY s.student_id, s.created_at",
            params,
        )
        sessions = cur.fetchall()

        cur.execute(
            """
            SELECT
                r.student_id,
                r.session_id::text AS session_id,
                r.trial,
                r.block,
                r.n,
                r.choice,
                r.ci_satisfied,
                r.amount_level,
                r.timestamp
            FROM ci_results AS r
            JOIN experiment_sessions AS s ON s.session_id = r.session_id
            """
            + session_filter
            + " ORDER BY r.student_id, r.session_id, r.trial",
            params,
        )
        ci_rows = cur.fetchall()

        cur.execute(
            """
            SELECT
                r.student_id,
                r.session_id::text AS session_id,
                r.pwf_trial,
                r.block_id,
                r.task_id,
                r.task_type,
                r.task_mode,
                r.amount_level,
                r.timed_out,
                r.memory_post_correct,
                r.timestamp
            FROM pwf_results AS r
            JOIN experiment_sessions AS s ON s.session_id = r.session_id
            """
            + session_filter
            + " ORDER BY r.student_id, r.session_id, r.pwf_trial",
            params,
        )
        pwf_rows = cur.fetchall()

    print("\n[experiment_sessions]")
    print_table(sessions)
    print("\n[ci_results]")
    print_table(ci_rows)
    print("\n[pwf_results]")
    print_table(pwf_rows)


def command_export(args: argparse.Namespace) -> None:
    destination = args.out.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    with connect(args.env_file) as conn, conn.cursor() as cur:
        for table, file_name in (
            ("sessions", "experiment_sessions.csv"),
            ("ci_results", "ci_results.csv"),
            ("pwf_results", "pwf_results.csv"),
            ("pwf_comprehension_events", "pwf_comprehension_events.csv"),
        ):
            rows, columns = fetch_export_rows(
                cur,
                table=table,
                student_ids=args.student_ids,
                completed_only=args.completed_only,
            )
            path = destination / file_name
            write_csv(path, rows, columns)
            print(f"{path}: {len(rows)} rows")


def validate_read_only_sql(query: str) -> str:
    cleaned = query.strip().rstrip(";").strip()
    if not cleaned or ";" in cleaned or not READ_ONLY_PREFIX.match(cleaned):
        raise RuntimeError("Only one SELECT, WITH, EXPLAIN, or SHOW statement is allowed.")
    return cleaned


def command_sql(args: argparse.Namespace) -> None:
    query = validate_read_only_sql(args.sql)
    with connect(args.env_file) as conn, conn.cursor() as cur:
        cur.execute("SET TRANSACTION READ ONLY")
        cur.execute(query)
        if cur.description is None:
            raise RuntimeError("The statement did not return rows.")
        rows = cur.fetchall()
        columns = [column.name for column in cur.description]
    if args.csv:
        write_csv(args.csv.resolve(), rows, columns)
        print(f"{args.csv.resolve()}: {len(rows)} rows")
    else:
        print_table(rows)


def command_delete_student(args: argparse.Namespace) -> None:
    if not args.confirm:
        raise RuntimeError("Refusing to delete. Re-run with --confirm after checking the student IDs and study mode.")
    with connect(args.env_file) as conn, conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM experiment_sessions
            WHERE student_id = ANY(%s) AND study_mode = %s
            RETURNING student_id, session_id::text AS session_id, status
            """,
            (args.student_ids, args.study_mode),
        )
        deleted = cur.fetchall()
        conn.commit()
    print(f"Deleted {len(deleted)} session(s) from study_mode={args.study_mode!r}.")
    print_table(deleted)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Inspect and export ProbWeightingApp data from Neon without opening the Neon console."
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=DEFAULT_ENV_FILE,
        help="File containing DATABASE_URL (default: %(default)s; also checks .env.neon.local and .env.local).",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    tables = subparsers.add_parser("tables", help="List tables in a schema with exact row counts.")
    tables.add_argument("--schema", default="public")
    tables.set_defaults(handler=command_tables)

    describe = subparsers.add_parser("describe", help="Show columns for one table.")
    describe.add_argument("table")
    describe.add_argument("--schema", default="public")
    describe.set_defaults(handler=command_describe)

    show = subparsers.add_parser("show", help="Show session, CI, and PWF records for student IDs.")
    show.add_argument("student_ids", nargs="+", help="One or more student IDs.")
    show.add_argument("--completed-only", action="store_true")
    show.set_defaults(handler=command_show)

    export = subparsers.add_parser("export", help="Export sessions, CI, PWF, and comprehension records as CSV files.")
    export.add_argument("--ids", dest="student_ids", nargs="+", help="Limit export to student IDs.")
    export.add_argument("--completed-only", action="store_true", help="Only export completed sessions.")
    export.add_argument("--out", type=Path, required=True, help="Output directory for the four CSV files.")
    export.set_defaults(handler=command_export)

    sql_parser = subparsers.add_parser("sql", help="Run one read-only SQL query locally.")
    sql_parser.add_argument("--sql", required=True, help="A single SELECT, WITH, EXPLAIN, or SHOW query.")
    sql_parser.add_argument("--csv", type=Path, help="Write the returned rows to a CSV instead of the terminal.")
    sql_parser.set_defaults(handler=command_sql)

    delete_student = subparsers.add_parser(
        "delete-student", help="Delete sessions for student IDs; child result rows cascade automatically."
    )
    delete_student.add_argument("student_ids", nargs="+", help="Student IDs to delete.")
    delete_student.add_argument("--study-mode", required=True, choices=("full", "pilot"))
    delete_student.add_argument("--confirm", action="store_true", help="Required before deleting any data.")
    delete_student.set_defaults(handler=command_delete_student)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.handler(args)
    except (RuntimeError, psycopg.Error, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
