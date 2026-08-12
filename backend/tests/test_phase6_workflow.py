from concurrent.futures import ThreadPoolExecutor
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.main import create_app
from app.models.auth import Assignee, Role, User
from app.models.business import AuditLog, Project, ProjectStatus

PASSWORD = "Phase6Password123!"


def create_identity(
    db_session: Session, email: str, role: Role, assignee_name: str | None = None
) -> tuple[User, Assignee | None]:
    user = User(email=email, password_hash=hash_password(PASSWORD), role=role, is_active=True)
    db_session.add(user)
    db_session.flush()
    assignee = None
    if assignee_name:
        assignee = Assignee(user_id=user.id, display_name=assignee_name, is_active=True)
        db_session.add(assignee)
    db_session.commit()
    return user, assignee


def login(email: str) -> TestClient:
    client = TestClient(create_app())
    response = client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    client.headers["Authorization"] = f"Bearer {response.json()['token']}"
    return client


def create_project(client: TestClient, suffix: str = "1") -> dict[str, object]:
    customer = client.post(
        "/api/v1/customers", json={"code": f"CUS-{suffix}", "name": "Customer"}
    ).json()
    property_record = client.post(
        "/api/v1/properties",
        json={
            "customer_id": customer["id"],
            "name": "Site",
            "prefecture": "Tokyo",
            "city": "Chiyoda",
            "address_line": "1-1",
        },
    ).json()
    response = client.post(
        "/api/v1/projects",
        json={
            "code": f"PRJ-{suffix}",
            "name": "Workflow Project",
            "customer_id": customer["id"],
            "property_id": property_record["id"],
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        },
    )
    assert response.status_code == 201
    return response.json()


def setup_project(db_session: Session) -> tuple[TestClient, dict[str, object], Assignee, Assignee]:
    create_identity(db_session, "admin@phase6.example.com", Role.ADMIN)
    _, first = create_identity(db_session, "first@phase6.example.com", Role.MEMBER, "First")
    _, second = create_identity(db_session, "second@phase6.example.com", Role.MEMBER, "Second")
    assert first and second
    client = login("admin@phase6.example.com")
    return client, create_project(client), first, second


def assign(
    client: TestClient, project_id: int, expected_version: int, ids: list[int]
) -> dict[str, object]:
    response = client.put(
        f"/api/v1/projects/{project_id}/assignees",
        json={"expected_version": expected_version, "assignee_ids": ids},
    )
    assert response.status_code == 200
    return response.json()


def set_status(db_session: Session, project_id: int, status: ProjectStatus) -> None:
    project = db_session.get(Project, project_id)
    assert project
    project.status = status
    project.version = 1
    db_session.query(AuditLog).delete()
    db_session.commit()


def test_multiple_assignees_duplicate_and_inactive_rules(db_session: Session) -> None:
    client, project, first, second = setup_project(db_session)
    updated = assign(client, int(project["id"]), 1, [first.id, second.id])
    assert updated["version"] == 2
    assert {item["id"] for item in updated["assignees"]} == {first.id, second.id}

    duplicate = client.put(
        f"/api/v1/projects/{project['id']}/assignees",
        json={"expected_version": 2, "assignee_ids": [first.id, first.id]},
    )
    assert duplicate.status_code == 422
    assert duplicate.json()["error"]["code"] == "DUPLICATE_ASSIGNEE"

    second.is_active = False
    db_session.commit()
    inactive = client.put(
        f"/api/v1/projects/{project['id']}/assignees",
        json={"expected_version": 2, "assignee_ids": [second.id]},
    )
    assert inactive.status_code == 422
    assert inactive.json()["error"]["code"] == "INVALID_REFERENCE"
    detail = client.get(f"/api/v1/projects/{project['id']}").json()
    assert {item["id"] for item in detail["assignees"]} == {first.id, second.id}


def test_member_sees_only_assigned_projects_and_history(db_session: Session) -> None:
    admin, first_project, first, _ = setup_project(db_session)
    second_project = create_project(admin, "2")
    assign(admin, int(first_project["id"]), 1, [first.id])
    member = login("first@phase6.example.com")

    listing = member.get("/api/v1/projects").json()
    assert [item["id"] for item in listing["items"]] == [first_project["id"]]
    assert member.get(f"/api/v1/projects/{first_project['id']}").status_code == 200
    assert member.get(f"/api/v1/projects/{second_project['id']}").status_code == 403
    assert member.get(f"/api/v1/projects/{first_project['id']}/history").status_code == 200
    assert member.get(f"/api/v1/projects/{second_project['id']}/history").status_code == 403
    assert member.get("/api/v1/customers").status_code == 403
    assert member.get("/api/v1/assignees").status_code == 403
    assert (
        member.post(
            f"/api/v1/projects/{second_project['id']}/status-transitions",
            json={"expected_version": 1, "status": "PLANNED"},
        ).status_code
        == 403
    )


def test_gantt_period_keeps_member_assignment_scope(db_session: Session) -> None:
    admin, assigned_project, first, _ = setup_project(db_session)
    outside_project = create_project(admin, "2")
    unassigned_overlap = create_project(admin, "3")
    assign(admin, int(assigned_project["id"]), 1, [first.id])
    assign(admin, int(outside_project["id"]), 1, [first.id])
    outside = db_session.get(Project, int(outside_project["id"]))
    assert outside
    outside.start_date = date(2026, 2, 1)
    outside.end_date = date(2026, 2, 28)
    db_session.commit()

    member = login("first@phase6.example.com")
    response = member.get(
        "/api/v1/projects",
        params={
            "period_from": "2026-01-01",
            "period_to": "2026-01-31",
            "sort": "start_date",
            "order": "asc",
            "page_size": 100,
        },
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [assigned_project["id"]]
    assert unassigned_overlap["id"] not in [item["id"] for item in response.json()["items"]]


@pytest.mark.parametrize("role", [Role.ADMIN, Role.MANAGER])
def test_gantt_period_allows_management_roles_with_stable_order(
    db_session: Session, role: Role
) -> None:
    create_identity(db_session, f"{role.value.lower()}@gantt.example.com", role)
    client = login(f"{role.value.lower()}@gantt.example.com")
    first = create_project(client, "G1")
    second = create_project(client, "G2")

    response = client.get(
        "/api/v1/projects",
        params={
            "period_from": "2026-01-01",
            "period_to": "2026-01-31",
            "sort": "start_date",
            "order": "asc",
        },
    )
    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [first["id"], second["id"]]


def test_management_can_manage_assignee_identity(db_session: Session) -> None:
    create_identity(db_session, "admin@phase6.example.com", Role.ADMIN)
    user, _ = create_identity(db_session, "identity@phase6.example.com", Role.MEMBER)
    client = login("admin@phase6.example.com")
    created = client.post(
        "/api/v1/assignees", json={"user_id": user.id, "display_name": "Identity"}
    )
    assert created.status_code == 201
    assignee_id = created.json()["id"]
    assert client.get(f"/api/v1/assignees/{assignee_id}").status_code == 200
    updated = client.patch(
        f"/api/v1/assignees/{assignee_id}",
        json={"display_name": "Updated", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["display_name"] == "Updated"
    assert updated.json()["is_active"] is False


ALLOWED = [
    (ProjectStatus.DRAFT, ProjectStatus.PLANNED),
    (ProjectStatus.DRAFT, ProjectStatus.CANCELLED),
    (ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS),
    (ProjectStatus.PLANNED, ProjectStatus.ON_HOLD),
    (ProjectStatus.PLANNED, ProjectStatus.CANCELLED),
    (ProjectStatus.IN_PROGRESS, ProjectStatus.ON_HOLD),
    (ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED),
    (ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED),
    (ProjectStatus.ON_HOLD, ProjectStatus.IN_PROGRESS),
    (ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED),
]


@pytest.mark.parametrize(("source", "target"), ALLOWED)
@pytest.mark.parametrize("role", [Role.ADMIN, Role.MANAGER])
def test_management_roles_can_use_every_allowed_transition(
    db_session: Session, source: ProjectStatus, target: ProjectStatus, role: Role
) -> None:
    email = f"{role.value.lower()}-{source.value.lower()}-{target.value.lower()}@phase6.example.com"
    create_identity(db_session, email, role)
    client = login(email)
    project = create_project(client)
    set_status(db_session, int(project["id"]), source)
    response = client.post(
        f"/api/v1/projects/{project['id']}/status-transitions",
        json={"expected_version": 1, "status": target.value},
    )
    assert response.status_code == 200
    assert response.json()["status"] == target.value
    assert response.json()["version"] == 2


@pytest.mark.parametrize(
    ("source", "target", "expected"),
    [
        (ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS, 200),
        (ProjectStatus.IN_PROGRESS, ProjectStatus.ON_HOLD, 200),
        (ProjectStatus.ON_HOLD, ProjectStatus.IN_PROGRESS, 200),
        (ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED, 200),
        (ProjectStatus.DRAFT, ProjectStatus.PLANNED, 403),
        (ProjectStatus.PLANNED, ProjectStatus.CANCELLED, 403),
    ],
)
def test_member_transition_matrix(
    db_session: Session, source: ProjectStatus, target: ProjectStatus, expected: int
) -> None:
    admin, project, first, _ = setup_project(db_session)
    assign(admin, int(project["id"]), 1, [first.id])
    set_status(db_session, int(project["id"]), source)
    member = login("first@phase6.example.com")
    response = member.post(
        f"/api/v1/projects/{project['id']}/status-transitions",
        json={"expected_version": 1, "status": target.value},
    )
    assert response.status_code == expected


@pytest.mark.parametrize(
    ("source", "target"),
    [
        (ProjectStatus.DRAFT, ProjectStatus.COMPLETED),
        (ProjectStatus.COMPLETED, ProjectStatus.IN_PROGRESS),
        (ProjectStatus.CANCELLED, ProjectStatus.DRAFT),
    ],
)
def test_invalid_transitions_are_rejected(
    db_session: Session, source: ProjectStatus, target: ProjectStatus
) -> None:
    client, project, _, _ = setup_project(db_session)
    set_status(db_session, int(project["id"]), source)
    response = client.post(
        f"/api/v1/projects/{project['id']}/status-transitions",
        json={"expected_version": 1, "status": target.value},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"


def test_stale_version_returns_conflict_without_data_or_audit_change(db_session: Session) -> None:
    client, project, _, _ = setup_project(db_session)
    first = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"expected_version": 1, "name": "Winner"},
    )
    assert first.status_code == 200
    stale = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"expected_version": 1, "name": "Loser"},
    )
    assert stale.status_code == 409
    assert stale.json()["error"]["conflict"] == {
        "resource_type": "Project",
        "resource_id": project["id"],
        "expected_version": 1,
        "current_version": 2,
    }
    detail = client.get(f"/api/v1/projects/{project['id']}").json()
    assert detail["name"] == "Winner"
    assert detail["version"] == 2
    assert db_session.scalar(select(func.count()).select_from(AuditLog)) == 1


def test_expected_version_is_required_for_all_protected_writes(db_session: Session) -> None:
    client, project, first, _ = setup_project(db_session)
    project_id = project["id"]
    missing_update = client.patch(f"/api/v1/projects/{project_id}", json={"name": "Missing"})
    assert missing_update.status_code == 422
    assert (
        client.put(
            f"/api/v1/projects/{project_id}/assignees", json={"assignee_ids": [first.id]}
        ).status_code
        == 422
    )
    assert (
        client.post(
            f"/api/v1/projects/{project_id}/status-transitions", json={"status": "PLANNED"}
        ).status_code
        == 422
    )
    assert client.post(f"/api/v1/projects/{project_id}/archive", json={}).status_code == 422


def test_concurrent_updates_allow_only_one_expected_version(db_session: Session) -> None:
    client, project, _, _ = setup_project(db_session)
    token = client.headers["Authorization"]

    def update(name: str) -> int:
        with TestClient(create_app(), headers={"Authorization": token}) as concurrent_client:
            return concurrent_client.patch(
                f"/api/v1/projects/{project['id']}",
                json={"expected_version": 1, "name": name},
            ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(executor.map(update, ["First", "Second"]))
    assert sorted(statuses) == [200, 409]


def test_concurrent_status_transitions_keep_only_the_server_winner(
    db_session: Session,
) -> None:
    client, project, _, _ = setup_project(db_session)
    token = client.headers["Authorization"]

    def transition(target: str) -> tuple[int, dict[str, object]]:
        with TestClient(create_app(), headers={"Authorization": token}) as concurrent_client:
            response = concurrent_client.post(
                f"/api/v1/projects/{project['id']}/status-transitions",
                json={"expected_version": 1, "status": target},
            )
            return response.status_code, response.json()

    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(transition, ["PLANNED", "CANCELLED"]))

    assert sorted(status for status, _body in responses) == [200, 409]
    winner = next(body for status, body in responses if status == 200)
    conflict = next(body for status, body in responses if status == 409)
    detail = client.get(f"/api/v1/projects/{project['id']}").json()
    assert detail["status"] == winner["status"]
    assert detail["version"] == 2
    assert conflict["error"]["conflict"]["current_version"] == 2
    assert db_session.scalar(select(func.count()).select_from(AuditLog)) == 1


def test_audit_contents_and_archive_version_increment(db_session: Session) -> None:
    client, project, first, second = setup_project(db_session)
    assigned = assign(client, int(project["id"]), 1, [first.id, second.id])
    archived = client.post(
        f"/api/v1/projects/{project['id']}/archive",
        json={"expected_version": assigned["version"]},
    )
    assert archived.status_code == 200
    assert archived.json()["version"] == 3
    history = client.get(f"/api/v1/projects/{project['id']}/history").json()["items"]
    assert [item["action"] for item in history] == ["ASSIGNEES_CHANGED", "PROJECT_ARCHIVED"]
    assert history[0]["before_values"] == {"assignee_ids": []}
    assert history[0]["after_values"] == {"assignee_ids": sorted([first.id, second.id])}
    assert history[1]["project_version"] == 3


def test_assignee_search(db_session: Session) -> None:
    client, project, first, second = setup_project(db_session)
    other = create_project(client, "2")
    assign(client, int(project["id"]), 1, [first.id])
    assign(client, int(other["id"]), 1, [second.id])
    response = client.get(f"/api/v1/projects?assignee_id={first.id}").json()
    assert [item["id"] for item in response["items"]] == [project["id"]]


def test_forced_audit_exception_rolls_back_business_update(
    db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    client, project, _, _ = setup_project(db_session)

    def fail_audit(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("forced audit failure")

    monkeypatch.setattr("app.services.business._audit", fail_audit)
    with TestClient(create_app(), raise_server_exceptions=False) as failure_client:
        failure_client.headers.update(client.headers)
        response = failure_client.patch(
            f"/api/v1/projects/{project['id']}",
            json={"expected_version": 1, "name": "Must Roll Back"},
        )
    assert response.status_code == 500
    db_session.expire_all()
    persisted = db_session.get(Project, int(project["id"]))
    assert persisted and persisted.name == "Workflow Project" and persisted.version == 1
    assert db_session.scalar(select(func.count()).select_from(AuditLog)) == 0


def test_forced_audit_exception_rolls_back_status_version_and_history(
    db_session: Session, monkeypatch: pytest.MonkeyPatch
) -> None:
    client, project, _, _ = setup_project(db_session)

    def fail_audit(*_args: object, **_kwargs: object) -> None:
        raise RuntimeError("forced status audit failure")

    monkeypatch.setattr("app.services.business._audit", fail_audit)
    with TestClient(create_app(), raise_server_exceptions=False) as failure_client:
        failure_client.headers.update(client.headers)
        response = failure_client.post(
            f"/api/v1/projects/{project['id']}/status-transitions",
            json={"expected_version": 1, "status": "PLANNED"},
        )
    assert response.status_code == 500
    db_session.expire_all()
    persisted = db_session.get(Project, int(project["id"]))
    assert persisted and persisted.status == ProjectStatus.DRAFT
    assert persisted.version == 1
    assert db_session.scalar(select(func.count()).select_from(AuditLog)) == 0


def test_member_cannot_manage_project_fields_assignees_or_archive(db_session: Session) -> None:
    admin, project, first, _ = setup_project(db_session)
    assigned = assign(admin, int(project["id"]), 1, [first.id])
    member = login("first@phase6.example.com")
    project_id = project["id"]
    assert (
        member.patch(
            f"/api/v1/projects/{project_id}",
            json={"expected_version": assigned["version"], "name": "Denied"},
        ).status_code
        == 403
    )
    assert (
        member.put(
            f"/api/v1/projects/{project_id}/assignees",
            json={"expected_version": assigned["version"], "assignee_ids": []},
        ).status_code
        == 403
    )
    assert (
        member.post(
            f"/api/v1/projects/{project_id}/archive",
            json={"expected_version": assigned["version"]},
        ).status_code
        == 403
    )
