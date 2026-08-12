from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.seed import DemoIdentity, seed_demo_data
from app.models.auth import Assignee, Role, User


def test_demo_seed_is_idempotent_and_covers_required_identities(db_session: Session) -> None:
    identities = (
        DemoIdentity("admin@example.com", "admin-password", Role.ADMIN, True),
        DemoIdentity("manager@example.com", "manager-password", Role.MANAGER, True, "Manager"),
        DemoIdentity("member@example.com", "member-password", Role.MEMBER, True, "Member"),
        DemoIdentity("inactive@example.com", "inactive-password", Role.MEMBER, False),
    )

    seed_demo_data(db_session, identities)
    seed_demo_data(db_session, identities)

    assert db_session.scalar(select(func.count()).select_from(User)) == 4
    assert db_session.scalar(select(func.count()).select_from(Assignee)) == 2
    inactive = db_session.scalar(select(User).where(User.email == "inactive@example.com"))
    assert inactive is not None
    assert inactive.is_active is False
