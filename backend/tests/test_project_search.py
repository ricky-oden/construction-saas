from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.main import create_app
from app.models.auth import Role, User
from app.models.business import Project, ProjectStatus

PASSWORD = "Phase5Password123!"


def authenticated_client(db_session: Session, role: Role = Role.ADMIN) -> TestClient:
    email = f"{role.value.lower()}@phase5.example.com"
    db_session.add(
        User(email=email, password_hash=hash_password(PASSWORD), role=role, is_active=True)
    )
    db_session.commit()
    client = TestClient(create_app())
    login = client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    client.headers["Authorization"] = f"Bearer {login.json()['token']}"
    return client


def create_customer(client: TestClient, code: str, name: str) -> dict[str, object]:
    response = client.post("/api/v1/customers", json={"code": code, "name": name})
    assert response.status_code == 201
    return response.json()


def create_property(client: TestClient, customer_id: int, name: str) -> dict[str, object]:
    response = client.post(
        "/api/v1/properties",
        json={
            "customer_id": customer_id,
            "name": name,
            "prefecture": "Tokyo",
            "city": "Chiyoda",
            "address_line": "1-1",
        },
    )
    assert response.status_code == 201
    return response.json()


def create_project(
    client: TestClient,
    customer_id: int,
    property_id: int,
    code: str,
    name: str,
    start_date: str,
    end_date: str,
) -> dict[str, object]:
    response = client.post(
        "/api/v1/projects",
        json={
            "code": code,
            "name": name,
            "customer_id": customer_id,
            "property_id": property_id,
            "start_date": start_date,
            "end_date": end_date,
        },
    )
    assert response.status_code == 201
    return response.json()


def search_fixture(db_session: Session) -> tuple[TestClient, list[dict[str, object]]]:
    client = authenticated_client(db_session)
    customer_a = create_customer(client, "CUS-A", "Alpha Customer")
    customer_b = create_customer(client, "CUS-B", "Beta Customer")
    property_a = create_property(client, int(customer_a["id"]), "Alpha Site")
    property_b = create_property(client, int(customer_b["id"]), "Beta Site")
    definitions = [
        ("PRJ-A", "Central Renovation", customer_a, property_a, "2026-01-01", "2026-01-10"),
        ("PRJ-B", "central Extension", customer_a, property_a, "2026-01-10", "2026-01-20"),
        ("PRJ-C", "North Build", customer_b, property_b, "2026-02-01", "2026-02-28"),
        ("PRJ-D", "South Build", customer_b, property_b, "2026-03-01", "2026-03-31"),
        ("PRJ-E", "East Check", customer_a, property_a, "2026-04-01", "2026-04-30"),
        ("PRJ-F", "West Check", customer_a, property_a, "2026-05-01", "2026-05-31"),
    ]
    projects = [
        create_project(
            client,
            int(customer["id"]),
            int(property_record["id"]),
            code,
            name,
            start,
            end,
        )
        for code, name, customer, property_record, start, end in definitions
    ]
    base_time = datetime(2026, 1, 1, tzinfo=UTC)
    for index, item in enumerate(projects):
        project = db_session.get(Project, int(item["id"]))
        assert project is not None
        project.status = ProjectStatus.IN_PROGRESS if index in {0, 1} else ProjectStatus.DRAFT
        project.created_at = base_time + timedelta(days=index)
        project.updated_at = base_time + timedelta(days=index // 2)
    db_session.commit()
    return client, projects


def codes(response: dict[str, object]) -> list[str]:
    return [str(item["code"]) for item in response["items"]]  # type: ignore[index]


def test_project_filters_are_case_insensitive_and_composable(db_session: Session) -> None:
    client, projects = search_fixture(db_session)
    response = client.get(
        "/api/v1/projects",
        params={
            "name": "CENTRAL",
            "status": "IN_PROGRESS",
            "customer_id": projects[0]["customer_id"],
            "property_id": projects[0]["property_id"],
            "period_from": "2026-01-10",
            "period_to": "2026-01-10",
            "sort": "code",
            "order": "asc",
        },
    )

    assert response.status_code == 200
    assert codes(response.json()) == ["PRJ-A", "PRJ-B"]


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"name": "CENTRAL"}, ["PRJ-A", "PRJ-B"]),
        ({"status": "IN_PROGRESS"}, ["PRJ-A", "PRJ-B"]),
        ({"customer_id": "1"}, ["PRJ-A", "PRJ-B", "PRJ-E", "PRJ-F"]),
        ({"property_id": "1"}, ["PRJ-A", "PRJ-B", "PRJ-E", "PRJ-F"]),
    ],
)
def test_each_project_filter_individually(
    db_session: Session, params: dict[str, str], expected: list[str]
) -> None:
    client, _ = search_fixture(db_session)
    response = client.get("/api/v1/projects", params={**params, "sort": "code", "order": "asc"})
    assert response.status_code == 200
    assert codes(response.json()) == expected


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"period_from": "2026-01-05", "period_to": "2026-01-06"}, ["PRJ-A"]),
        ({"period_from": "2025-12-01", "period_to": "2026-01-31"}, ["PRJ-A", "PRJ-B"]),
        ({"period_from": "2026-01-10", "period_to": "2026-01-10"}, ["PRJ-A", "PRJ-B"]),
        ({"period_from": "2026-01-21", "period_to": "2026-01-31"}, []),
        ({"period_from": "2026-05-15"}, ["PRJ-F"]),
        ({"period_to": "2026-01-01"}, ["PRJ-A"]),
    ],
)
def test_project_period_overlap(
    db_session: Session, params: dict[str, str], expected: list[str]
) -> None:
    client, _ = search_fixture(db_session)
    response = client.get("/api/v1/projects", params={**params, "sort": "code", "order": "asc"})
    assert response.status_code == 200
    assert codes(response.json()) == expected


def test_project_period_rejects_reversed_range(db_session: Session) -> None:
    client, _ = search_fixture(db_session)
    response = client.get(
        "/api/v1/projects",
        params={"period_from": "2026-02-01", "period_to": "2026-01-01"},
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.parametrize("order", ["asc", "desc"])
@pytest.mark.parametrize(
    "sort", ["code", "name", "start_date", "end_date", "created_at", "updated_at"]
)
def test_all_allowed_project_sorts_are_stable(db_session: Session, sort: str, order: str) -> None:
    client, _ = search_fixture(db_session)
    first = client.get(
        "/api/v1/projects", params={"sort": sort, "order": order, "page_size": 100}
    ).json()["items"]
    second = client.get(
        "/api/v1/projects", params={"sort": sort, "order": order, "page_size": 100}
    ).json()["items"]
    assert [item["id"] for item in first] == [item["id"] for item in second]
    values = [item[sort] for item in first]
    assert values == sorted(values, reverse=order == "desc")
    for left, right in zip(first, first[1:], strict=False):
        if left[sort] == right[sort]:
            assert (left["id"] < right["id"]) is (order == "asc")


@pytest.mark.parametrize("params", [{"sort": "description"}, {"order": "sideways"}])
def test_project_rejects_unknown_sort_and_order(
    db_session: Session, params: dict[str, str]
) -> None:
    client, _ = search_fixture(db_session)
    response = client.get("/api/v1/projects", params=params)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_common_pagination_metadata_and_multiple_pages(db_session: Session) -> None:
    client, _ = search_fixture(db_session)
    first = client.get(
        "/api/v1/projects",
        params={"sort": "code", "order": "asc", "page": 1, "page_size": 2},
    ).json()
    second = client.get(
        "/api/v1/projects",
        params={"sort": "code", "order": "asc", "page": 2, "page_size": 2},
    ).json()
    assert codes(first) == ["PRJ-A", "PRJ-B"]
    assert codes(second) == ["PRJ-C", "PRJ-D"]
    assert {key: first[key] for key in ("page", "page_size", "total", "total_pages")} == {
        "page": 1,
        "page_size": 2,
        "total": 6,
        "total_pages": 3,
    }
    assert client.get("/api/v1/customers?page_size=1").json()["total_pages"] == 2
    assert client.get("/api/v1/properties?page_size=1").json()["total_pages"] == 2


def test_pagination_limits_and_default_order(db_session: Session) -> None:
    client, _ = search_fixture(db_session)
    default_response = client.get("/api/v1/projects").json()
    assert default_response["page"] == 1
    assert default_response["page_size"] == 20
    assert codes(default_response)[:2] == ["PRJ-F", "PRJ-E"]
    assert client.get("/api/v1/projects?page=0").status_code == 422
    assert client.get("/api/v1/projects?page_size=101").status_code == 422
    assert client.get("/api/v1/projects?assignee_id=1").status_code == 200


def test_search_keeps_phase_4_authorization_boundary(db_session: Session) -> None:
    assert TestClient(create_app()).get("/api/v1/projects?name=Central").status_code == 401
    member = authenticated_client(db_session, Role.MEMBER)
    response = member.get("/api/v1/projects?name=Central")
    assert response.status_code == 200
    assert response.json()["items"] == []
