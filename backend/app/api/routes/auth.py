from datetime import datetime
from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.api.exceptions import ApiException
from app.auth.dependencies import get_current_token_session, get_current_user
from app.auth.service import authenticate_credentials, issue_token, revoke_token
from app.db.session import get_db
from app.models.auth import AuthTokenSession, Role, User

router = APIRouter(prefix="/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=256)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or normalized.startswith("@") or normalized.endswith("@"):
            raise ValueError("Enter a valid email address.")
        return normalized


class AssigneeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    display_name: str


class UserResponse(BaseModel):
    id: int
    email: str
    role: Role
    assignee: AssigneeResponse | None

    @classmethod
    def from_user(cls, user: User) -> "UserResponse":
        assignee = AssigneeResponse.model_validate(user.assignee) if user.assignee else None
        return cls(id=user.id, email=user.email, role=user.role, assignee=assignee)


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_at: datetime
    user: UserResponse


class LogoutResponse(BaseModel):
    status: str = "logged_out"


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, session: Annotated[Session, Depends(get_db)]) -> LoginResponse:
    user = authenticate_credentials(session, payload.email, payload.password)
    if user is None:
        raise ApiException(
            HTTPStatus.UNAUTHORIZED,
            "INVALID_CREDENTIALS",
            "Email or password is incorrect.",
        )
    issued = issue_token(session, user)
    session.refresh(user)
    return LoginResponse(
        token=issued.raw_token,
        expires_at=issued.expires_at,
        user=UserResponse.from_user(user),
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(
    token_session: Annotated[AuthTokenSession, Depends(get_current_token_session)],
    session: Annotated[Session, Depends(get_db)],
) -> LogoutResponse:
    revoke_token(session, token_session)
    return LogoutResponse()


@router.get("/me", response_model=UserResponse)
def me(user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    return UserResponse.from_user(user)
