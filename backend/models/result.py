from pydantic import BaseModel, field_validator, model_validator
from typing import Optional


class SessionStartRequest(BaseModel):
    student_id: str
    name: str


class TrialResult(BaseModel):
    session_id: str
    student_id: str
    name: str
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
