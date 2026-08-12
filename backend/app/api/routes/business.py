from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.business_schemas import (
    ArchiveProjectRequest,
    AssigneeCreate,
    AssigneeListResponse,
    AssigneeResponse,
    AssigneeSetUpdate,
    AssigneeUpdate,
    AuditLogListResponse,
    AuditLogResponse,
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
    StatusTransitionRequest,
)
from app.auth.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.auth import Role, User
from app.services import business

ManagementUser = Annotated[User, Depends(require_roles(Role.ADMIN, Role.MANAGER))]
CurrentUser = Annotated[User, Depends(get_current_user)]
router = APIRouter()


@router.get("/customers", response_model=CustomerListResponse)
def customer_list(
    query: Annotated[PaginationQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> CustomerListResponse:
    return CustomerListResponse.model_validate(
        business.list_customers(session, query), from_attributes=True
    )


@router.post("/customers", response_model=CustomerResponse, status_code=201)
def customer_create(
    payload: CustomerCreate, session: Annotated[Session, Depends(get_db)], _user: ManagementUser
) -> CustomerResponse:
    return CustomerResponse.model_validate(business.create_customer(session, payload))


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
def customer_detail(
    customer_id: int, session: Annotated[Session, Depends(get_db)], _user: ManagementUser
) -> CustomerResponse:
    return CustomerResponse.model_validate(business.get_customer(session, customer_id))


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
def customer_update(
    customer_id: int,
    payload: CustomerUpdate,
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> CustomerResponse:
    return CustomerResponse.model_validate(business.update_customer(session, customer_id, payload))


@router.get("/properties", response_model=PropertyListResponse)
def property_list(
    query: Annotated[PaginationQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> PropertyListResponse:
    return PropertyListResponse.model_validate(
        business.list_properties(session, query), from_attributes=True
    )


@router.post("/properties", response_model=PropertyResponse, status_code=201)
def property_create(
    payload: PropertyCreate, session: Annotated[Session, Depends(get_db)], _user: ManagementUser
) -> PropertyResponse:
    return PropertyResponse.model_validate(business.create_property(session, payload))


@router.get("/properties/{property_id}", response_model=PropertyResponse)
def property_detail(
    property_id: int, session: Annotated[Session, Depends(get_db)], _user: ManagementUser
) -> PropertyResponse:
    return PropertyResponse.model_validate(business.get_property(session, property_id))


@router.patch("/properties/{property_id}", response_model=PropertyResponse)
def property_update(
    property_id: int,
    payload: PropertyUpdate,
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> PropertyResponse:
    return PropertyResponse.model_validate(business.update_property(session, property_id, payload))


@router.get("/projects", response_model=ProjectListResponse)
def project_list(
    query: Annotated[ProjectListQuery, Query()],
    session: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
) -> ProjectListResponse:
    return ProjectListResponse.model_validate(
        business.list_projects(session, query, user), from_attributes=True
    )


@router.post("/projects", response_model=ProjectResponse, status_code=201)
def project_create(
    payload: ProjectCreate, session: Annotated[Session, Depends(get_db)], _user: ManagementUser
) -> ProjectResponse:
    return ProjectResponse.model_validate(business.create_project(session, payload))


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def project_detail(
    project_id: int, session: Annotated[Session, Depends(get_db)], user: CurrentUser
) -> ProjectResponse:
    return ProjectResponse.model_validate(business.get_project(session, project_id, user))


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def project_update(
    project_id: int,
    payload: ProjectUpdate,
    session: Annotated[Session, Depends(get_db)],
    user: ManagementUser,
) -> ProjectResponse:
    return ProjectResponse.model_validate(
        business.update_project(session, project_id, payload, user)
    )


@router.get("/assignees", response_model=AssigneeListResponse)
def assignee_list(
    session: Annotated[Session, Depends(get_db)], _user: ManagementUser
) -> AssigneeListResponse:
    return AssigneeListResponse(
        items=[AssigneeResponse.model_validate(item) for item in business.list_assignees(session)]
    )


@router.post("/assignees", response_model=AssigneeResponse, status_code=201)
def assignee_create(
    payload: AssigneeCreate,
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> AssigneeResponse:
    return AssigneeResponse.model_validate(business.create_assignee(session, payload))


@router.get("/assignees/{assignee_id}", response_model=AssigneeResponse)
def assignee_detail(
    assignee_id: int,
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> AssigneeResponse:
    return AssigneeResponse.model_validate(business.get_assignee(session, assignee_id))


@router.patch("/assignees/{assignee_id}", response_model=AssigneeResponse)
def assignee_update(
    assignee_id: int,
    payload: AssigneeUpdate,
    session: Annotated[Session, Depends(get_db)],
    _user: ManagementUser,
) -> AssigneeResponse:
    return AssigneeResponse.model_validate(business.update_assignee(session, assignee_id, payload))


@router.put("/projects/{project_id}/assignees", response_model=ProjectResponse)
def project_assignees_update(
    project_id: int,
    payload: AssigneeSetUpdate,
    session: Annotated[Session, Depends(get_db)],
    user: ManagementUser,
) -> ProjectResponse:
    return ProjectResponse.model_validate(
        business.replace_assignees(
            session, project_id, payload.assignee_ids, payload.expected_version, user
        )
    )


@router.post("/projects/{project_id}/status-transitions", response_model=ProjectResponse)
def project_status_transition(
    project_id: int,
    payload: StatusTransitionRequest,
    session: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
) -> ProjectResponse:
    return ProjectResponse.model_validate(
        business.transition_project(
            session, project_id, payload.status, payload.expected_version, user
        )
    )


@router.post("/projects/{project_id}/archive", response_model=ProjectResponse)
def project_archive(
    project_id: int,
    payload: ArchiveProjectRequest,
    session: Annotated[Session, Depends(get_db)],
    user: ManagementUser,
) -> ProjectResponse:
    return ProjectResponse.model_validate(
        business.archive_project(session, project_id, payload.expected_version, user)
    )


@router.get("/projects/{project_id}/history", response_model=AuditLogListResponse)
def project_history(
    project_id: int,
    session: Annotated[Session, Depends(get_db)],
    user: CurrentUser,
) -> AuditLogListResponse:
    return AuditLogListResponse(
        items=[
            AuditLogResponse.model_validate(item)
            for item in business.list_audit_logs(session, project_id, user)
        ]
    )
