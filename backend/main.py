import csv
import io
import os
import uuid
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

try:
    from .models.result import SessionStartRequest, TrialResult
    from .storage import (
        StorageError,
        StorageNotConfiguredError,
        create_session,
        get_results_by_student,
        get_summary as get_storage_summary,
        save_result as save_result_record,
        session_exists,
        storage_mode,
    )
    from .trial_generator import generate_all_trials
except ImportError:
    from models.result import SessionStartRequest, TrialResult
    from storage import (
        StorageError,
        StorageNotConfiguredError,
        create_session,
        get_results_by_student,
        get_summary as get_storage_summary,
        save_result as save_result_record,
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


def _raise_storage_http_error(exc: StorageError) -> None:
    if isinstance(exc, StorageNotConfiguredError):
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    raise HTTPException(status_code=500, detail="データベース処理に失敗しました") from exc


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
    trials = generate_all_trials()

    try:
        create_session(session_id, student_id, name, trials)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"session_id": session_id, "trials": trials}


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
# GET /api/results/{student_id}/csv
# ---------------------------------------------------------------------------
CSV_COLUMNS = [
    "StudentID", "Name", "Trial", "Block", "N",
    "p", "q", "r", "x", "x_prime",
    "y", "s", "y_prime",
    "pN", "qN", "rN", "sN",
    "choice", "ci_satisfied", "Timestamp",
]

FIELD_MAP = {
    "StudentID": "student_id",
    "Name": "name",
    "Trial": "trial",
    "Block": "block",
    "N": "N",
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
