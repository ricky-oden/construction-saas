from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.business import ProjectStatus


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _validate_optional_email(value: str | None) -> str | None:
    cleaned = _clean_optional(value)
    if cleaned is not None and (
        "@" not in cleaned or cleaned.startswith("@") or cleaned.endswith("@")
    ):
        raise ValueError("Enter a valid email address.")
    return cleaned


class BusinessRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class PaginationQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class ProjectListQuery(PaginationQuery):
    name: str | None = Field(default=None, max_length=150)
    status: ProjectStatus | None = None
    customer_id: int | None = Field(default=None, gt=0)
    property_id: int | None = Field(default=None, gt=0)
    period_from: date | None = None
    period_to: date | None = None
    sort: Literal["code", "name", "start_date", "end_date", "created_at", "updated_at"] = (
        "updated_at"
    )
    order: Literal["asc", "desc"] = "desc"

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str | None) -> str | None:
        return _clean_optional(value)

    @model_validator(mode="after")
    def validate_period(self) -> "ProjectListQuery":
        if (
            self.period_from is not None
            and self.period_to is not None
            and self.period_from > self.period_to
        ):
            raise ValueError("period_from must be on or before period_to.")
        return self


class PageResponse(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class CustomerCreate(BusinessRequest):
    code: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=100)
    contact_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=320)

    @field_validator("code", "name")
    @classmethod
    def clean_required(cls, value: str) -> str:
        if not (cleaned := value.strip()):
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("contact_name", "phone")
    @classmethod
    def clean_optional(cls, value: str | None) -> str | None:
        return _clean_optional(value)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _validate_optional_email(value)


class CustomerUpdate(BusinessRequest):
    code: str | None = Field(default=None, min_length=1, max_length=30)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    contact_name: str | None = Field(default=None, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=320)
    is_active: bool | None = None

    @field_validator("code", "name")
    @classmethod
    def clean_required(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not (cleaned := value.strip()):
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("contact_name", "phone")
    @classmethod
    def clean_optional(cls, value: str | None) -> str | None:
        return _clean_optional(value)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str | None) -> str | None:
        return _validate_optional_email(value)


class CustomerResponse(CustomerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(PageResponse):
    items: list[CustomerResponse]


class PropertyCreate(BusinessRequest):
    customer_id: int
    name: str = Field(min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, max_length=10)
    prefecture: str = Field(min_length=1, max_length=20)
    city: str = Field(min_length=1, max_length=100)
    address_line: str = Field(min_length=1, max_length=200)

    @field_validator("name", "prefecture", "city", "address_line")
    @classmethod
    def clean_required(cls, value: str) -> str:
        if not (cleaned := value.strip()):
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("postal_code")
    @classmethod
    def clean_postal_code(cls, value: str | None) -> str | None:
        return _clean_optional(value)


class PropertyUpdate(BusinessRequest):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, max_length=10)
    prefecture: str | None = Field(default=None, min_length=1, max_length=20)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    address_line: str | None = Field(default=None, min_length=1, max_length=200)
    is_active: bool | None = None

    @field_validator("name", "prefecture", "city", "address_line")
    @classmethod
    def clean_required(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not (cleaned := value.strip()):
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("postal_code")
    @classmethod
    def clean_postal_code(cls, value: str | None) -> str | None:
        return _clean_optional(value)


class PropertyResponse(PropertyCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PropertyListResponse(PageResponse):
    items: list[PropertyResponse]


class ProjectCreate(BusinessRequest):
    code: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    customer_id: int
    property_id: int
    start_date: date
    end_date: date

    @field_validator("code", "name")
    @classmethod
    def clean_required(cls, value: str) -> str:
        if not (cleaned := value.strip()):
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return _clean_optional(value)

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectCreate":
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date.")
        return self


class ProjectUpdate(BusinessRequest):
    code: str | None = Field(default=None, min_length=1, max_length=30)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    customer_id: int | None = None
    property_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_archived: bool | None = None

    @field_validator("code", "name")
    @classmethod
    def clean_required(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if not (cleaned := value.strip()):
            raise ValueError("This field cannot be blank.")
        return cleaned

    @field_validator("description")
    @classmethod
    def clean_description(cls, value: str | None) -> str | None:
        return _clean_optional(value)


class ProjectResponse(ProjectCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: ProjectStatus
    version: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(PageResponse):
    items: list[ProjectResponse]
