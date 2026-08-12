from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.main import create_app
from app.models.auth import Role, User
from app.models.business import Customer, Project, Property

PASSWORD = "Phase4Password123!"


def authenticated_client(db_session: Session, role: Role = Role.ADMIN) -> TestClient:
    email = f"{role.value.lower()}@phase4.example.com"
    db_session.add(
        User(email=email, password_hash=hash_password(PASSWORD), role=role, is_active=True)
    )
    db_session.commit()
    client = TestClient(create_app())
    response = client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200
    client.headers["Authorization"] = f"Bearer {response.json()['token']}"
    return client


def customer_payload(code: str = "CUS-001") -> dict[str, object]:
    return {
        "code": code,
        "name": "Example Construction",
        "contact_name": "Contact Person",
        "phone": "03-0000-0000",
        "email": "contact@example.com",
    }


def property_payload(customer_id: int) -> dict[str, object]:
    return {
        "customer_id": customer_id,
        "name": "Central Building",
        "postal_code": "100-0001",
        "prefecture": "Tokyo",
        "city": "Chiyoda",
        "address_line": "1-1",
    }


def project_payload(customer_id: int, property_id: int, code: str = "PRJ-001") -> dict[str, object]:
    return {
        "code": code,
        "name": "Renovation Project",
        "description": "Phase 4 project",
        "customer_id": customer_id,
        "property_id": property_id,
        "start_date": "2026-08-01",
        "end_date": "2026-08-31",
    }


def create_customer(client: TestClient, code: str = "CUS-001") -> dict[str, object]:
    response = client.post("/api/v1/customers", json=customer_payload(code))
    assert response.status_code == 201
    return response.json()


def create_property(client: TestClient, customer_id: int) -> dict[str, object]:
    response = client.post("/api/v1/properties", json=property_payload(customer_id))
    assert response.status_code == 201
    return response.json()


def test_customer_crud_and_duplicate_code(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)

    assert client.get("/api/v1/customers").json()["items"][0]["code"] == "CUS-001"
    assert client.get(f"/api/v1/customers/{customer['id']}").status_code == 200
    updated = client.patch(f"/api/v1/customers/{customer['id']}", json={"name": "Updated Customer"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Customer"

    duplicate = client.post("/api/v1/customers", json=customer_payload())
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "DUPLICATE_CODE"


def test_property_crud_requires_active_customer(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    property_record = create_property(client, int(customer["id"]))

    assert client.get("/api/v1/properties").json()["items"][0]["name"] == "Central Building"
    updated = client.patch(f"/api/v1/properties/{property_record['id']}", json={"city": "Shinjuku"})
    assert updated.status_code == 200
    assert updated.json()["city"] == "Shinjuku"

    client.patch(f"/api/v1/customers/{customer['id']}", json={"is_active": False})
    rejected = client.post("/api/v1/properties", json=property_payload(int(customer["id"])))
    assert rejected.status_code == 422
    assert rejected.json()["error"]["code"] == "INVALID_REFERENCE"


def test_project_crud_defaults_and_keeps_version_for_phase_6(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    property_record = create_property(client, int(customer["id"]))

    created = client.post(
        "/api/v1/projects",
        json=project_payload(int(customer["id"]), int(property_record["id"])),
    )
    assert created.status_code == 201
    project = created.json()
    assert project["status"] == "DRAFT"
    assert project["version"] == 1
    assert project["is_archived"] is False
    assert client.get("/api/v1/projects").json()["items"][0]["code"] == "PRJ-001"
    assert client.get(f"/api/v1/projects/{project['id']}").status_code == 200

    updated = client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"name": "Updated Project", "expected_version": 1},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Project"
    assert updated.json()["version"] == 2


def test_project_rejects_mismatched_customer_property(db_session: Session) -> None:
    client = authenticated_client(db_session)
    first = create_customer(client, "CUS-001")
    second = create_customer(client, "CUS-002")
    property_record = create_property(client, int(first["id"]))

    response = client.post(
        "/api/v1/projects",
        json=project_payload(int(second["id"]), int(property_record["id"])),
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REFERENCE"


@pytest.mark.parametrize("inactive_resource", ["customer", "property"])
def test_project_rejects_inactive_references(db_session: Session, inactive_resource: str) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    property_record = create_property(client, int(customer["id"]))
    if inactive_resource == "customer":
        client.patch(f"/api/v1/customers/{customer['id']}", json={"is_active": False})
    else:
        client.patch(f"/api/v1/properties/{property_record['id']}", json={"is_active": False})

    response = client.post(
        "/api/v1/projects",
        json=project_payload(int(customer["id"]), int(property_record["id"])),
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "INVALID_REFERENCE"


def test_project_rejects_duplicate_code_and_reversed_dates(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    property_record = create_property(client, int(customer["id"]))
    payload = project_payload(int(customer["id"]), int(property_record["id"]))
    assert client.post("/api/v1/projects", json=payload).status_code == 201

    duplicate = client.post("/api/v1/projects", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "DUPLICATE_CODE"

    reversed_payload = project_payload(int(customer["id"]), int(property_record["id"]), "PRJ-002")
    reversed_payload["start_date"] = "2026-09-01"
    reversed_payload["end_date"] = "2026-08-01"
    reversed_response = client.post("/api/v1/projects", json=reversed_payload)
    assert reversed_response.status_code == 422
    assert reversed_response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_inactive_references_remain_available_to_existing_project(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    property_record = create_property(client, int(customer["id"]))
    project = client.post(
        "/api/v1/projects",
        json=project_payload(int(customer["id"]), int(property_record["id"])),
    ).json()

    client.patch(f"/api/v1/customers/{customer['id']}", json={"is_active": False})
    client.patch(f"/api/v1/properties/{property_record['id']}", json={"is_active": False})

    assert client.get(f"/api/v1/customers/{customer['id']}").status_code == 200
    assert client.get(f"/api/v1/properties/{property_record['id']}").status_code == 200
    detail = client.get(f"/api/v1/projects/{project['id']}")
    assert detail.status_code == 200
    assert detail.json()["customer_id"] == customer["id"]
    assert detail.json()["property_id"] == property_record["id"]
    update = project_payload(int(customer["id"]), int(property_record["id"]))
    update["description"] = "Historical reference"
    update["expected_version"] = 1
    assert client.patch(f"/api/v1/projects/{project['id']}", json=update).status_code == 200


@pytest.mark.parametrize("role", [Role.ADMIN, Role.MANAGER])
def test_admin_and_manager_can_use_management_api(db_session: Session, role: Role) -> None:
    client = authenticated_client(db_session, role)
    assert client.post("/api/v1/customers", json=customer_payload()).status_code == 201


def test_member_and_unauthenticated_requests_are_rejected(db_session: Session) -> None:
    unauthenticated = TestClient(create_app())
    assert unauthenticated.get("/api/v1/projects").status_code == 401

    member = authenticated_client(db_session, Role.MEMBER)
    response = member.get("/api/v1/projects")
    assert response.status_code == 200
    assert response.json()["items"] == []


def test_no_physical_delete_or_phase_6_status_api_exists(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    assert client.delete(f"/api/v1/customers/{customer['id']}").status_code == 405

    property_record = create_property(client, int(customer["id"]))
    project = client.post(
        "/api/v1/projects",
        json=project_payload(int(customer["id"]), int(property_record["id"])),
    ).json()
    response = client.patch(f"/api/v1/projects/{project['id']}", json={"status": "COMPLETED"})
    assert response.status_code == 422


def test_postgresql_enforces_customer_code_uniqueness(db_session: Session) -> None:
    db_session.add_all(
        [
            Customer(code="DB-CUS", name="One"),
            Customer(code="DB-CUS", name="Two"),
        ]
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_postgresql_enforces_property_customer_pair(db_session: Session) -> None:
    first = Customer(code="DB-CUS-1", name="One")
    second = Customer(code="DB-CUS-2", name="Two")
    db_session.add_all([first, second])
    db_session.flush()
    property_record = Property(
        customer_id=first.id,
        name="Building",
        prefecture="Tokyo",
        city="Chiyoda",
        address_line="1-1",
    )
    db_session.add(property_record)
    db_session.flush()
    db_session.add(
        Project(
            code="DB-PRJ",
            name="Mismatch",
            customer_id=second.id,
            property_id=property_record.id,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 2),
        )
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_postgresql_enforces_project_date_order(db_session: Session) -> None:
    customer = Customer(code="DB-CUS", name="Customer")
    db_session.add(customer)
    db_session.flush()
    property_record = Property(
        customer_id=customer.id,
        name="Building",
        prefecture="Tokyo",
        city="Chiyoda",
        address_line="1-1",
    )
    db_session.add(property_record)
    db_session.flush()
    db_session.add(
        Project(
            code="DB-PRJ",
            name="Reverse",
            customer_id=customer.id,
            property_id=property_record.id,
            start_date=date(2026, 8, 2),
            end_date=date(2026, 8, 1),
        )
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_archived_and_inactive_records_leave_default_lists(db_session: Session) -> None:
    client = authenticated_client(db_session)
    customer = create_customer(client)
    property_record = create_property(client, int(customer["id"]))
    project = client.post(
        "/api/v1/projects",
        json=project_payload(int(customer["id"]), int(property_record["id"])),
    ).json()

    client.patch(f"/api/v1/customers/{customer['id']}", json={"is_active": False})
    client.patch(f"/api/v1/properties/{property_record['id']}", json={"is_active": False})
    client.post(f"/api/v1/projects/{project['id']}/archive", json={"expected_version": 1})

    assert client.get("/api/v1/customers").json()["items"] == []
    assert client.get("/api/v1/properties").json()["items"] == []
    assert client.get("/api/v1/projects").json()["items"] == []
