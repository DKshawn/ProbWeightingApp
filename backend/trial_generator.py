import random

PROB_GRID = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]
AMOUNT_GRID = list(range(10, 110, 10))  # 10〜100（10刻み）
TRIALS_PER_BLOCK = 5
PILOT_N = 2
FULL_N_OPTIONS = [2, 3]


def assign_full_n(student_id: str) -> int:
    digits = "".join(ch for ch in str(student_id) if ch.isdigit())
    if not digits:
        return FULL_N_OPTIONS[0]
    bucket = int(digits[-2:]) if len(digits) >= 2 else int(digits[-1])
    return 2 if bucket % 4 in {0, 1} else 3


def assign_ci_amount_level(student_id: str) -> dict:
    normalized = str(student_id).strip()
    last_digit_text = normalized[-1:] if normalized else ""
    last_digit = int(last_digit_text) if last_digit_text.isdigit() else 1
    is_high_amount = last_digit % 2 == 0
    return {
        "student_id_last_digit": last_digit_text,
        "amount_level": "high" if is_high_amount else "low",
        "amount_multiplier": 10 if is_high_amount else 1,
    }


def generate_trial(N: int, trial_num: int, block: int, amount_assignment: dict) -> dict:
    """
    制約：p > q かつ p^N >= 0.05 かつ q^N >= 0.05 かつ r^N >= 0.05
    Prelec(1998)の固定点 1/e ≈ 0.37 付近を重点サンプリングするため
    上記グリッドを使用。
    """
    while True:
        p = random.choice(PROB_GRID)
        q = random.choice(PROB_GRID)
        r = random.choice(PROB_GRID)
        if (
            p > q
            and p**N >= 0.05
            and q**N >= 0.05
            and r**N >= 0.05
        ):
            break
    amount_multiplier = amount_assignment["amount_multiplier"]
    x = random.choice(AMOUNT_GRID) * amount_multiplier
    x_prime = random.choice(AMOUNT_GRID) * amount_multiplier
    return {
        "trial": trial_num,
        "block": block,
        "N": N,
        "student_id_last_digit": amount_assignment["student_id_last_digit"],
        "amount_level": amount_assignment["amount_level"],
        "amount_multiplier": amount_multiplier,
        "p": round(p, 10),
        "q": round(q, 10),
        "r": round(r, 10),
        "x": x,
        "x_prime": x_prime,
    }


def generate_all_trials(study_mode: str = "full", student_id: str = "") -> list[dict]:
    """セッション開始時に全試行を事前生成する。"""
    assigned_n = PILOT_N if study_mode == "pilot" else assign_full_n(student_id)
    amount_assignment = assign_ci_amount_level(student_id)
    trials = []
    for trial_num in range(1, TRIALS_PER_BLOCK + 1):
        trials.append(
            generate_trial(
                N=assigned_n,
                trial_num=trial_num,
                block=1,
                amount_assignment=amount_assignment,
            )
        )
    return trials
