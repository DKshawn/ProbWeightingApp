import csv
import io
import json
import os
import uuid
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

try:
    from .models.result import CiResult, PwfBatch, SessionStartRequest, UtilityElicitationBatch
    from .storage import (
        DuplicateSubmissionError,
        StorageError,
        StorageNotConfiguredError,
        create_session,
        find_completed_submission,
        get_resume_session,
        get_session,
        get_ci_results_by_session,
        get_pwf_results_by_student,
        get_pwf_results_by_session,
        get_utility_results_by_student,
        get_ci_results_by_student,
        get_summary as get_storage_summary,
        has_other_completed_submission,
        mark_session_completed_if_ready,
        mark_pwf_completed,
        save_ci_result as save_ci_result_record,
        save_pwf_results as save_pwf_result_records,
        save_utility_results as save_utility_result_records,
        storage_mode,
        touch_session,
    )
    from .trial_generator import generate_all_trials
except ImportError:
    from models.result import CiResult, PwfBatch, SessionStartRequest, UtilityElicitationBatch
    from storage import (
        DuplicateSubmissionError,
        StorageError,
        StorageNotConfiguredError,
        create_session,
        find_completed_submission,
        get_resume_session,
        get_session,
        get_ci_results_by_session,
        get_pwf_results_by_student,
        get_pwf_results_by_session,
        get_utility_results_by_student,
        get_ci_results_by_student,
        get_summary as get_storage_summary,
        has_other_completed_submission,
        mark_session_completed_if_ready,
        mark_pwf_completed,
        save_ci_result as save_ci_result_record,
        save_pwf_results as save_pwf_result_records,
        save_utility_results as save_utility_result_records,
        storage_mode,
        touch_session,
    )
    from trial_generator import generate_all_trials

app = FastAPI(title="ProbWeightingApp API")

# CORS: local development, legacy Render URL, and Vercel preview/production URLs.
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "https://probweightingapp.onrender.com",  # Render フロントエンド
]

ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS + [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

if os.getenv("VERCEL_URL"):
    ALLOWED_ORIGINS.append(f"https://{os.environ['VERCEL_URL']}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PWF_TIME_PRESSURE_SECONDS = 15


def _raise_storage_http_error(exc: StorageError) -> None:
    if isinstance(exc, DuplicateSubmissionError):
        raise HTTPException(
            status_code=409,
            detail="この学籍番号はこのモードですでに提出済みです。",
        ) from exc
    if isinstance(exc, StorageNotConfiguredError):
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    raise HTTPException(status_code=500, detail="データベース処理に失敗しました") from exc


def _assign_experiment_mode(student_id: str) -> tuple[str, int]:
    return "normal", 0


def _assign_pwf_experiment_mode(student_id: str) -> tuple[str, int]:
    if not student_id or not student_id[-1].isdigit():
        raise HTTPException(status_code=400, detail="学籍番号の末尾は数字で入力してください")

    last_digit = int(student_id[-1])
    if last_digit % 2 == 0:
        return "time_pressure", PWF_TIME_PRESSURE_SECONDS
    return "normal", 0


def _completed_submission_error() -> None:
    raise HTTPException(
        status_code=409,
        detail="この学籍番号はこのモードですでに提出済みです。",
    )


def _session_not_found_error() -> None:
    raise HTTPException(status_code=404, detail="セッションが見つかりません")


def _session_can_accept_writes(session_id: str) -> dict:
    try:
        session = get_session(session_id)
        if session is None:
            _session_not_found_error()
        if session.get("status") == "completed":
            _completed_submission_error()
        if has_other_completed_submission(session_id):
            _completed_submission_error()
    except StorageError as exc:
        _raise_storage_http_error(exc)
    return session


def _build_session_response(session: dict, *, resumed: bool) -> dict:
    session_id = session["session_id"]
    try:
        saved_ci_results = get_ci_results_by_session(session_id)
        saved_pwf_results = get_pwf_results_by_session(session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    pwf_completed = bool(session.get("pwf_completed")) or bool(saved_ci_results)

    return {
        "session_id": session_id,
        "trials": session["trials"],
        "experiment_mode": session.get("experiment_mode", "normal"),
        "time_pressure_seconds": session.get("time_pressure_seconds", 0),
        "pwf_experiment_mode": _assign_pwf_experiment_mode(session["student_id"])[0],
        "pwf_time_pressure_seconds": _assign_pwf_experiment_mode(session["student_id"])[1],
        "study_mode": session.get("study_mode", "full"),
        "session_status": session.get("status", "started"),
        "resumed": resumed,
        "pwf_completed": pwf_completed,
        "saved_ci_results": saved_ci_results,
        "saved_pwf_results": saved_pwf_results,
    }


# ---------------------------------------------------------------------------
# POST /api/session/start
# ---------------------------------------------------------------------------
@app.post("/api/session/start")
def start_session(req: SessionStartRequest):
    if not req.student_id.strip() or not req.name.strip():
        raise HTTPException(status_code=400, detail="student_id と name は必須です")

    student_id = req.student_id.strip()
    name = req.name.strip()
    study_mode = req.study_mode
    experiment_mode, time_pressure_seconds = _assign_experiment_mode(student_id)

    try:
        if find_completed_submission(student_id, study_mode):
            _completed_submission_error()

        resume_session = get_resume_session(student_id, study_mode)
        if resume_session:
            if mark_session_completed_if_ready(resume_session["session_id"]):
                _completed_submission_error()
            touch_session(resume_session["session_id"])
            resume_session = get_session(resume_session["session_id"])
            return _build_session_response(resume_session, resumed=True)

        session_id = str(uuid.uuid4())
        trials = generate_all_trials(study_mode=study_mode, student_id=student_id)
        create_session(session_id, student_id, name, trials, study_mode, experiment_mode, time_pressure_seconds)
        session = get_session(session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return _build_session_response(session, resumed=False)


# ---------------------------------------------------------------------------
# POST /api/ci-results
# ---------------------------------------------------------------------------
@app.post("/api/ci-results")
def save_ci_result(result: CiResult):
    _session_can_accept_writes(result.session_id)

    record = result.model_dump()
    try:
        save_ci_result_record(record)
        session_completed = mark_session_completed_if_ready(result.session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "session_completed": session_completed}


# ---------------------------------------------------------------------------
# POST /api/session/{session_id}/pwf-complete
# ---------------------------------------------------------------------------
@app.post("/api/session/{session_id}/pwf-complete")
def complete_pwf_session(session_id: str):
    _session_can_accept_writes(session_id)

    try:
        mark_pwf_completed(session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok"}


# ---------------------------------------------------------------------------
# POST /api/utility-results
# ---------------------------------------------------------------------------
@app.post("/api/utility-results")
def save_utility_results(batch: UtilityElicitationBatch):
    session_ids = {result.session_id for result in batch.results}
    if len(session_ids) != 1:
        raise HTTPException(status_code=400, detail="同じセッションの結果だけを送信してください")

    session_id = next(iter(session_ids))
    _session_can_accept_writes(session_id)

    records = [result.model_dump() for result in batch.results]
    try:
        save_utility_result_records(records)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "saved": len(records)}


# ---------------------------------------------------------------------------
# POST /api/pwf-results
# ---------------------------------------------------------------------------
@app.post("/api/pwf-results")
def save_pwf_results(batch: PwfBatch):
    session_ids = {result.get("session_id") for result in batch.results}
    if len(session_ids) != 1 or None in session_ids:
        raise HTTPException(status_code=400, detail="同じセッションの結果だけを送信してください")

    session_id = next(iter(session_ids))
    _session_can_accept_writes(session_id)

    try:
        save_pwf_result_records(batch.results)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "saved": len(batch.results)}


# ---------------------------------------------------------------------------
# GET /api/ci-results/{student_id}/csv
# ---------------------------------------------------------------------------
CI_CSV_COLUMNS = [
    "StudentID", "Name", "Trial", "Block", "N",
    "study_mode", "experiment_mode", "time_pressure_seconds",
    "student_id_last_digit", "amount_level", "amount_multiplier",
    "p", "q", "r", "x", "x_prime",
    "y", "s", "y_prime",
    "pN", "qN", "rN", "sN",
    "choice", "ci_satisfied", "response_time_ms", "timed_out", "Timestamp",
]

CI_FIELD_MAP = {
    "StudentID": "student_id",
    "Name": "name",
    "study_mode": "study_mode",
    "Trial": "trial",
    "Block": "block",
    "N": "N",
    "experiment_mode": "experiment_mode",
    "time_pressure_seconds": "time_pressure_seconds",
    "student_id_last_digit": "student_id_last_digit",
    "amount_level": "amount_level",
    "amount_multiplier": "amount_multiplier",
    "p": "p",
    "q": "q",
    "r": "r",
    "x": "x",
    "x_prime": "x_prime",
    "y": "y",
    "s": "s",
    "y_prime": "y_prime",
    "pN": "pN",
    "qN": "qN",
    "rN": "rN",
    "sN": "sN",
    "choice": "choice",
    "ci_satisfied": "ci_satisfied",
    "response_time_ms": "response_time_ms",
    "timed_out": "timed_out",
    "Timestamp": "Timestamp",
}

UTILITY_CSV_COLUMNS = [
    "StudentID", "Name", "utility_trial", "sequence", "row",
    "study_mode", "experiment_mode", "time_pressure_seconds",
    "p", "r_amount", "R_amount", "x_prev", "x_candidate", "increment",
    "choice", "x_estimate", "switch_lower", "switch_upper", "switch_status",
    "response_time_ms", "timed_out", "Timestamp",
]

UTILITY_FIELD_MAP = {
    "StudentID": "student_id",
    "Name": "name",
    "study_mode": "study_mode",
    "utility_trial": "utility_trial",
    "sequence": "sequence",
    "row": "row",
    "experiment_mode": "experiment_mode",
    "time_pressure_seconds": "time_pressure_seconds",
    "p": "p",
    "r_amount": "r_amount",
    "R_amount": "R_amount",
    "x_prev": "x_prev",
    "x_candidate": "x_candidate",
    "increment": "increment",
    "choice": "choice",
    "x_estimate": "x_estimate",
    "switch_lower": "switch_lower",
    "switch_upper": "switch_upper",
    "switch_status": "switch_status",
    "response_time_ms": "response_time_ms",
    "timed_out": "timed_out",
    "Timestamp": "Timestamp",
}

PWF_CSV_COLUMNS = [
    "session_id", "StudentID", "Name", "study_mode", "pwf_trial",
    "participant", "assignment_group", "assignment_modulus", "student_id_last3",
    "student_id_last_digit", "amount_level", "amount_multiplier", "assigned_block_id",
    "block_id", "block_title", "task_id", "task_category", "is_anchor", "task_index",
    "task_type", "task_mode", "time_limit_seconds", "timed_out",
    "time_over_seconds", "has_memory_task", "memory_digits", "memory_seconds",
    "memory_number", "memory_input_pre", "memory_pre_correct",
    "memory_input_post", "memory_post_correct", "memory_display_duration_ms",
    "memory_pre_response_time_ms", "memory_post_response_time_ms",
    "response_type", "estimate", "switch_lower",
    "switch_upper", "switch_row", "switch_direction", "switch_status",
    "monotonic", "response_time_ms", "reward_payment_rule", "reward_total_amount",
    "reward_raw_total_amount", "reward_raw_all_items_total_amount",
    "reward_item_count", "reward_selected_item_index", "reward_selected_item_label",
    "reward_selected_item_amount", "reward_penalty_reasons", "reward_settled_at",
    "prompt", "source_timestamp",
    "payload_json", "Timestamp",
]

PWF_FIELD_MAP = {
    "session_id": "session_id",
    "StudentID": "student_id",
    "Name": "name",
    "study_mode": "study_mode",
    "pwf_trial": "pwf_trial",
    "participant": "participant",
    "assignment_group": "assignment_group",
    "assignment_modulus": "assignment_modulus",
    "student_id_last3": "student_id_last3",
    "student_id_last_digit": "student_id_last_digit",
    "amount_level": "amount_level",
    "amount_multiplier": "amount_multiplier",
    "assigned_block_id": "assigned_block_id",
    "block_id": "block_id",
    "block_title": "block_title",
    "task_id": "task_id",
    "task_category": "task_category",
    "is_anchor": "is_anchor",
    "task_index": "task_index",
    "task_type": "task_type",
    "task_mode": "task_mode",
    "time_limit_seconds": "time_limit_seconds",
    "timed_out": "timed_out",
    "time_over_seconds": "time_over_seconds",
    "has_memory_task": "has_memory_task",
    "memory_digits": "memory_digits",
    "memory_seconds": "memory_seconds",
    "memory_number": "memory_number",
    "memory_input_pre": "memory_input_pre",
    "memory_pre_correct": "memory_pre_correct",
    "memory_input_post": "memory_input_post",
    "memory_post_correct": "memory_post_correct",
    "memory_display_duration_ms": "memory_display_duration_ms",
    "memory_pre_response_time_ms": "memory_pre_response_time_ms",
    "memory_post_response_time_ms": "memory_post_response_time_ms",
    "response_type": "response_type",
    "estimate": "estimate",
    "switch_lower": "switch_lower",
    "switch_upper": "switch_upper",
    "switch_row": "switch_row",
    "switch_direction": "switch_direction",
    "switch_status": "switch_status",
    "monotonic": "monotonic",
    "response_time_ms": "response_time_ms",
    "reward_payment_rule": "reward_payment_rule",
    "reward_total_amount": "reward_total_amount",
    "reward_raw_total_amount": "reward_raw_total_amount",
    "reward_raw_all_items_total_amount": "reward_raw_all_items_total_amount",
    "reward_item_count": "reward_item_count",
    "reward_selected_item_index": "reward_selected_item_index",
    "reward_selected_item_label": "reward_selected_item_label",
    "reward_selected_item_amount": "reward_selected_item_amount",
    "reward_penalty_reasons": "reward_penalty_reasons",
    "reward_settled_at": "reward_settled_at",
    "prompt": "prompt",
    "source_timestamp": "source_timestamp",
    "payload_json": "payload",
    "Timestamp": "Timestamp",
}


@app.get("/api/ci-results/{student_id}/csv")
def download_ci_csv(student_id: str):
    try:
        student_results = get_ci_results_by_student(student_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not student_results:
        raise HTTPException(status_code=404, detail="該当する結果が見つかりません")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"CI_{student_id}_{timestamp}.csv"

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CI_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for r in student_results:
        row = {col: r.get(CI_FIELD_MAP[col], "") for col in CI_CSV_COLUMNS}
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/utility-results/{student_id}/csv")
def download_utility_csv(student_id: str):
    try:
        student_results = get_utility_results_by_student(student_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not student_results:
        raise HTTPException(status_code=404, detail="該当する utility 結果が見つかりません")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"UtilityElicitation_{student_id}_{timestamp}.csv"

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=UTILITY_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for r in student_results:
        row = {col: r.get(UTILITY_FIELD_MAP[col], "") for col in UTILITY_CSV_COLUMNS}
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/pwf-results/{student_id}/csv")
def download_pwf_csv(student_id: str):
    try:
        student_results = get_pwf_results_by_student(student_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not student_results:
        raise HTTPException(status_code=404, detail="該当する PWF 結果が見つかりません")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"PWF_{student_id}_{timestamp}.csv"

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=PWF_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for r in student_results:
        row = {col: r.get(PWF_FIELD_MAP[col], "") for col in PWF_CSV_COLUMNS}
        payload = row["payload_json"] if isinstance(row["payload_json"], dict) else {}
        feedback = payload.get("feedback") if isinstance(payload.get("feedback"), dict) else {}
        row["task_category"] = row["task_category"] or payload.get("task_category", "")
        row["reward_payment_rule"] = row["reward_payment_rule"] or feedback.get("payment_rule", "")
        row["reward_total_amount"] = row["reward_total_amount"] or feedback.get("total_amount", "")
        row["reward_raw_total_amount"] = row["reward_raw_total_amount"] or feedback.get("raw_total_amount", "")
        row["reward_raw_all_items_total_amount"] = row["reward_raw_all_items_total_amount"] or feedback.get("raw_all_items_total_amount", "")
        row["reward_item_count"] = row["reward_item_count"] or feedback.get("item_count", "")
        row["reward_selected_item_index"] = row["reward_selected_item_index"] or feedback.get("selected_item_index", "")
        row["reward_selected_item_label"] = row["reward_selected_item_label"] or feedback.get("selected_item_label", "")
        row["reward_selected_item_amount"] = row["reward_selected_item_amount"] or feedback.get("selected_item_amount", "")
        row["reward_penalty_reasons"] = row["reward_penalty_reasons"] or "; ".join(feedback.get("penalty_reasons", []) or [])
        row["reward_settled_at"] = row["reward_settled_at"] or feedback.get("settled_at", "")
        row["payload_json"] = json.dumps(row["payload_json"], ensure_ascii=False, separators=(",", ":"))
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# GET /api/ci-results/summary
# ---------------------------------------------------------------------------
@app.get("/api/ci-results/summary")
def get_summary():
    try:
        return get_storage_summary()
    except StorageError as exc:
        _raise_storage_http_error(exc)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "storage": storage_mode(),
        "timestamp": datetime.now().isoformat(),
    }
