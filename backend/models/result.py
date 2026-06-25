from pydantic import BaseModel, field_validator
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
