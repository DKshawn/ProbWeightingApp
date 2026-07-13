#!/usr/bin/env python3
"""Verify CI server-side balanced assignment without touching Neon."""

from __future__ import annotations

import os
import json
import socket
import sys
import threading
import time
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

import uvicorn

os.environ["ALLOW_MEMORY_STORAGE"] = "1"
os.environ.pop("DATABASE_URL", None)
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from main import app  # noqa: E402
from storage import create_session, get_ci_results_by_session, get_resume_session, get_session  # noqa: E402
from trial_generator import generate_all_trials  # noqa: E402


FULL_CELLS = {
    ("N2_low", 2, "low", 1.0),
    ("N2_high", 2, "high", 100.0),
    ("N3_low", 3, "low", 1.0),
    ("N3_high", 3, "high", 100.0),
}
PILOT_CELLS = {
    ("N2_low", 2, "low", 1.0),
    ("N2_high", 2, "high", 100.0),
}


def create_test_session(index: int, study_mode: str) -> dict:
    session_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    trials = create_session(
        session_id=session_id,
        student_id=f"balanced-{study_mode}-{index:03d}",
        name="CI assignment verification",
        gender="male",
        consent_version="verification-v1",
        consent_accepted_at=created_at,
        trial_factory=lambda assignment: generate_all_trials(
            study_mode=study_mode,
            ci_assignment=assignment,
        ),
        study_mode=study_mode,
    )
    session = get_session(session_id)
    assert session is not None
    assert session["trials"] == trials
    return session


def assignment_cell(session: dict) -> tuple[str, int, str, float]:
    return (
        session["ci_assignment_condition"],
        int(session["ci_assigned_n"]),
        session["ci_amount_level"],
        float(session["ci_amount_multiplier"]),
    )


def assert_block_balance(sessions: list[dict], expected_cells: set[tuple[str, int, str, float]]) -> None:
    by_block: dict[int, list[dict]] = {}
    for session in sessions:
        by_block.setdefault(int(session["ci_assignment_block"]), []).append(session)

    expected_positions = set(range(1, len(expected_cells) + 1))
    for assignment_block, block_sessions in by_block.items():
        assert len(block_sessions) == len(expected_cells), (
            f"block {assignment_block} should have {len(expected_cells)} assignments, "
            f"got {len(block_sessions)}"
        )
        assert {assignment_cell(session) for session in block_sessions} == expected_cells
        assert {int(session["ci_assignment_position"]) for session in block_sessions} == expected_positions
        for session in block_sessions:
            assert int(session["ci_assignment_block_size"]) == len(expected_cells)
            for trial in session["trials"]:
                assert int(trial["N"]) == int(session["ci_assigned_n"])
                assert trial["amount_level"] == session["ci_amount_level"]
                assert float(trial["amount_multiplier"]) == float(session["ci_amount_multiplier"])
                assert int(trial["ci_assignment_block"]) == assignment_block
                assert trial["ci_assignment_condition"] == session["ci_assignment_condition"]


def _free_local_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _request_json(base_url: str, method: str, path: str, payload: dict | None = None) -> tuple[int, str]:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"{base_url}{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    with urllib.request.urlopen(request, timeout=5) as response:
        return response.status, response.read().decode("utf-8")


def main() -> None:
    # Eight concurrent formal starts must produce exactly two complete 4-cell blocks.
    with ThreadPoolExecutor(max_workers=8) as pool:
        full_sessions = list(pool.map(lambda i: create_test_session(i, "full"), range(8)))
    assert_block_balance(full_sessions, FULL_CELLS)

    # Resume must return the original condition and must not consume a new slot.
    first = full_sessions[0]
    resumed = get_resume_session(first["student_id"], "full")
    assert resumed is not None and resumed["session_id"] == first["session_id"]
    assert assignment_cell(resumed) == assignment_cell(first)

    # The pilot protocol remains N=2, while its amount level is still balanced.
    with ThreadPoolExecutor(max_workers=4) as pool:
        pilot_sessions = list(pool.map(lambda i: create_test_session(i, "pilot"), range(4)))
    assert_block_balance(pilot_sessions, PILOT_CELLS)

    # Exercise the public API: session response, server-authoritative CI record
    # metadata, and the CSV export all carry the same assigned condition.
    port = _free_local_port()
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()
    deadline = time.monotonic() + 5
    while not server.started and time.monotonic() < deadline:
        time.sleep(0.02)
    assert server.started, "verification API server did not start"
    base_url = f"http://127.0.0.1:{port}"

    try:
        status, body = _request_json(
            base_url,
            "POST",
            "/api/session/start",
            {
            "student_id": "balanced-api-001",
            "name": "CI API verification",
            "gender": "female",
            "consent_version": "verification-v1",
            "consent_accepted_at": datetime.now(timezone.utc).isoformat(),
            "study_mode": "full",
            "pwf_comprehension_version": "2026-07-11-comprehension-v2",
        },
        )
        assert status == 200, body
        api_session = json.loads(body)
        api_assignment = api_session["ci_assignment"]
        trial = api_session["trials"][0]
        assert trial["ci_assignment_condition"] == api_assignment["assignment_condition"]
        assert trial["N"] == api_assignment["assigned_n"]

        resumed_status, resumed_body = _request_json(
            base_url,
            "POST",
            "/api/session/start",
            {
                "student_id": "balanced-api-001",
                "name": "CI API verification",
                "gender": "female",
                "consent_version": "verification-v1",
                "consent_accepted_at": datetime.now(timezone.utc).isoformat(),
                "study_mode": "full",
                "pwf_comprehension_version": "2026-07-11-comprehension-v2",
            },
        )
        assert resumed_status == 200, resumed_body
        resumed_session = json.loads(resumed_body)
        assert resumed_session["resumed"] is True
        assert resumed_session["session_id"] == api_session["session_id"]
        assert resumed_session["ci_assignment"] == api_assignment

        result_status, result_body = _request_json(
            base_url,
            "POST",
            "/api/ci-results",
            {
            "session_id": api_session["session_id"],
            "student_id": "balanced-api-001",
            "name": "CI API verification",
            "gender": "female",
            "study_mode": "full",
            "experiment_mode": "normal",
            "time_pressure_seconds": 0,
            "trial": trial["trial"],
            "block": trial["block"],
            "N": trial["N"],
            "student_id_last_digit": "9",
            "amount_level": "low",
            "amount_multiplier": 1,
            "ci_assignment_block": 999,
            "ci_assignment_position": 999,
            "ci_assignment_block_size": 999,
            "ci_assignment_condition": "forged",
            "p": trial["p"],
            "q": trial["q"],
            "r": trial["r"],
            "x": trial["x"],
            "x_prime": trial["x_prime"],
            "y": trial["x"],
            "s": trial["r"],
            "y_prime": trial["x_prime"],
            "pN": round(trial["p"] ** trial["N"], 10),
            "qN": round(trial["q"] ** trial["N"], 10),
            "rN": round(trial["r"] ** trial["N"], 10),
            "sN": round(trial["r"] ** trial["N"], 10),
            "choice": "Indifferent",
            "ci_satisfied": True,
            "response_time_ms": 100,
            "timed_out": False,
        },
        )
        assert result_status == 200, result_body
        stored = get_ci_results_by_session(api_session["session_id"])
        assert len(stored) == 1
        assert stored[0]["ci_assignment_condition"] == api_assignment["assignment_condition"]
        assert stored[0]["ci_assignment_block"] == api_assignment["assignment_block"]
        assert stored[0]["student_id_last_digit"] == ""

        csv_status, csv_body = _request_json(base_url, "GET", "/api/ci-results/balanced-api-001/csv")
        assert csv_status == 200, csv_body
        assert "ci_assignment_condition" in csv_body.splitlines()[0]
        assert api_assignment["assignment_condition"] in csv_body
    finally:
        server.should_exit = True
        server_thread.join(timeout=5)

    print("CI balanced assignment verification passed: full=2 complete 4-cell blocks, pilot=2 complete 2-cell blocks, API/CSV mapping")


if __name__ == "__main__":
    main()
