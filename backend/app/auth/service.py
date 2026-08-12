from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import generate_opaque_token, hash_opaque_token, verify_password
from app.core.settings import get_settings
from app.models.auth import AuthTokenSession, User


@dataclass(frozen=True)
class IssuedToken:
    raw_token: str
    expires_at: datetime


def normalize_email(email: str) -> str:
    return email.strip().lower()


def authenticate_credentials(session: Session, email: str, password: str) -> User | None:
    user = session.scalar(select(User).where(User.email == normalize_email(email)))
    if user is None or not user.is_active:
        return None
    if not verify_password(user.password_hash, password):
        return None
    return user


def issue_token(session: Session, user: User, now: datetime | None = None) -> IssuedToken:
    issued_at = now or datetime.now(UTC)
    expires_at = issued_at + timedelta(hours=get_settings().auth_token_lifetime_hours)
    raw_token = generate_opaque_token()
    token_hash = hash_opaque_token(raw_token)

    active_sessions = session.scalars(
        select(AuthTokenSession).where(
            AuthTokenSession.user_id == user.id,
            AuthTokenSession.revoked_at.is_(None),
        )
    ).all()
    for active_session in active_sessions:
        active_session.revoked_at = issued_at
    session.flush()

    token_session = AuthTokenSession(
        user_id=user.id,
        token_hash=token_hash,
        issued_at=issued_at,
        expires_at=expires_at,
        revoked_at=None,
    )
    session.add(token_session)
    session.commit()
    return IssuedToken(raw_token=raw_token, expires_at=expires_at)


def revoke_token(session: Session, token_session: AuthTokenSession) -> None:
    token_session.revoked_at = datetime.now(UTC)
    session.commit()
