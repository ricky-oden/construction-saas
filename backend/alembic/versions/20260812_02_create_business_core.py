"""Create Phase 4 customer, property, and project core.

Revision ID: 20260812_02
Revises: 20260812_01
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260812_02"
down_revision: str | Sequence[str] | None = "20260812_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

project_status = postgresql.ENUM(
    "DRAFT",
    "PLANNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
    name="project_status",
    create_type=False,
)


def upgrade() -> None:
    project_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("contact_name", sa.String(length=100)),
        sa.Column("phone", sa.String(length=30)),
        sa.Column("email", sa.String(length=320)),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_customers_code", "customers", ["code"], unique=True)

    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "customer_id",
            sa.Integer(),
            sa.ForeignKey("customers.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("postal_code", sa.String(length=10)),
        sa.Column("prefecture", sa.String(length=20), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("address_line", sa.String(length=200), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("id", "customer_id", name="uq_properties_id_customer"),
    )
    op.create_index("ix_properties_customer_id", "properties", ["customer_id"])

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column(
            "customer_id",
            sa.Integer(),
            sa.ForeignKey("customers.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", project_status, server_default="DRAFT", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("is_archived", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint("start_date <= end_date", name="ck_projects_date_order"),
        sa.ForeignKeyConstraint(
            ["property_id", "customer_id"],
            ["properties.id", "properties.customer_id"],
            name="fk_projects_property_customer",
            ondelete="RESTRICT",
        ),
    )
    op.create_index("ix_projects_code", "projects", ["code"], unique=True)
    op.create_index("ix_projects_customer_id", "projects", ["customer_id"])
    op.create_index("ix_projects_property_id", "projects", ["property_id"])


def downgrade() -> None:
    op.drop_index("ix_projects_property_id", table_name="projects")
    op.drop_index("ix_projects_customer_id", table_name="projects")
    op.drop_index("ix_projects_code", table_name="projects")
    op.drop_table("projects")
    op.drop_index("ix_properties_customer_id", table_name="properties")
    op.drop_table("properties")
    op.drop_index("ix_customers_code", table_name="customers")
    op.drop_table("customers")
    project_status.drop(op.get_bind(), checkfirst=True)
