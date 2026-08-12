from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.business_schemas import (
    CustomerCreate,
    CustomerListResponse,
    CustomerResponse,
    CustomerUpdate,
    PaginationQuery,
    ProjectCreate,
    ProjectListQuery,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
    PropertyCreate,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdate,
)
from app.auth.dependencies import require_roles
from app.db.session import get_db
from app.models.auth import Role
from app.services import business

management_dependency = Depends(require_roles(Role.ADMIN, Role.MANAGER))
router = APIRouter(dependencies=[management_dependency])


@router.get("/customers", response_model=CustomerListResponse)
def customer_list(
    query: Annotated[PaginationQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
) -> CustomerListResponse:
    return CustomerListResponse.model_validate(
        business.list_customers(session, query), from_attributes=True
    )


@router.post("/customers", response_model=CustomerResponse, status_code=201)
def customer_create(
    payload: CustomerCreate, session: Annotated[Session, Depends(get_db)]
) -> CustomerResponse:
    return CustomerResponse.model_validate(business.create_customer(session, payload))


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def customer_detail(
    customer_id: int, session: Annotated[Session, Depends(get_db)]
) -> CustomerResponse:
    return CustomerResponse.model_validate(business.get_customer(session, customer_id))


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
def customer_update(
    customer_id: int,
    payload: CustomerUpdate,
    session: Annotated[Session, Depends(get_db)],
) -> CustomerResponse:
    return CustomerResponse.model_validate(business.update_customer(session, customer_id, payload))


@router.get("/properties", response_model=PropertyListResponse)
def property_list(
    query: Annotated[PaginationQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
) -> PropertyListResponse:
    return PropertyListResponse.model_validate(
        business.list_properties(session, query), from_attributes=True
    )


@router.post("/properties", response_model=PropertyResponse, status_code=201)
def property_create(
    payload: PropertyCreate, session: Annotated[Session, Depends(get_db)]
) -> PropertyResponse:
    return PropertyResponse.model_validate(business.create_property(session, payload))


@router.get("/properties/{property_id}", response_model=PropertyResponse)
def property_detail(
    property_id: int, session: Annotated[Session, Depends(get_db)]
) -> PropertyResponse:
    return PropertyResponse.model_validate(business.get_property(session, property_id))


@router.patch("/properties/{property_id}", response_model=PropertyResponse)
def property_update(
    property_id: int,
    payload: PropertyUpdate,
    session: Annotated[Session, Depends(get_db)],
) -> PropertyResponse:
    return PropertyResponse.model_validate(business.update_property(session, property_id, payload))


@router.get("/projects", response_model=ProjectListResponse)
def project_list(
    query: Annotated[ProjectListQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
) -> ProjectListResponse:
    return ProjectListResponse.model_validate(
        business.list_projects(session, query), from_attributes=True
    )


@router.post("/projects", response_model=ProjectResponse, status_code=201)
def project_create(
    payload: ProjectCreate, session: Annotated[Session, Depends(get_db)]
) -> ProjectResponse:
    return ProjectResponse.model_validate(business.create_project(session, payload))


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def project_detail(
    project_id: int, session: Annotated[Session, Depends(get_db)]
) -> ProjectResponse:
    return ProjectResponse.model_validate(business.get_project(session, project_id))


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def project_update(
    project_id: int,
    payload: ProjectUpdate,
    session: Annotated[Session, Depends(get_db)],
) -> ProjectResponse:
    return ProjectResponse.model_validate(business.update_project(session, project_id, payload))
