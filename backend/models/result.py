from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Any, Optional
from datetime import datetime
from uuid import UUID


PWF_COMPREHENSION_VERSION = "2026-07-11-comprehension-v2"
PWF_COMPREHENSION_SUPPORTED_VERSIONS = {
    "2026-07-11-comprehension-v1",
    PWF_COMPREHENSION_VERSION,
}
MIN_STEP2_COMPOUND_PROBABILITY = 0.011


class SessionStartRequest(BaseModel):
    student_id: str
    name: str
    gender: str
    consent_version: str
    consent_accepted_at: datetime
    study_mode: str = "full"
    pwf_comprehension_version: Optional[str] = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in {"male", "female"}:
            raise ValueError("gender must be one of: male, female")
        return v

    @field_validator("consent_version")
    @classmethod
    def validate_consent_version(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("consent_version is required")
        return v.strip()

    @field_validator("study_mode")
    @classmethod
    def validate_study_mode(cls, v: str) -> str:
        if v not in {"full", "pilot"}:
            raise ValueError("study_mode must be one of: full, pilot")
        return v

    @field_validator("pwf_comprehension_version")
    @classmethod
    def validate_pwf_comprehension_version(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in PWF_COMPREHENSION_SUPPORTED_VERSIONS:
            raise ValueError("unsupported pwf_comprehension_version")
        return v


class CiResult(BaseModel):
    session_id: str
    student_id: str
    name: str
    gender: str
    study_mode: str = "full"
    experiment_mode: str = "normal"
    time_pressure_seconds: int = 0
    trial: int
    block: int
    N: int
    student_id_last_digit: str = ""
    amount_level: str = "low"
    amount_multiplier: float = 1
    p: float
    q: float
    r: float
    x: float
    x_prime: float
    y: float
    s: float
    y_prime: float
    pN: float
    qN: float
    rN: float
    sN: float
    choice: str  # "X" / "Indifferent" / "Y" / "Timeout"
    ci_satisfied: bool
    response_time_ms: Optional[int] = None
    timed_out: bool = False
    payment_details: dict[str, dict[str, Any]] = Field(default_factory=dict)
    trial_payment_total: float = 0

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in {"male", "female"}:
            raise ValueError("gender must be one of: male, female")
        return v

    @field_validator("experiment_mode")
    @classmethod
    def validate_experiment_mode(cls, v: str) -> str:
        if v not in {"normal", "time_pressure"}:
            raise ValueError("experiment_mode must be one of: normal, time_pressure")
        return v

    @field_validator("study_mode")
    @classmethod
    def validate_study_mode(cls, v: str) -> str:
        if v not in {"full", "pilot"}:
            raise ValueError("study_mode must be one of: full, pilot")
        return v

    @field_validator("amount_level")
    @classmethod
    def validate_amount_level(cls, v: str) -> str:
        if v not in {"low", "high"}:
            raise ValueError("amount_level must be one of: low, high")
        return v

    @field_validator("amount_multiplier")
    @classmethod
    def validate_amount_multiplier(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount_multiplier must be positive")
        return v

    @field_validator("N")
    @classmethod
    def validate_compound_level(cls, v: int) -> int:
        if v not in {2, 3}:
            raise ValueError("N must be either 2 or 3")
        return v

    @field_validator("choice")
    @classmethod
    def validate_choice(cls, v: str) -> str:
        if v not in {"X", "Indifferent", "Y", "Timeout"}:
            raise ValueError("choice must be one of: X, Indifferent, Y, Timeout")
        return v

    @field_validator("time_pressure_seconds")
    @classmethod
    def validate_time_pressure_seconds(cls, v: int) -> int:
        if v < 0:
            raise ValueError("time_pressure_seconds must be 0 or greater")
        return v

    @field_validator("response_time_ms")
    @classmethod
    def validate_response_time_ms(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("response_time_ms must be 0 or greater")
        return v

    @field_validator("trial_payment_total")
    @classmethod
    def validate_trial_payment_total(cls, v: float) -> float:
        if v < 0:
            raise ValueError("trial_payment_total must be 0 or greater")
        return v

    @model_validator(mode="after")
    def validate_indifference_directions(self):
        if self.s ** self.N < MIN_STEP2_COMPOUND_PROBABILITY:
            raise ValueError("Step 2 compounded probability s^N must be at least 0.011 (1.1%)")
        if abs(self.r - self.p) < 1e-12:
            raise ValueError("CI trial invalid: r must differ from p")
        if abs(self.r - self.q) < 1e-12:
            raise ValueError("CI trial invalid: r must differ from q")

        if self.p > self.q and self.y < self.x:
            raise ValueError(f"Step 1 invalid: probability {self.q:.3f} is lower than {self.p:.3f}, so y cannot be lower than {self.x}")
        if self.p < self.q and self.y > self.x:
            raise ValueError(f"Step 1 invalid: probability {self.q:.3f} is higher than {self.p:.3f}, so y cannot be higher than {self.x}")

        if self.x > self.y and self.s < self.r:
            raise ValueError(f"Step 2 invalid: amount {self.y} is lower than {self.x}, so s cannot be lower than {self.r:.3f}")
        if self.x < self.y and self.s > self.r:
            raise ValueError(f"Step 2 invalid: amount {self.y} is higher than {self.x}, so s cannot be higher than {self.r:.3f}")

        if self.pN > self.qN and self.y_prime < self.x_prime:
            raise ValueError(f"Step 3 invalid: probability {self.qN:.3f} is lower than {self.pN:.3f}, so y_prime cannot be lower than {self.x_prime}")
        if self.pN < self.qN and self.y_prime > self.x_prime:
            raise ValueError(f"Step 3 invalid: probability {self.qN:.3f} is higher than {self.pN:.3f}, so y_prime cannot be higher than {self.x_prime}")

        return self


class CiMirrorResult(BaseModel):
    session_id: str
    trial: int
    mirror_order: int
    mirror_choice: str  # Raw screen choice: "X" (left/A) / "Indifferent" / "Y" (right/B) / "Timeout"
    mirror_response_time_ms: Optional[int] = None
    mirror_timed_out: bool = False

    @field_validator("trial", "mirror_order")
    @classmethod
    def validate_positive_ints(cls, v: int) -> int:
        if v < 1:
            raise ValueError("trial and mirror_order must be positive")
        return v

    @field_validator("mirror_choice")
    @classmethod
    def validate_mirror_choice(cls, v: str) -> str:
        if v not in {"X", "Indifferent", "Y", "Timeout"}:
            raise ValueError("mirror_choice must be one of: X, Indifferent, Y, Timeout")
        return v

    @field_validator("mirror_response_time_ms")
    @classmethod
    def validate_mirror_response_time_ms(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("mirror_response_time_ms must be 0 or greater")
        return v

    @model_validator(mode="after")
    def validate_timeout_consistency(self):
        if self.mirror_timed_out != (self.mirror_choice == "Timeout"):
            raise ValueError("mirror_timed_out must be true exactly when mirror_choice is Timeout")
        return self


class UtilityElicitationResult(BaseModel):
    session_id: str
    student_id: str
    name: str
    study_mode: str = "full"
    experiment_mode: str = "normal"
    time_pressure_seconds: int = 0
    utility_trial: int
    sequence: int
    row: int
    p: float
    r_amount: float
    R_amount: float
    x_prev: float
    x_candidate: float
    increment: float
    choice: str  # "A" / "B" / "Timeout"
    x_estimate: Optional[float] = None
    switch_lower: Optional[float] = None
    switch_upper: Optional[float] = None
    switch_status: str
    response_time_ms: Optional[int] = None
    timed_out: bool = False

    @field_validator("experiment_mode")
    @classmethod
    def validate_experiment_mode(cls, v: str) -> str:
        if v not in {"normal", "time_pressure"}:
            raise ValueError("experiment_mode must be one of: normal, time_pressure")
        return v

    @field_validator("study_mode")
    @classmethod
    def validate_utility_study_mode(cls, v: str) -> str:
        if v not in {"full", "pilot"}:
            raise ValueError("study_mode must be one of: full, pilot")
        return v

    @field_validator("utility_trial", "sequence", "row")
    @classmethod
    def validate_positive_ints(cls, v: int) -> int:
        if v < 1:
            raise ValueError("utility_trial, sequence, and row must be positive")
        return v

    @field_validator("choice")
    @classmethod
    def validate_choice(cls, v: str) -> str:
        if v not in {"A", "B", "Timeout"}:
            raise ValueError("choice must be one of: A, B, Timeout")
        return v

    @field_validator("switch_status")
    @classmethod
    def validate_switch_status(cls, v: str) -> str:
        if v not in {"bracketed", "below_range", "above_range", "timeout"}:
            raise ValueError("switch_status must be one of: bracketed, below_range, above_range, timeout")
        return v

    @field_validator("time_pressure_seconds")
    @classmethod
    def validate_time_pressure_seconds(cls, v: int) -> int:
        if v < 0:
            raise ValueError("time_pressure_seconds must be 0 or greater")
        return v

    @field_validator("response_time_ms")
    @classmethod
    def validate_response_time_ms(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("response_time_ms must be 0 or greater")
        return v

    @model_validator(mode="after")
    def validate_utility_design(self):
        if self.choice == "Timeout":
            if self.switch_status != "timeout":
                raise ValueError("timeout choices must use switch_status timeout")
            return self

        if self.p <= 0 or self.p >= 1:
            raise ValueError("p must be greater than 0 and less than 1")
        if self.r_amount >= self.R_amount:
            raise ValueError("r_amount must be lower than R_amount")
        if self.x_prev <= self.R_amount:
            raise ValueError("x_prev must be greater than R_amount")
        if self.x_candidate <= self.x_prev:
            raise ValueError("x_candidate must be greater than x_prev")
        if self.increment <= 0:
            raise ValueError("increment must be positive")
        return self


class UtilityElicitationBatch(BaseModel):
    results: list[UtilityElicitationResult]

    @field_validator("results")
    @classmethod
    def validate_results(cls, v: list[UtilityElicitationResult]) -> list[UtilityElicitationResult]:
        if not v:
            raise ValueError("results must not be empty")
        return v

    @model_validator(mode="after")
    def validate_single_switch_points(self):
        grouped: dict[tuple[str, int], list[UtilityElicitationResult]] = {}
        for result in self.results:
            grouped.setdefault((result.session_id, result.sequence), []).append(result)

        for (_session_id, sequence), rows in grouped.items():
            sorted_rows = sorted(rows, key=lambda result: result.row)
            has_timeout = any(result.choice == "Timeout" for result in sorted_rows)
            if has_timeout:
                if any(result.choice != "Timeout" for result in sorted_rows):
                    raise ValueError(f"Utility sequence {sequence} cannot mix timeout and lottery choices")
                continue

            first_b_index = next(
                (index for index, result in enumerate(sorted_rows) if result.choice == "B"),
                None,
            )
            if first_b_index is None:
                continue
            if any(result.choice == "A" for result in sorted_rows[first_b_index + 1:]):
                raise ValueError(f"Utility sequence {sequence} must have at most one switch point")

        return self


class PwfBatch(BaseModel):
    results: list[dict[str, Any]]

    @field_validator("results")
    @classmethod
    def validate_results(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not v:
            raise ValueError("results must not be empty")
        return v


PWF_COMPREHENSION_ANSWER_KEY = {
    "probability_meaning": "b",
    "lottery_tradeoff": "d",
    "standard_answer": "no",
    "indifference_input": "c",
    "serious_answers": "yes",
    "indifferent_payment": "d",
}
PWF_COMPREHENSION_ALLOWED_ANSWERS = {
    "probability_meaning": {"a", "b", "c", "d"},
    "lottery_tradeoff": {"a", "b", "c", "d"},
    "standard_answer": {"yes", "no"},
    "indifference_input": {"a", "b", "c", "d"},
    "serious_answers": {"yes", "no"},
    "indifferent_payment": {"a", "b", "c", "d"},
}


class PwfComprehensionEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    session_id: str
    question_set_version: str
    sequence: int = Field(ge=1)
    event_type: str
    outcome: str
    round_number: int = Field(ge=1)
    attempt_number: Optional[int] = Field(default=None, ge=1)
    attempt_in_round: Optional[int] = Field(default=None, ge=1)
    attempt_limit: int = Field(ge=1, le=3)
    attempts_before: int = Field(ge=0, le=3)
    attempts_after: int = Field(ge=0, le=3)
    answers: dict[str, str]
    incorrect_question_ids: list[str] = Field(default_factory=list)
    correct_count: int = Field(ge=0, le=6)
    passed: bool
    locked_after: bool
    source_timestamp: datetime

    @field_validator("source_timestamp")
    @classmethod
    def validate_source_timestamp(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("source_timestamp must include a timezone")
        return value

    @model_validator(mode="after")
    def validate_event_consistency(self):
        if self.question_set_version not in PWF_COMPREHENSION_SUPPORTED_VERSIONS:
            raise ValueError("unsupported PWF comprehension question_set_version")
        if self.event_type not in {"submission", "unlock"}:
            raise ValueError("event_type must be one of: submission, unlock")
        if self.outcome not in {"failed", "locked", "passed", "unlocked"}:
            raise ValueError("outcome must be one of: failed, locked, passed, unlocked")

        question_ids = set(PWF_COMPREHENSION_ANSWER_KEY)
        answer_ids = set(self.answers)
        if not answer_ids.issubset(question_ids):
            raise ValueError("answers contains an unknown comprehension question")
        for question_id, answer in self.answers.items():
            if answer not in PWF_COMPREHENSION_ALLOWED_ANSWERS[question_id]:
                raise ValueError(f"invalid answer for comprehension question: {question_id}")

        incorrect_ids = list(self.incorrect_question_ids)
        if len(incorrect_ids) != len(set(incorrect_ids)) or not set(incorrect_ids).issubset(question_ids):
            raise ValueError("incorrect_question_ids must contain unique known question ids")
        computed_incorrect = [
            question_id
            for question_id in PWF_COMPREHENSION_ANSWER_KEY
            if question_id in self.answers
            and self.answers[question_id] != PWF_COMPREHENSION_ANSWER_KEY[question_id]
        ]

        if self.event_type == "submission":
            if answer_ids != question_ids:
                raise ValueError("submission events must contain answers to all six comprehension questions")
            if set(incorrect_ids) != set(computed_incorrect):
                raise ValueError("incorrect_question_ids does not match the submitted answers")
            expected_limit = 3 if self.round_number == 1 else 2
            if self.attempt_limit != expected_limit:
                raise ValueError("attempt_limit does not match the comprehension round")
            if self.attempt_number is None or self.attempt_in_round is None:
                raise ValueError("submission events require attempt_number and attempt_in_round")
            if self.attempt_in_round != self.attempt_limit - self.attempts_before + 1:
                raise ValueError("attempt_in_round does not match attempts_before")
            if self.attempt_in_round > self.attempt_limit:
                raise ValueError("attempt_in_round cannot exceed attempt_limit")
            if self.attempts_after != self.attempts_before - 1:
                raise ValueError("submission attempts_after must be one less than attempts_before")
            expected_passed = not computed_incorrect
            expected_locked = not expected_passed and self.attempts_after == 0
            expected_outcome = "passed" if expected_passed else "locked" if expected_locked else "failed"
            if self.passed != expected_passed or self.locked_after != expected_locked or self.outcome != expected_outcome:
                raise ValueError("submission outcome flags do not match the submitted answers")
            if self.correct_count != len(question_ids) - len(computed_incorrect):
                raise ValueError("correct_count does not match the submitted answers")
            return self

        if self.round_number <= 1:
            raise ValueError("unlock events must start a retry round after the initial round")
        if self.outcome != "unlocked" or self.passed or self.locked_after:
            raise ValueError("unlock event outcome flags are inconsistent")
        if self.attempt_number is not None or self.attempt_in_round is not None:
            raise ValueError("unlock events cannot contain attempt numbers")
        if self.attempt_limit != 2 or self.attempts_before != 0 or self.attempts_after != 2:
            raise ValueError("unlock events must grant exactly two new attempts")
        if incorrect_ids or computed_incorrect:
            raise ValueError("unlock events may only retain previously correct answers")
        if self.correct_count != len(self.answers):
            raise ValueError("unlock correct_count must match retained answers")
        return self


class PwfComprehensionEventBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    events: list[PwfComprehensionEvent]

    @field_validator("events")
    @classmethod
    def validate_events(cls, value: list[PwfComprehensionEvent]) -> list[PwfComprehensionEvent]:
        if not value:
            raise ValueError("events must not be empty")
        if len({event.event_id for event in value}) != len(value):
            raise ValueError("events must not repeat event_id values")
        if len({event.session_id for event in value}) != 1:
            raise ValueError("events must belong to one session")
        return value
