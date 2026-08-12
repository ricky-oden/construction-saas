from collections.abc import Callable
from datetime import UTC, datetime
from http import HTTPStatus
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.exceptions import ApiException
from app.core.security import hash_opaque_token
from app.db.session import get_db
from app.models.auth import AuthTokenSession, Role, User

bearer_scheme = HTTPBearer(auto_error=False)


def _unauthorized() -> ApiException:
    return ApiException(
        HTTPStatus.UNAUTHORIZED,
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
    )


def get_current_token_session(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[Session, Depends(get_db)],
) -> AuthTokenSession:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    token_session = session.scalar(
        select(AuthTokenSession)
        .options(joinedload(AuthTokenSession.user).joinedload(User.assignee))
        .where(AuthTokenSession.token_hash == hash_opaque_token(credentials.credentials))
    )
    now = datetime.now(UTC)
    if (
        token_session is None
        or token_session.revoked_at is not None
        or token_session.expires_at <= now
        or not token_session.user.is_active
    ):
        raise _unauthorized()
    return token_session


def get_current_user(
    token_session: Annotated[AuthTokenSession, Depends(get_current_token_session)],
) -> User:
    return token_session.user


def require_roles(*roles: Role) -> Callable[..., User]:
    def role_dependency(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role not in roles:
            raise ApiException(
                HTTPStatus.FORBIDDEN,
                "FORBIDDEN",
                "You do not have permission to perform this operation.",
            )
        return user

    return role_dependency
