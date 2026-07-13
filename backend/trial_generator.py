import random
from typing import Any

PROB_GRID = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]
AMOUNT_GRID = list(range(10, 110, 10))  # 10〜100（10刻み）
TRIALS_PER_BLOCK = 5
PILOT_N = 2


def _validate_assignment(study_mode: str, ci_assignment: dict[str, Any]) -> None:
    """Validate the server-owned condition before generating visible trials."""
    required_fields = {
        "assignment_block",
        "assignment_position",
        "assignment_block_size",
        "assignment_condition",
        "assigned_n",
        "amount_level",
        "amount_multiplier",
    }
    missing = sorted(required_fields.difference(ci_assignment))
    if missing:
        raise ValueError(f"CI assignment is missing required fields: {', '.join(missing)}")
    if ci_assignment["assigned_n"] not in {2, 3}:
        raise ValueError("CI assignment N must be 2 or 3")
    if ci_assignment["amount_level"] not in {"low", "high"}:
        raise ValueError("CI assignment amount level must be low or high")
    if ci_assignment["amount_multiplier"] not in {1, 100}:
        raise ValueError("CI assignment amount multiplier must be 1 or 100")
    if study_mode == "pilot" and ci_assignment["assigned_n"] != PILOT_N:
        raise ValueError("Pilot CI assignments must use N=2")


def generate_trial(N: int, trial_num: int, block: int, ci_assignment: dict[str, Any]) -> dict:
    """
    制約：p > q かつ r != p かつ r != q かつ
    p^N >= 0.05 かつ q^N >= 0.05 かつ r^N >= 0.05
    Prelec(1998)の固定点 1/e ≈ 0.37 付近を重点サンプリングするため
    上記グリッドを使用。
    """
    while True:
        p = random.choice(PROB_GRID)
        q = random.choice(PROB_GRID)
        r = random.choice(PROB_GRID)
        if (
            p > q
            and r != p
            and r != q
            and p**N >= 0.05
            and q**N >= 0.05
            and r**N >= 0.05
        ):
            break
    amount_multiplier = ci_assignment["amount_multiplier"]
    x = random.choice(AMOUNT_GRID) * amount_multiplier
    x_prime = random.choice(AMOUNT_GRID) * amount_multiplier
    return {
        "trial": trial_num,
        "block": block,
        "N": N,
        # Kept as an empty legacy column for compatibility with earlier CSV schemas.
        # CI condition assignment is no longer based on the student ID.
        "student_id_last_digit": "",
        "amount_level": ci_assignment["amount_level"],
        "amount_multiplier": amount_multiplier,
        "ci_assignment_block": ci_assignment["assignment_block"],
        "ci_assignment_position": ci_assignment["assignment_position"],
        "ci_assignment_block_size": ci_assignment["assignment_block_size"],
        "ci_assignment_condition": ci_assignment["assignment_condition"],
        "p": round(p, 10),
        "q": round(q, 10),
        "r": round(r, 10),
        "x": x,
        "x_prime": x_prime,
    }


def generate_all_trials(study_mode: str, ci_assignment: dict[str, Any]) -> list[dict]:
    """Generate all CI trials from the condition allocated by the server."""
    _validate_assignment(study_mode, ci_assignment)
    assigned_n = int(ci_assignment["assigned_n"])
    trials = []
    for trial_num in range(1, TRIALS_PER_BLOCK + 1):
        trials.append(
            generate_trial(
                N=assigned_n,
                trial_num=trial_num,
                block=1,
                ci_assignment=ci_assignment,
            )
        )
    return trials
