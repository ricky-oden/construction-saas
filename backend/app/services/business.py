from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.business_schemas import (
    AssigneeCreate,
    AssigneeUpdate,
    CustomerCreate,
    CustomerUpdate,
    PaginationQuery,
    ProjectCreate,
    ProjectListQuery,
    ProjectUpdate,
    PropertyCreate,
    PropertyUpdate,
)
from app.api.exceptions import ApiException
from app.models.auth import Assignee, Role, User
from app.models.business import (
    AuditLog,
    Customer,
    Project,
    ProjectAssignee,
    ProjectStatus,
    Property,
)


@dataclass(frozen=True)
class Page[ModelT]:
    items: list[ModelT]
    page: int
    page_size: int
    total: int
    total_pages: int


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


def _paginate(session: Session, statement: Select[Any], query: PaginationQuery) -> Page[Any]:
    total_statement = select(func.count()).select_from(statement.order_by(None).subquery())
    total = session.scalar(total_statement) or 0
    items = list(
        session.scalars(statement.offset((query.page - 1) * query.page_size).limit(query.page_size))
    )
    total_pages = (total + query.page_size - 1) // query.page_size
    return Page(items, query.page, query.page_size, total, total_pages)


def list_customers(session: Session, query: PaginationQuery) -> Page[Customer]:
    statement = (
        select(Customer)
        .where(Customer.is_active.is_(True))
        .order_by(Customer.updated_at.desc(), Customer.id.desc())
    )
    return _paginate(session, statement, query)


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


def list_properties(session: Session, query: PaginationQuery) -> Page[Property]:
    statement = (
        select(Property)
        .where(Property.is_active.is_(True))
        .order_by(Property.updated_at.desc(), Property.id.desc())
    )
    return _paginate(session, statement, query)


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


PROJECT_SORT_COLUMNS = {
    "code": Project.code,
    "name": Project.name,
    "start_date": Project.start_date,
    "end_date": Project.end_date,
    "created_at": Project.created_at,
    "updated_at": Project.updated_at,
}


def list_projects(session: Session, query: ProjectListQuery, user: User) -> Page[Project]:
    statement = (
        select(Project)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignee.assignee))
        .where(Project.is_archived.is_(False))
    )
    if user.role == Role.MEMBER:
        if user.assignee is None:
            statement = statement.where(False)
        else:
            statement = statement.where(
                Project.id.in_(
                    select(ProjectAssignee.project_id).where(
                        ProjectAssignee.assignee_id == user.assignee.id
                    )
                )
            )
    if query.name is not None:
        statement = statement.where(Project.name.icontains(query.name, autoescape=True))
    if query.status is not None:
        statement = statement.where(Project.status == query.status)
    if query.customer_id is not None:
        statement = statement.where(Project.customer_id == query.customer_id)
    if query.property_id is not None:
        statement = statement.where(Project.property_id == query.property_id)
    if query.assignee_id is not None:
        statement = statement.where(
            Project.id.in_(
                select(ProjectAssignee.project_id).where(
                    ProjectAssignee.assignee_id == query.assignee_id
                )
            )
        )
    if query.period_to is not None:
        statement = statement.where(Project.start_date <= query.period_to)
    if query.period_from is not None:
        statement = statement.where(Project.end_date >= query.period_from)

    sort_column = PROJECT_SORT_COLUMNS[query.sort]
    direction = sort_column.asc if query.order == "asc" else sort_column.desc
    id_direction = Project.id.asc if query.order == "asc" else Project.id.desc
    return _paginate(session, statement.order_by(direction(), id_direction()), query)


def get_project(session: Session, project_id: int, user: User | None = None) -> Project:
    project = session.scalar(
        select(Project)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignee.assignee))
        .where(Project.id == project_id)
    )
    if project is None:
        raise _not_found("Project")
    if user is not None and user.role == Role.MEMBER:
        assignee_id = user.assignee.id if user.assignee else None
        if assignee_id is None or all(
            assignment.assignee_id != assignee_id for assignment in project.assignments
        ):
            raise ApiException(HTTPStatus.FORBIDDEN, "FORBIDDEN", "Project access is not allowed.")
    return project


def _locked_project(session: Session, project_id: int) -> Project:
    project = session.scalar(
        select(Project)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignee.assignee))
        .where(Project.id == project_id)
        .with_for_update()
    )
    if project is None:
        raise _not_found("Project")
    return project


def _check_version(project: Project, expected_version: int) -> None:
    if project.version != expected_version:
        raise ApiException(
            HTTPStatus.CONFLICT,
            "VERSION_CONFLICT",
            "Project was updated by another request.",
            {
                "resource_type": "Project",
                "resource_id": project.id,
                "expected_version": expected_version,
                "current_version": project.version,
            },
        )


def _audit(
    session: Session,
    project: Project,
    actor_user_id: int,
    action: str,
    before_values: dict[str, object],
    after_values: dict[str, object],
) -> None:
    session.add(
        AuditLog(
            project_id=project.id,
            actor_user_id=actor_user_id,
            action=action,
            before_values=before_values,
            after_values=after_values,
            project_version=project.version,
        )
    )


def _json_value(value: object) -> object:
    if hasattr(value, "isoformat"):
        return value.isoformat()  # type: ignore[union-attr]
    if isinstance(value, ProjectStatus):
        return value.value
    return value


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


def update_project(
    session: Session, project_id: int, payload: ProjectUpdate, actor: User
) -> Project:
    project = _locked_project(session, project_id)
    _check_version(project, payload.expected_version)
    values = payload.model_dump(exclude_unset=True)
    values.pop("expected_version")
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

    before = {field: _json_value(getattr(project, field)) for field in values}
    _set_fields(project, values)
    project.version += 1
    after = {field: _json_value(getattr(project, field)) for field in values}
    _audit(session, project, actor.id, "PROJECT_UPDATED", before, after)
    _commit(session, "Project code already exists.")
    session.refresh(project)
    return project


ALLOWED_TRANSITIONS = {
    ProjectStatus.DRAFT: {ProjectStatus.PLANNED, ProjectStatus.CANCELLED},
    ProjectStatus.PLANNED: {
        ProjectStatus.IN_PROGRESS,
        ProjectStatus.ON_HOLD,
        ProjectStatus.CANCELLED,
    },
    ProjectStatus.IN_PROGRESS: {
        ProjectStatus.ON_HOLD,
        ProjectStatus.COMPLETED,
        ProjectStatus.CANCELLED,
    },
    ProjectStatus.ON_HOLD: {ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED},
    ProjectStatus.COMPLETED: set(),
    ProjectStatus.CANCELLED: set(),
}

MEMBER_TRANSITIONS = {
    (ProjectStatus.PLANNED, ProjectStatus.IN_PROGRESS),
    (ProjectStatus.IN_PROGRESS, ProjectStatus.ON_HOLD),
    (ProjectStatus.ON_HOLD, ProjectStatus.IN_PROGRESS),
    (ProjectStatus.IN_PROGRESS, ProjectStatus.COMPLETED),
}


def transition_project(
    session: Session,
    project_id: int,
    target: ProjectStatus,
    expected_version: int,
    actor: User,
) -> Project:
    project = _locked_project(session, project_id)
    _check_version(project, expected_version)
    if actor.role == Role.MEMBER:
        get_project(session, project_id, actor)
        if (project.status, target) not in MEMBER_TRANSITIONS:
            raise ApiException(HTTPStatus.FORBIDDEN, "FORBIDDEN", "Transition is not allowed.")
    if target not in ALLOWED_TRANSITIONS[project.status]:
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "INVALID_STATUS_TRANSITION",
            "The requested status transition is not allowed.",
        )
    before = project.status.value
    project.status = target
    project.version += 1
    _audit(
        session,
        project,
        actor.id,
        "STATUS_CHANGED",
        {"status": before},
        {"status": target.value},
    )
    session.commit()
    session.refresh(project)
    return project


def replace_assignees(
    session: Session,
    project_id: int,
    assignee_ids: list[int],
    expected_version: int,
    actor: User,
) -> Project:
    project = _locked_project(session, project_id)
    _check_version(project, expected_version)
    if len(assignee_ids) != len(set(assignee_ids)):
        raise ApiException(
            HTTPStatus.UNPROCESSABLE_ENTITY,
            "DUPLICATE_ASSIGNEE",
            "Assignee IDs must be unique.",
        )
    assignees = list(session.scalars(select(Assignee).where(Assignee.id.in_(assignee_ids))))
    if len(assignees) != len(assignee_ids) or any(not item.is_active for item in assignees):
        raise _invalid_reference("Only active assignees can be assigned.")
    before = sorted(assignment.assignee_id for assignment in project.assignments)
    project.assignments = [ProjectAssignee(assignee_id=item_id) for item_id in assignee_ids]
    project.version += 1
    _audit(
        session,
        project,
        actor.id,
        "ASSIGNEES_CHANGED",
        {"assignee_ids": before},
        {"assignee_ids": sorted(assignee_ids)},
    )
    session.commit()
    session.refresh(project)
    return get_project(session, project_id)


def archive_project(
    session: Session, project_id: int, expected_version: int, actor: User
) -> Project:
    project = _locked_project(session, project_id)
    _check_version(project, expected_version)
    before = project.is_archived
    project.is_archived = True
    project.version += 1
    _audit(
        session,
        project,
        actor.id,
        "PROJECT_ARCHIVED",
        {"is_archived": before},
        {"is_archived": True},
    )
    session.commit()
    session.refresh(project)
    return project


def list_assignees(session: Session) -> list[Assignee]:
    statement = select(Assignee).where(Assignee.is_active.is_(True)).order_by(Assignee.id)
    return list(session.scalars(statement))


def get_assignee(session: Session, assignee_id: int) -> Assignee:
    assignee = session.get(Assignee, assignee_id)
    if assignee is None:
        raise _not_found("Assignee")
    return assignee


def create_assignee(session: Session, payload: AssigneeCreate) -> Assignee:
    if session.get(User, payload.user_id) is None:
        raise _invalid_reference("The login user does not exist.")
    if session.scalar(select(Assignee.id).where(Assignee.user_id == payload.user_id)):
        raise ApiException(
            HTTPStatus.CONFLICT,
            "DUPLICATE_ASSIGNEE",
            "User already has an assignee.",
        )
    assignee = Assignee(**payload.model_dump())
    session.add(assignee)
    session.commit()
    session.refresh(assignee)
    return assignee


def update_assignee(session: Session, assignee_id: int, payload: AssigneeUpdate) -> Assignee:
    assignee = get_assignee(session, assignee_id)
    _set_fields(assignee, payload.model_dump(exclude_unset=True))
    session.commit()
    session.refresh(assignee)
    return assignee


def list_audit_logs(session: Session, project_id: int, user: User) -> list[AuditLog]:
    get_project(session, project_id, user)
    return list(
        session.scalars(
            select(AuditLog)
            .where(AuditLog.project_id == project_id)
            .order_by(AuditLog.occurred_at.asc(), AuditLog.id.asc())
        )
    )
