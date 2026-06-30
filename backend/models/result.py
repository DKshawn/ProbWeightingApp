from pydantic import BaseModel, field_validator, model_validator
from typing import Any, Optional


class SessionStartRequest(BaseModel):
    student_id: str
    name: str
    study_mode: str = "full"

    @field_validator("study_mode")
    @classmethod
    def validate_study_mode(cls, v: str) -> str:
        if v not in {"full", "pilot"}:
            raise ValueError("study_mode must be one of: full, pilot")
        return v


class TrialResult(BaseModel):
    session_id: str
    student_id: str
    name: str
    study_mode: str = "full"
    experiment_mode: str = "normal"
    time_pressure_seconds: int = 0
    trial: int
    block: int
    N: int
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

    @model_validator(mode="after")
    def validate_indifference_directions(self):
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


class UtilityCurvatureBatch(BaseModel):
    results: list[dict[str, Any]]

    @field_validator("results")
    @classmethod
    def validate_results(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not v:
            raise ValueError("results must not be empty")
        return v
