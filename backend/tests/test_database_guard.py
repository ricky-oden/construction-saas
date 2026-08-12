import os
from collections.abc import Generator
from typing import Annotated

import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.core.settings import get_settings, reset_settings
from app.db.session import get_db, get_engine, reset_database_state
from app.db.test_guard import UnsafeTestDatabaseError, validate_test_database_url
from app.main import create_app


@pytest.fixture
def restore_database_environment() -> Generator[None, None, None]:
    original_database_url = os.environ.get("DATABASE_URL")
    original_test_database_url = os.environ.get("TEST_DATABASE_URL")
    yield
    if original_database_url is None:
        os.environ.pop("DATABASE_URL", None)
    else:
        os.environ["DATABASE_URL"] = original_database_url
    if original_test_database_url is None:
        os.environ.pop("TEST_DATABASE_URL", None)
    else:
        os.environ["TEST_DATABASE_URL"] = original_test_database_url
    reset_settings()
    reset_database_state()


def test_valid_test_database_url_is_accepted() -> None:
    url = validate_test_database_url(
        "postgresql+psycopg://construction_test:demo@test-db:5432/construction_saas_test"
    )

    assert url.host == "test-db"
    assert url.port == 5432
    assert url.database == "construction_saas_test"


@pytest.mark.parametrize(
    ("raw_url", "message"),
    [
        (None, "is required"),
        ("://", "must be a valid database URL"),
        ("sqlite:///construction_saas_test", "must use PostgreSQL"),
        (
            "postgresql+psycopg://construction_test:demo@test-db:5432/construction_saas",
            "must end with '_test'",
        ),
    ],
)
def test_unsafe_test_database_url_is_rejected(raw_url: str | None, message: str) -> None:
    with pytest.raises(UnsafeTestDatabaseError, match=message):
        validate_test_database_url(raw_url)


def test_depends_get_db_uses_real_test_database() -> None:
    application = create_app()

    @application.get("/api/v1/test-db-identity")
    def database_identity(
        session: Annotated[Session, Depends(get_db)],
    ) -> dict[str, str | int | None]:
        row = session.execute(
            text(
                "SELECT current_database() AS database_name, "
                "inet_server_addr()::text AS server_address, "
                "inet_server_port() AS server_port"
            )
        ).one()
        configured_url = get_engine().url
        return {
            "configured_host": configured_url.host,
            "configured_port": configured_url.port,
            "database_name": row.database_name,
            "server_address": row.server_address,
            "server_port": row.server_port,
        }

    response = TestClient(application).get("/api/v1/test-db-identity")

    assert response.status_code == 200
    payload = response.json()
    assert payload["configured_host"] == "test-db"
    assert payload["configured_port"] == 5432
    assert payload["database_name"] == "construction_saas_test"
    assert payload["server_address"]
    assert payload["server_port"] == 5432


def test_unavailable_test_database_never_falls_back_to_development_database(
    restore_database_environment: None,
) -> None:
    development_url = "postgresql+psycopg://construction_app:development@db:5432/construction_saas"
    unavailable_test_url = (
        "postgresql+psycopg://construction_test:test@127.0.0.1:1/construction_saas_test"
    )
    os.environ["DATABASE_URL"] = development_url
    os.environ["TEST_DATABASE_URL"] = unavailable_test_url
    os.environ["DATABASE_URL"] = validate_test_database_url(
        os.environ["TEST_DATABASE_URL"]
    ).render_as_string(hide_password=False)
    reset_settings()
    reset_database_state()

    response = TestClient(create_app(), raise_server_exceptions=False).get("/api/v1/health")

    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "DATABASE_UNAVAILABLE",
            "message": "Database is unavailable.",
            "field_errors": [],
            "conflict": None,
        }
    }
    configured_url = make_url(get_settings().database_url)
    assert configured_url.database == "construction_saas_test"
    assert configured_url.host == "127.0.0.1"
    assert "construction_saas" not in response.text
    assert "construction_app" not in response.text
