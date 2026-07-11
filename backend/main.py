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
    from .models.result import (
        CiMirrorResult,
        CiResult,
        PwfBatch,
        PwfComprehensionEventBatch,
        SessionStartRequest,
        UtilityElicitationBatch,
    )
    from .storage import (
        DuplicateSubmissionError,
        StorageError,
        StorageNotConfiguredError,
        create_session,
        create_ci_settlement,
        find_completed_submission,
        get_resume_session,
        get_session,
        get_ci_results_by_session,
        get_ci_settlement,
        get_pwf_results_by_student,
        get_pwf_results_by_session,
        get_pwf_comprehension_events_by_session,
        get_pwf_comprehension_events_by_student,
        get_utility_results_by_student,
        get_ci_results_by_student,
        get_summary as get_storage_summary,
        has_other_completed_submission,
        has_passed_pwf_comprehension,
        mark_session_completed_if_ready,
        mark_pwf_completed,
        save_ci_mirror_result as save_ci_mirror_result_record,
        save_ci_result as save_ci_result_record,
        save_pwf_results as save_pwf_result_records,
        save_pwf_comprehension_events as save_pwf_comprehension_event_records,
        save_utility_results as save_utility_result_records,
        storage_mode,
        touch_session,
        update_session_enrollment,
    )
    from .trial_generator import generate_all_trials
except ImportError:
    from models.result import (
        CiMirrorResult,
        CiResult,
        PwfBatch,
        PwfComprehensionEventBatch,
        SessionStartRequest,
        UtilityElicitationBatch,
    )
    from storage import (
        DuplicateSubmissionError,
        StorageError,
        StorageNotConfiguredError,
        create_session,
        create_ci_settlement,
        find_completed_submission,
        get_resume_session,
        get_session,
        get_ci_results_by_session,
        get_ci_settlement,
        get_pwf_results_by_student,
        get_pwf_results_by_session,
        get_pwf_comprehension_events_by_session,
        get_pwf_comprehension_events_by_student,
        get_utility_results_by_student,
        get_ci_results_by_student,
        get_summary as get_storage_summary,
        has_other_completed_submission,
        has_passed_pwf_comprehension,
        mark_session_completed_if_ready,
        mark_pwf_completed,
        save_ci_mirror_result as save_ci_mirror_result_record,
        save_ci_result as save_ci_result_record,
        save_pwf_results as save_pwf_result_records,
        save_pwf_comprehension_events as save_pwf_comprehension_event_records,
        save_utility_results as save_utility_result_records,
        storage_mode,
        touch_session,
        update_session_enrollment,
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
        ci_settlement = get_ci_settlement(session_id)
        saved_pwf_results = get_pwf_results_by_session(session_id)
        comprehension_required = bool(session.get("pwf_comprehension_version"))
        comprehension_passed = (
            has_passed_pwf_comprehension(session_id)
            if comprehension_required
            else True
        )
    except StorageError as exc:
        _raise_storage_http_error(exc)

    pwf_completed = (
        bool(session.get("pwf_completed")) and comprehension_passed
        if comprehension_required
        else bool(session.get("pwf_completed")) or bool(saved_ci_results)
    )

    return {
        "session_id": session_id,
        "trials": session["trials"],
        "gender": session.get("gender", ""),
        "consent_version": session.get("consent_version", ""),
        "consent_accepted_at": session.get("consent_accepted_at"),
        "experiment_mode": session.get("experiment_mode", "normal"),
        "time_pressure_seconds": session.get("time_pressure_seconds", 0),
        "pwf_experiment_mode": _assign_pwf_experiment_mode(session["student_id"])[0],
        "pwf_time_pressure_seconds": _assign_pwf_experiment_mode(session["student_id"])[1],
        "study_mode": session.get("study_mode", "full"),
        "session_status": session.get("status", "started"),
        "resumed": resumed,
        "pwf_completed": pwf_completed,
        "pwf_comprehension_required": comprehension_required,
        "pwf_comprehension_version": session.get("pwf_comprehension_version"),
        "pwf_comprehension_passed": comprehension_passed,
        "saved_ci_results": saved_ci_results,
        "ci_settlement": ci_settlement,
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
            update_session_enrollment(
                resume_session["session_id"],
                req.gender,
                req.consent_version,
                req.consent_accepted_at,
            )
            touch_session(resume_session["session_id"])
            resume_session = get_session(resume_session["session_id"])
            return _build_session_response(resume_session, resumed=True)

        session_id = str(uuid.uuid4())
        trials = generate_all_trials(study_mode=study_mode, student_id=student_id)
        create_session(
            session_id,
            student_id,
            name,
            req.gender,
            req.consent_version,
            req.consent_accepted_at,
            trials,
            study_mode,
            experiment_mode,
            time_pressure_seconds,
            req.pwf_comprehension_version,
        )
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
# POST /api/ci-results/mirror
# ---------------------------------------------------------------------------
@app.post("/api/ci-results/mirror")
def save_ci_mirror_result(result: CiMirrorResult):
    _session_can_accept_writes(result.session_id)

    try:
        saved = save_ci_mirror_result_record(result.model_dump())
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "mirror": saved}


# ---------------------------------------------------------------------------
# POST /api/session/{session_id}/ci-settlement
# ---------------------------------------------------------------------------
@app.post("/api/session/{session_id}/ci-settlement")
def settle_ci_payment(session_id: str):
    try:
        existing = get_ci_settlement(session_id)
        if existing:
            return {"status": "ok", "settlement": existing, "session_completed": True}

        _session_can_accept_writes(session_id)
        settlement = create_ci_settlement(session_id)
        session_completed = mark_session_completed_if_ready(session_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    return {"status": "ok", "settlement": settlement, "session_completed": session_completed}


# ---------------------------------------------------------------------------
# POST /api/session/{session_id}/pwf-complete
# ---------------------------------------------------------------------------
@app.post("/api/session/{session_id}/pwf-complete")
def complete_pwf_session(session_id: str):
    session = _session_can_accept_writes(session_id)

    try:
        if session.get("pwf_comprehension_version") and not has_passed_pwf_comprehension(session_id):
            raise HTTPException(status_code=409, detail="理解度確認の合格記録が保存されていません")
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
# POST /api/pwf-comprehension-events
# ---------------------------------------------------------------------------
PWF_COMPREHENSION_EVENT_FIELDS = [
    "question_set_version", "sequence", "event_type", "outcome", "round_number",
    "attempt_number", "attempt_in_round", "attempt_limit", "attempts_before", "attempts_after",
    "answers", "incorrect_question_ids", "correct_count", "passed", "locked_after",
]


def _parse_event_timestamp(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None


def _stored_comprehension_event_matches(stored: dict, requested: dict) -> bool:
    if any(stored.get(field) != requested.get(field) for field in PWF_COMPREHENSION_EVENT_FIELDS):
        return False
    stored_timestamp = _parse_event_timestamp(stored.get("source_timestamp"))
    requested_timestamp = _parse_event_timestamp(requested.get("source_timestamp"))
    return stored_timestamp is not None and stored_timestamp == requested_timestamp


@app.post("/api/pwf-comprehension-events")
def save_pwf_comprehension_events(batch: PwfComprehensionEventBatch):
    session_id = batch.events[0].session_id
    _session_can_accept_writes(session_id)

    records = [
        {
            **event.model_dump(),
            "event_id": str(event.event_id),
        }
        for event in batch.events
    ]
    try:
        save_pwf_comprehension_event_records(records)
        stored_by_id = {
            event["event_id"]: event
            for event in get_pwf_comprehension_events_by_session(session_id)
        }
    except StorageError as exc:
        _raise_storage_http_error(exc)

    confirmed_event_ids = []
    confirmed_pass_event_ids = []
    for record in records:
        stored = stored_by_id.get(record["event_id"])
        if stored is None or not _stored_comprehension_event_matches(stored, record):
            raise HTTPException(
                status_code=409,
                detail="理解度確認イベントIDの保存内容が一致しません",
            )
        confirmed_event_ids.append(record["event_id"])
        if record["event_type"] == "submission" and record["passed"]:
            confirmed_pass_event_ids.append(record["event_id"])

    return {
        "status": "ok",
        "saved": len(confirmed_event_ids),
        "session_id": session_id,
        "confirmed_event_ids": confirmed_event_ids,
        "confirmed_pass_event_ids": confirmed_pass_event_ids,
    }


# ---------------------------------------------------------------------------
# GET /api/ci-results/{student_id}/csv
# ---------------------------------------------------------------------------
CI_CSV_COLUMNS = [
    "StudentID", "StudentIDHash", "Name", "Gender", "Trial", "Block", "N",
    "study_mode", "experiment_mode", "time_pressure_seconds",
    "student_id_last_digit", "amount_level", "amount_multiplier",
    "p", "q", "r", "x", "x_prime",
    "y", "s", "y_prime",
    "pN", "qN", "rN", "sN",
    "choice", "ci_satisfied", "response_time_ms", "timed_out",
    "mirror_order", "mirror_left_option", "mirror_right_option",
    "mirror_choice", "mirror_canonical_choice", "mirror_ci_satisfied",
    "mirror_response_time_ms", "mirror_timed_out", "mirror_timestamp",
    "step1_selected_option", "step1_selection_method", "step1_probability",
    "step1_option_amount", "step1_random_draw", "step1_reward_amount",
    "step2_selected_option", "step2_selection_method", "step2_probability",
    "step2_option_amount", "step2_random_draw", "step2_reward_amount",
    "step3_selected_option", "step3_selection_method", "step3_probability",
    "step3_option_amount", "step3_random_draw", "step3_reward_amount",
    "step4_selected_option", "step4_selection_method", "step4_probability",
    "step4_option_amount", "step4_random_draw", "step4_reward_amount",
    "ci_trial_payment_total", "ci_final_payment_selected", "ci_final_selected_trial",
    "ci_final_payment_total", "ci_final_payment_rule",
    "ci_final_selected_decision", "ci_final_selected_response",
    "ci_final_selected_canonical_response", "ci_final_selected_display_option",
    "ci_final_selected_canonical_option", "ci_final_selected_selection_method",
    "ci_final_selected_probability", "ci_final_selected_option_amount",
    "ci_final_selected_random_draw", "ci_final_selected_reward_amount",
    "ci_final_settled_at", "Timestamp",
]

CI_FIELD_MAP = {
    "StudentID": "student_id",
    "StudentIDHash": "student_id_hash",
    "Name": "name",
    "Gender": "gender",
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
    "mirror_order": "mirror_order",
    "mirror_left_option": "mirror_left_option",
    "mirror_right_option": "mirror_right_option",
    "mirror_choice": "mirror_choice",
    "mirror_canonical_choice": "mirror_canonical_choice",
    "mirror_ci_satisfied": "mirror_ci_satisfied",
    "mirror_response_time_ms": "mirror_response_time_ms",
    "mirror_timed_out": "mirror_timed_out",
    "mirror_timestamp": "mirror_timestamp",
    "ci_trial_payment_total": "trial_payment_total",
    "ci_final_payment_selected": "ci_final_payment_selected",
    "ci_final_selected_trial": "ci_final_selected_trial",
    "ci_final_payment_total": "ci_final_payment_total",
    "ci_final_payment_rule": "ci_final_payment_rule",
    "ci_final_settled_at": "ci_final_settled_at",
    "Timestamp": "Timestamp",
}

UTILITY_CSV_COLUMNS = [
    "StudentID", "StudentIDHash", "Name", "utility_trial", "sequence", "row",
    "study_mode", "experiment_mode", "time_pressure_seconds",
    "p", "r_amount", "R_amount", "x_prev", "x_candidate", "increment",
    "choice", "x_estimate", "switch_lower", "switch_upper", "switch_status",
    "response_time_ms", "timed_out", "Timestamp",
]

UTILITY_FIELD_MAP = {
    "StudentID": "student_id",
    "StudentIDHash": "student_id_hash",
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
    "session_id", "StudentID", "StudentIDHash", "Name", "Gender", "study_mode", "pwf_trial",
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
    "StudentIDHash": "student_id_hash",
    "Name": "name",
    "Gender": "gender",
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

PWF_COMPREHENSION_QUESTION_IDS = [
    "probability_meaning",
    "lottery_tradeoff",
    "standard_answer",
    "indifference_input",
    "serious_answers",
    "indifferent_payment",
]

PWF_COMPREHENSION_CSV_COLUMNS = [
    "event_id", "session_id", "StudentID", "StudentIDHash", "Name", "Gender", "study_mode",
    "question_set_version", "sequence", "event_type", "outcome", "round_number",
    "attempt_number", "attempt_in_round", "attempt_limit", "attempts_before", "attempts_after",
    *[f"answer_{question_id}" for question_id in PWF_COMPREHENSION_QUESTION_IDS],
    "incorrect_question_ids", "correct_count", "passed", "locked_after",
    "answers_json", "source_timestamp", "Timestamp",
]


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
        row = {col: r.get(CI_FIELD_MAP.get(col, ""), "") for col in CI_CSV_COLUMNS}
        payment_details = r.get("payment_details") if isinstance(r.get("payment_details"), dict) else {}
        for step in range(1, 5):
            detail = payment_details.get(f"step{step}") if isinstance(payment_details, dict) else {}
            detail = detail if isinstance(detail, dict) else {}
            row.update({
                f"step{step}_selected_option": detail.get("selected_option", ""),
                f"step{step}_selection_method": detail.get("selection_method", ""),
                f"step{step}_probability": detail.get("probability", ""),
                f"step{step}_option_amount": detail.get("option_amount", ""),
                f"step{step}_random_draw": detail.get("random_draw", ""),
                f"step{step}_reward_amount": detail.get("reward_amount", ""),
            })
        selected_decision = r.get("ci_final_selected_decision_details")
        selected_decision = selected_decision if isinstance(selected_decision, dict) else {}
        row.update({
            "ci_final_selected_decision": selected_decision.get("decision", ""),
            "ci_final_selected_response": selected_decision.get("response", ""),
            "ci_final_selected_canonical_response": selected_decision.get("canonical_response", ""),
            "ci_final_selected_display_option": selected_decision.get("selected_display_option", ""),
            "ci_final_selected_canonical_option": selected_decision.get("selected_canonical_option", ""),
            "ci_final_selected_selection_method": selected_decision.get("selection_method", ""),
            "ci_final_selected_probability": selected_decision.get("probability", ""),
            "ci_final_selected_option_amount": selected_decision.get("option_amount", ""),
            "ci_final_selected_random_draw": selected_decision.get("random_draw", ""),
            "ci_final_selected_reward_amount": selected_decision.get("reward_amount", ""),
        })
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


@app.get("/api/pwf-comprehension-events/{student_id}/csv")
def download_pwf_comprehension_csv(student_id: str):
    try:
        student_events = get_pwf_comprehension_events_by_student(student_id)
    except StorageError as exc:
        _raise_storage_http_error(exc)

    if not student_events:
        raise HTTPException(status_code=404, detail="該当する理解度確認の記録が見つかりません")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"PWF_Comprehension_{student_id}_{timestamp}.csv"

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=PWF_COMPREHENSION_CSV_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for event in student_events:
        answers = event.get("answers") if isinstance(event.get("answers"), dict) else {}
        incorrect_ids = event.get("incorrect_question_ids")
        incorrect_ids = incorrect_ids if isinstance(incorrect_ids, list) else []
        row = {
            "event_id": event.get("event_id", ""),
            "session_id": event.get("session_id", ""),
            "StudentID": event.get("student_id", ""),
            "StudentIDHash": event.get("student_id_hash", ""),
            "Name": event.get("name", ""),
            "Gender": event.get("gender", ""),
            "study_mode": event.get("study_mode", ""),
            "question_set_version": event.get("question_set_version", ""),
            "sequence": event.get("sequence", ""),
            "event_type": event.get("event_type", ""),
            "outcome": event.get("outcome", ""),
            "round_number": event.get("round_number", ""),
            "attempt_number": event.get("attempt_number", ""),
            "attempt_in_round": event.get("attempt_in_round", ""),
            "attempt_limit": event.get("attempt_limit", ""),
            "attempts_before": event.get("attempts_before", ""),
            "attempts_after": event.get("attempts_after", ""),
            "incorrect_question_ids": ";".join(incorrect_ids),
            "correct_count": event.get("correct_count", ""),
            "passed": event.get("passed", ""),
            "locked_after": event.get("locked_after", ""),
            "answers_json": json.dumps(answers, ensure_ascii=False, separators=(",", ":")),
            "source_timestamp": event.get("source_timestamp", ""),
            "Timestamp": event.get("Timestamp", ""),
        }
        for question_id in PWF_COMPREHENSION_QUESTION_IDS:
            row[f"answer_{question_id}"] = answers.get(question_id, "")
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
