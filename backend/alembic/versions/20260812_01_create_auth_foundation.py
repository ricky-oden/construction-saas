"""Create Phase 3 authentication foundation.

Revision ID: 20260812_01
Revises:
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260812_01"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

user_role = postgresql.ENUM("ADMIN", "MANAGER", "MEMBER", name="user_role", create_type=False)


def upgrade() -> None:
    user_role.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=512), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "auth_token_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_auth_token_sessions_user_id", "auth_token_sessions", ["user_id"])
    op.create_index(
        "ix_auth_token_sessions_token_hash", "auth_token_sessions", ["token_hash"], unique=True
    )
    op.create_index("ix_auth_token_sessions_expires_at", "auth_token_sessions", ["expires_at"])
    op.create_index(
        "uq_auth_token_sessions_active_user",
        "auth_token_sessions",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("revoked_at IS NULL"),
    )

    op.create_table(
        "assignees",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("display_name", sa.String(length=200), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_assignees_user_id", "assignees", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_assignees_user_id", table_name="assignees")
    op.drop_table("assignees")
    op.drop_index("uq_auth_token_sessions_active_user", table_name="auth_token_sessions")
    op.drop_index("ix_auth_token_sessions_expires_at", table_name="auth_token_sessions")
    op.drop_index("ix_auth_token_sessions_token_hash", table_name="auth_token_sessions")
    op.drop_index("ix_auth_token_sessions_user_id", table_name="auth_token_sessions")
    op.drop_table("auth_token_sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    user_role.drop(op.get_bind(), checkfirst=True)
