import random

PROB_GRID = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8]
AMOUNT_GRID = list(range(10, 110, 10))  # 10〜100（10刻み）
TRIALS_PER_BLOCK = 10
N_BLOCKS = [1, 2, 3]


def generate_trial(N: int, trial_num: int) -> dict:
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
    x = random.choice(AMOUNT_GRID)
    x_prime = random.choice(AMOUNT_GRID)
    block = N_BLOCKS.index(N) + 1
    return {
        "trial": trial_num,
        "block": block,
        "N": N,
        "p": round(p, 10),
        "q": round(q, 10),
        "r": round(r, 10),
        "x": x,
        "x_prime": x_prime,
    }


def generate_all_trials() -> list[dict]:
    """セッション開始時に全30試行を事前生成する。"""
    trials = []
    for block_index, N in enumerate(N_BLOCKS):
        start = block_index * TRIALS_PER_BLOCK + 1
        end = start + TRIALS_PER_BLOCK
        for trial_num in range(start, end):
            trials.append(generate_trial(N=N, trial_num=trial_num))
    return trials
