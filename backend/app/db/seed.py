import os
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import get_session_factory
from app.models.auth import Assignee, Role, User


@dataclass(frozen=True)
class DemoIdentity:
    email: str
    password: str
    role: Role
    is_active: bool
    assignee_name: str | None = None


def seed_demo_data(session: Session, identities: tuple[DemoIdentity, ...]) -> None:
    for identity in identities:
        user = session.scalar(select(User).where(User.email == identity.email))
        if user is None:
            user = User(
                email=identity.email,
                password_hash=hash_password(identity.password),
                role=identity.role,
                is_active=identity.is_active,
            )
            session.add(user)
            session.flush()
        else:
            user.password_hash = hash_password(identity.password)
            user.role = identity.role
            user.is_active = identity.is_active

        if identity.assignee_name is not None:
            assignee = session.scalar(select(Assignee).where(Assignee.user_id == user.id))
            if assignee is None:
                session.add(
                    Assignee(
                        user_id=user.id,
                        display_name=identity.assignee_name,
                        is_active=identity.is_active,
                    )
                )
            else:
                assignee.display_name = identity.assignee_name
                assignee.is_active = identity.is_active

    session.commit()


def identities_from_environment() -> tuple[DemoIdentity, ...]:
    variable_names = {
        "admin": "DEMO_ADMIN_PASSWORD",
        "manager": "DEMO_MANAGER_PASSWORD",
        "member": "DEMO_MEMBER_PASSWORD",
        "inactive": "DEMO_INACTIVE_PASSWORD",
    }
    missing = [name for name in variable_names.values() if not os.environ.get(name)]
    if missing:
        raise RuntimeError(f"Missing demo seed variables: {', '.join(missing)}")

    return (
        DemoIdentity("admin@example.com", os.environ[variable_names["admin"]], Role.ADMIN, True),
        DemoIdentity(
            "manager@example.com",
            os.environ[variable_names["manager"]],
            Role.MANAGER,
            True,
            "Demo Manager",
        ),
        DemoIdentity(
            "member@example.com",
            os.environ[variable_names["member"]],
            Role.MEMBER,
            True,
            "Demo Member",
        ),
        DemoIdentity(
            "inactive@example.com",
            os.environ[variable_names["inactive"]],
            Role.MEMBER,
            False,
        ),
    )


def main() -> None:
    with get_session_factory()() as session:
        seed_demo_data(session, identities_from_environment())
    print("Demo authentication identities are ready.")


if __name__ == "__main__":
    main()
