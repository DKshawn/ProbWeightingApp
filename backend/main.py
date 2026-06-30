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
    from .models.result import SessionStartRequest, TrialResult, UtilityCurvatureBatch, UtilityElicitationBatch
    from .storage import (
        StorageError,
        StorageNotConfiguredError,
        create_session,
        get_utility_curvature_results_by_student,
        get_utility_results_by_student,
        get_results_by_student,
        get_summary as get_storage_summary,
        save_result as save_result_record,
        save_utility_curvature_results as save_utility_curvature_result_records,
        save_utility_results as save_utility_result_records,
        session_exists,
        storage_mode,
    )
    from .trial_generator import generate_all_trials
except ImportError:
    from models.result import SessionStartRequest, TrialResult, UtilityCurvatureBatch, UtilityElicitationBatch
    from storage import (
        StorageError,
        StorageNotConfiguredError,
        create_session,
        get_utility_curvature_results_by_student,
        get_utility_results_by_student,
        get_results_by_student,
        get_summary as get_storage_summary,
        save_result as save_result_record,
        save_utility_curvature_results as save_utility_curvature_result_records,
        save_utility_results as save_utility_result_records,
        session_exists,
        storage_mode,
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

UTILITY_TIME_PRESSURE_SECONDS = 15


def _raise_storage_http_error(exc: StorageError) -> None:
    if isinstance(exc, StorageNotConfiguredError):
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    raise HTTPException(status_code=500, detail="データベース処理に失敗しました") from exc


def _assign_experiment_mode(student_id: str) -> tuple[str, int]:
    return "normal", 0


def _assign_utility_experiment_mode(student_id: str) -> tuple[str, int]:
    if not student_id or not student_id[-1].isdigit():
        raise HTTPException(status_code=400, detail="学籍番号の末尾は数字で入力してください")

    last_digit = int(student_id[-1])
    if last_digit % 2 == 0:
        return "time_pressure", UTILITY_TIME_PRESSURE_SECONDS
    return "normal", 0


# ---------------------------------------------------------------------------
# POST /api/session/start
# ---------------------------------------------------------------------------
@app.post("/api/session/start")
def start_session(req: SessionStartRequest):
    if not req.student_id.strip() or not req.name.strip():
        raise HTTPException(status_code=400, detail="student_id と name は必須です")

    session_id = str(uuid.uuid4())
    student_id = req.student_id.strip()
    name = req.name.strip()
    study_mode = req.study_mode
    experiment_mode, time_pressure_seconds = _assign_experiment_mode(student_id)
    utility_experiment_mode, utility_time_pressure_seconds = _assign_utility_experiment_mode(student_id)
    trials = generate_all_trials(study_mode=study_mode)

    try:
        create_session(session_id, student_id, name, trials, study_mode, experiment_mode, time_pressure_seconds)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {
        "session_id": session_id,
        "trials": trials,
        "experiment_mode": experiment_mode,
        "time_pressure_seconds": time_pressure_seconds,
        "utility_experiment_mode": utility_experiment_mode,
        "utility_time_pressure_seconds": utility_time_pressure_seconds,
        "study_mode": study_mode,
    }


# ---------------------------------------------------------------------------
# POST /api/results
# ---------------------------------------------------------------------------
@app.post("/api/results")
def save_result(result: TrialResult):
    try:
        exists = session_exists(result.session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not exists:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    record = result.model_dump()
    try:
        save_result_record(record)
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
    try:
        exists = session_exists(session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not exists:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    records = [result.model_dump() for result in batch.results]
    try:
        save_utility_result_records(records)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "saved": len(records)}


# ---------------------------------------------------------------------------
# POST /api/utility-curvature-results
# ---------------------------------------------------------------------------
@app.post("/api/utility-curvature-results")
def save_utility_curvature_results(batch: UtilityCurvatureBatch):
    session_ids = {result.get("session_id") for result in batch.results}
    if len(session_ids) != 1 or None in session_ids:
        raise HTTPException(status_code=400, detail="同じセッションの結果だけを送信してください")

    session_id = next(iter(session_ids))
    try:
        exists = session_exists(session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not exists:
        raise HTTPException(status_code=404, detail="セッションが見つかりません")

    try:
        save_utility_curvature_result_records(batch.results)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "saved": len(batch.results)}


# ---------------------------------------------------------------------------
# GET /api/results/{student_id}/csv
# ---------------------------------------------------------------------------
CSV_COLUMNS = [
    "StudentID", "Name", "Trial", "Block", "N",
    "study_mode", "experiment_mode", "time_pressure_seconds",
    "p", "q", "r", "x", "x_prime",
    "y", "s", "y_prime",
    "pN", "qN", "rN", "sN",
    "choice", "ci_satisfied", "response_time_ms", "timed_out", "Timestamp",
]

FIELD_MAP = {
    "StudentID": "student_id",
    "Name": "name",
    "study_mode": "study_mode",
    "Trial": "trial",
    "Block": "block",
    "N": "N",
    "experiment_mode": "experiment_mode",
    "time_pressure_seconds": "time_pressure_seconds",
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

UTILITY_CURVATURE_CSV_COLUMNS = [
    "session_id", "StudentID", "Name", "study_mode", "curvature_trial",
    "participant", "assignment_group", "assignment_modulus", "student_id_last3",
    "assigned_block_id", "block_id", "block_title", "task_id", "is_anchor",
    "task_index", "task_type", "task_mode", "time_limit_seconds", "timed_out",
    "time_over_seconds", "response_type", "estimate", "switch_lower",
    "switch_upper", "switch_row", "switch_direction", "switch_status",
    "monotonic", "response_time_ms", "prompt", "source_timestamp",
    "payload_json", "Timestamp",
]

UTILITY_CURVATURE_FIELD_MAP = {
    "session_id": "session_id",
    "StudentID": "student_id",
    "Name": "name",
    "study_mode": "study_mode",
    "curvature_trial": "curvature_trial",
    "participant": "participant",
    "assignment_group": "assignment_group",
    "assignment_modulus": "assignment_modulus",
    "student_id_last3": "student_id_last3",
    "assigned_block_id": "assigned_block_id",
    "block_id": "block_id",
    "block_title": "block_title",
    "task_id": "task_id",
    "is_anchor": "is_anchor",
    "task_index": "task_index",
    "task_type": "task_type",
    "task_mode": "task_mode",
    "time_limit_seconds": "time_limit_seconds",
    "timed_out": "timed_out",
    "time_over_seconds": "time_over_seconds",
    "response_type": "response_type",
    "estimate": "estimate",
    "switch_lower": "switch_lower",
    "switch_upper": "switch_upper",
    "switch_row": "switch_row",
    "switch_direction": "switch_direction",
    "switch_status": "switch_status",
    "monotonic": "monotonic",
    "response_time_ms": "response_time_ms",
    "prompt": "prompt",
    "source_timestamp": "source_timestamp",
    "payload_json": "payload",
    "Timestamp": "Timestamp",
}


@app.get("/api/results/{student_id}/csv")
def download_csv(student_id: str):
    try:
        student_results = get_results_by_student(student_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not student_results:
        raise HTTPException(status_code=404, detail="該当する結果が見つかりません")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ProbWeighting_{student_id}_{timestamp}.csv"

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for r in student_results:
        row = {col: r.get(FIELD_MAP[col], "") for col in CSV_COLUMNS}
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


@app.get("/api/utility-curvature-results/{student_id}/csv")
def download_utility_curvature_csv(student_id: str):
    try:
        student_results = get_utility_curvature_results_by_student(student_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not student_results:
        raise HTTPException(status_code=404, detail="該当する utility curvature 結果が見つかりません")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"UtilityCurvature_{student_id}_{timestamp}.csv"

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=UTILITY_CURVATURE_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for r in student_results:
        row = {col: r.get(UTILITY_CURVATURE_FIELD_MAP[col], "") for col in UTILITY_CURVATURE_CSV_COLUMNS}
        row["payload_json"] = json.dumps(row["payload_json"], ensure_ascii=False, separators=(",", ":"))
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# GET /api/results/summary
# ---------------------------------------------------------------------------
@app.get("/api/results/summary")
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
