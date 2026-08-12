from http import HTTPStatus
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.business_schemas import (
    CustomerCreate,
    CustomerUpdate,
    ProjectCreate,
    ProjectUpdate,
    PropertyCreate,
    PropertyUpdate,
)
from app.api.exceptions import ApiException
from app.models.business import Customer, Project, Property


def _not_found(resource: str) -> ApiException:
    return ApiException(HTTPStatus.NOT_FOUND, "NOT_FOUND", f"{resource} was not found.")


def _invalid_reference(message: str) -> ApiException:
    return ApiException(HTTPStatus.UNPROCESSABLE_ENTITY, "INVALID_REFERENCE", message)


def _commit(session: Session, duplicate_message: str) -> None:
    try:
        session.commit()
    except IntegrityError as exception:
        session.rollback()
        if getattr(exception.orig, "sqlstate", None) == "23505":
            raise ApiException(HTTPStatus.CONFLICT, "DUPLICATE_CODE", duplicate_message) from None
        raise


def _set_fields(target: Any, values: dict[str, Any]) -> None:
    for field, value in values.items():
        setattr(target, field, value)


def list_customers(session: Session) -> list[Customer]:
    return list(
        session.scalars(select(Customer).where(Customer.is_active.is_(True)).order_by(Customer.id))
    )


def get_customer(session: Session, customer_id: int) -> Customer:
    customer = session.get(Customer, customer_id)
    if customer is None:
        raise _not_found("Customer")
    return customer


def create_customer(session: Session, payload: CustomerCreate) -> Customer:
    if session.scalar(select(Customer.id).where(Customer.code == payload.code)) is not None:
        raise ApiException(HTTPStatus.CONFLICT, "DUPLICATE_CODE", "Customer code already exists.")
    customer = Customer(**payload.model_dump())
    session.add(customer)
    _commit(session, "Customer code already exists.")
    session.refresh(customer)
    return customer


def update_customer(session: Session, customer_id: int, payload: CustomerUpdate) -> Customer:
    customer = get_customer(session, customer_id)
    values = payload.model_dump(exclude_unset=True)
    new_code = values.get("code")
    if new_code is not None and session.scalar(
        select(Customer.id).where(Customer.code == new_code, Customer.id != customer_id)
    ):
        raise ApiException(HTTPStatus.CONFLICT, "DUPLICATE_CODE", "Customer code already exists.")
    _set_fields(customer, values)
    _commit(session, "Customer code already exists.")
    session.refresh(customer)
    return customer


def list_properties(session: Session) -> list[Property]:
    return list(
        session.scalars(select(Property).where(Property.is_active.is_(True)).order_by(Property.id))
    )


def get_property(session: Session, property_id: int) -> Property:
    property_record = session.get(Property, property_id)
    if property_record is None:
        raise _not_found("Property")
    return property_record


def create_property(session: Session, payload: PropertyCreate) -> Property:
    customer = get_customer(session, payload.customer_id)
    if not customer.is_active:
        raise _invalid_reference("An inactive customer cannot be used for a new property.")
    property_record = Property(**payload.model_dump())
    session.add(property_record)
    session.commit()
    session.refresh(property_record)
    return property_record


def update_property(session: Session, property_id: int, payload: PropertyUpdate) -> Property:
    property_record = get_property(session, property_id)
    _set_fields(property_record, payload.model_dump(exclude_unset=True))
    session.commit()
    session.refresh(property_record)
    return property_record


def list_projects(session: Session) -> list[Project]:
    return list(
        session.scalars(select(Project).where(Project.is_archived.is_(False)).order_by(Project.id))
    )


def get_project(session: Session, project_id: int) -> Project:
    project = session.get(Project, project_id)
    if project is None:
        raise _not_found("Project")
    return project


def _validate_project_references(session: Session, customer_id: int, property_id: int) -> None:
    customer = get_customer(session, customer_id)
    property_record = get_property(session, property_id)
    if not customer.is_active or not property_record.is_active:
        raise _invalid_reference("Inactive customers or properties cannot be used for a project.")
    if property_record.customer_id != customer_id:
        raise _invalid_reference("The property does not belong to the selected customer.")


def create_project(session: Session, payload: ProjectCreate) -> Project:
    if session.scalar(select(Project.id).where(Project.code == payload.code)) is not None:
        raise ApiException(HTTPStatus.CONFLICT, "DUPLICATE_CODE", "Project code already exists.")
    _validate_project_references(session, payload.customer_id, payload.property_id)
    project = Project(**payload.model_dump())
    session.add(project)
    _commit(session, "Project code already exists.")
    session.refresh(project)
    return project


def update_project(session: Session, project_id: int, payload: ProjectUpdate) -> Project:
    project = get_project(session, project_id)
    values = payload.model_dump(exclude_unset=True)
    new_code = values.get("code")
    if new_code is not None and session.scalar(
        select(Project.id).where(Project.code == new_code, Project.id != project_id)
    ):
        raise ApiException(HTTPStatus.CONFLICT, "DUPLICATE_CODE", "Project code already exists.")

    customer_id = values.get("customer_id", project.customer_id)
    property_id = values.get("property_id", project.property_id)
    references_changed = customer_id != project.customer_id or property_id != project.property_id
    if references_changed:
        _validate_project_references(session, customer_id, property_id)
    start_date = values.get("start_date", project.start_date)
    end_date = values.get("end_date", project.end_date)
    if start_date > end_date:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "INVALID_DATE_RANGE",
            "start_date must be on or before end_date.",
        )

    _set_fields(project, values)
    _commit(session, "Project code already exists.")
    session.refresh(project)
    return project
