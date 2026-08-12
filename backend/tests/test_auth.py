from datetime import UTC, datetime, timedelta
from typing import Annotated

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.auth.service import issue_token
from app.core.security import hash_opaque_token, hash_password
from app.main import create_app
from app.models.auth import Assignee, AuthTokenSession, Role, User

PASSWORD = "ValidDemoPassword123!"


def create_user(
    session: Session,
    *,
    email: str = "member@example.com",
    role: Role = Role.MEMBER,
    is_active: bool = True,
    with_assignee: bool = False,
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        is_active=is_active,
    )
    session.add(user)
    session.flush()
    if with_assignee:
        session.add(Assignee(user_id=user.id, display_name="Demo Assignee"))
    session.commit()
    session.refresh(user)
    return user


def login(client: TestClient, email: str = "member@example.com", password: str = PASSWORD):
    return client.post("/api/v1/auth/login", json={"email": email, "password": password})


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_login_stores_only_sha256_hash_and_returns_eight_hour_token(
    db_session: Session,
) -> None:
    create_user(db_session, with_assignee=True)
    client = TestClient(create_app())

    response = login(client)

    assert response.status_code == 200
    payload = response.json()
    raw_token = payload["token"]
    assert len(raw_token) >= 43
    stored = db_session.scalar(select(AuthTokenSession))
    assert stored is not None
    assert stored.token_hash == hash_opaque_token(raw_token)
    assert stored.token_hash != raw_token
    assert raw_token not in stored.token_hash
    assert stored.expires_at - stored.issued_at == timedelta(hours=8)
    stored_user = db_session.scalar(select(User).where(User.email == "member@example.com"))
    assert stored_user is not None
    assert stored_user.password_hash.startswith("$argon2id$")
    assert payload["user"]["assignee"]["display_name"] == "Demo Assignee"


@pytest.mark.parametrize("password", ["wrong-password", ""])
def test_login_rejects_invalid_credentials(db_session: Session, password: str) -> None:
    create_user(db_session)

    response = login(TestClient(create_app()), password=password)

    assert response.status_code in {401, 422}
    assert "password_hash" not in response.text


def test_inactive_user_cannot_login_or_keep_using_token(db_session: Session) -> None:
    user = create_user(db_session)
    client = TestClient(create_app())
    raw_token = login(client).json()["token"]
    user.is_active = False
    db_session.commit()

    assert login(client).status_code == 401
    response = client.get("/api/v1/auth/me", headers=bearer(raw_token))
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTHENTICATION_REQUIRED"


def test_relogin_invalidates_old_token_and_keeps_one_session(db_session: Session) -> None:
    create_user(db_session)
    client = TestClient(create_app())
    old_token = login(client).json()["token"]
    new_token = login(client).json()["token"]

    assert old_token != new_token
    assert client.get("/api/v1/auth/me", headers=bearer(old_token)).status_code == 401
    assert client.get("/api/v1/auth/me", headers=bearer(new_token)).status_code == 200
    assert db_session.scalar(select(func.count()).select_from(AuthTokenSession)) == 2
    assert (
        db_session.scalar(
            select(func.count())
            .select_from(AuthTokenSession)
            .where(AuthTokenSession.revoked_at.is_(None))
        )
        == 1
    )
    assert (
        db_session.scalar(
            select(func.count())
            .select_from(AuthTokenSession)
            .where(AuthTokenSession.revoked_at.is_not(None))
        )
        == 1
    )


def test_logout_revokes_current_token(db_session: Session) -> None:
    create_user(db_session)
    client = TestClient(create_app())
    raw_token = login(client).json()["token"]

    response = client.post("/api/v1/auth/logout", headers=bearer(raw_token))

    assert response.status_code == 200
    assert response.json() == {"status": "logged_out"}
    assert client.get("/api/v1/auth/me", headers=bearer(raw_token)).status_code == 401
    db_session.expire_all()
    assert db_session.scalar(select(AuthTokenSession)).revoked_at is not None


def test_invalid_revoked_and_expired_tokens_return_unified_401(db_session: Session) -> None:
    user = create_user(db_session)
    client = TestClient(create_app())

    invalid = client.get("/api/v1/auth/me", headers=bearer("invalid"))
    assert invalid.status_code == 401
    assert invalid.json()["error"] == {
        "code": "AUTHENTICATION_REQUIRED",
        "message": "Authentication is required.",
        "field_errors": [],
        "conflict": None,
    }

    expired = issue_token(db_session, user, now=datetime.now(UTC) - timedelta(hours=9))
    assert client.get("/api/v1/auth/me", headers=bearer(expired.raw_token)).status_code == 401


def test_auth_me_returns_user_role_and_optional_assignee(db_session: Session) -> None:
    create_user(db_session, role=Role.MANAGER, with_assignee=True)
    client = TestClient(create_app())
    raw_token = login(client).json()["token"]

    response = client.get("/api/v1/auth/me", headers=bearer(raw_token))

    assert response.status_code == 200
    assert response.json()["role"] == "MANAGER"
    assert response.json()["assignee"]["display_name"] == "Demo Assignee"


@pytest.mark.parametrize(
    ("role", "allowed"),
    [(Role.ADMIN, True), (Role.MANAGER, True), (Role.MEMBER, False)],
)
def test_role_dependency_enforces_backend_403(
    db_session: Session, role: Role, allowed: bool
) -> None:
    create_user(db_session, role=role)
    application = create_app()

    @application.get("/api/v1/management-check")
    def management_check(
        _user: Annotated[User, Depends(require_roles(Role.ADMIN, Role.MANAGER))],
    ) -> dict[str, bool]:
        return {"allowed": True}

    client = TestClient(application)
    raw_token = login(client).json()["token"]
    response = client.get("/api/v1/management-check", headers=bearer(raw_token))

    assert response.status_code == (200 if allowed else 403)
    if not allowed:
        assert response.json()["error"]["code"] == "FORBIDDEN"
