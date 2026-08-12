"""Add Phase 6 project assignment and audit history.

Revision ID: 20260812_03
Revises: 20260812_02
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260812_03"
down_revision: str | Sequence[str] | None = "20260812_02"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "project_assignees",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "assignee_id",
            sa.Integer(),
            sa.ForeignKey("assignees.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("project_id", "assignee_id", name="uq_project_assignees_pair"),
    )
    op.create_index("ix_project_assignees_project_id", "project_assignees", ["project_id"])
    op.create_index("ix_project_assignees_assignee_id", "project_assignees", ["assignee_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "project_id",
            sa.Integer(),
            sa.ForeignKey("projects.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "actor_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("before_values", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("after_values", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("project_version", sa.Integer(), nullable=False),
        sa.Column(
            "occurred_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_audit_logs_project_id", "audit_logs", ["project_id"])
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_occurred_at", "audit_logs", ["occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_occurred_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_project_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_project_assignees_assignee_id", table_name="project_assignees")
    op.drop_index("ix_project_assignees_project_id", table_name="project_assignees")
    op.drop_table("project_assignees")
