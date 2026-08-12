import pytest
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.orm import Session

from alembic import command
from app.core.settings import reset_settings
from app.db.session import reset_database_state
from app.db.test_guard import UnsafeTestDatabaseError, apply_test_database_url


def pytest_sessionstart(session: pytest.Session) -> None:
    del session
    try:
        apply_test_database_url()
    except UnsafeTestDatabaseError as exception:
        raise pytest.UsageError(str(exception)) from None
    reset_settings()
    reset_database_state()
    command.upgrade(Config("alembic.ini"), "head")


@pytest.fixture(autouse=True)
def clean_auth_tables() -> None:
    from app.db.session import get_session_factory

    with get_session_factory()() as session:
        session.execute(
            text(
                "TRUNCATE TABLE audit_logs, project_assignees, projects, properties, customers, "
                "auth_token_sessions, assignees, users RESTART IDENTITY CASCADE"
            )
        )
        session.commit()


@pytest.fixture
def db_session() -> Session:
    from app.db.session import get_session_factory

    with get_session_factory()() as session:
        yield session
