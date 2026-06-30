"""Add bi-weekly log and monthly review tables.

Creates:
  - weekly_logs table
  - artifacts table
  - ai_quiz_attempts table
  - monthly_endorsements table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-30 00:01:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── weekly_logs ───────────────────────────────────────────────────────────
    op.create_table(
        "weekly_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("wed_content", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("sat_content", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("wed_submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sat_submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_weekly_logs_id"), "weekly_logs", ["id"], unique=False
    )
    op.create_index(
        "ix_weekly_logs_application_week",
        "weekly_logs",
        ["application_id", "week_number"],
        unique=True,
    )

    # ── ENUM type for check_in_type ───────────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            DROP TYPE IF EXISTS check_in_type_enum CASCADE;
            CREATE TYPE check_in_type_enum AS ENUM ('wednesday', 'saturday');
        END $$;
    """)

    # ── artifacts ─────────────────────────────────────────────────────────────
    op.create_table(
        "artifacts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("weekly_log_id", sa.Integer(), nullable=True),  # nullable: set after check-in
        sa.Column(
            "check_in_type",
            postgresql.ENUM("wednesday", "saturday", name="check_in_type_enum", create_type=False),
            nullable=False,
        ),
        sa.Column("photo_url", sa.String(length=500), nullable=False),
        sa.Column("server_timestamp_wat", sa.DateTime(timezone=True), nullable=True),
        sa.Column("upload_source", sa.String(length=20), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["weekly_log_id"], ["weekly_logs.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_artifacts_id"), "artifacts", ["id"], unique=False)

    # ── ai_quiz_attempts ──────────────────────────────────────────────────────
    op.create_table(
        "ai_quiz_attempts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("weekly_log_id", sa.Integer(), nullable=False),
        sa.Column("questions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("student_answers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("correct_answers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("passed", sa.Boolean(), nullable=True),
        sa.Column(
            "failed_due_to_tab_switch",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["weekly_log_id"], ["weekly_logs.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("weekly_log_id", name="uq_quiz_weekly_log"),
    )
    op.create_index(
        op.f("ix_ai_quiz_attempts_id"), "ai_quiz_attempts", ["id"], unique=False
    )

    # ── ENUM type for endorsement_action ─────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            DROP TYPE IF EXISTS endorsement_action_enum CASCADE;
            CREATE TYPE endorsement_action_enum AS ENUM ('endorsed', 'flagged');
        END $$;
    """)

    # ── monthly_endorsements ──────────────────────────────────────────────────
    op.create_table(
        "monthly_endorsements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("industry_supervisor_id", sa.Integer(), nullable=False),
        sa.Column("month_year", sa.String(length=7), nullable=False),
        sa.Column(
            "action",
            postgresql.ENUM("endorsed", "flagged", name="endorsement_action_enum", create_type=False),
            nullable=False,
        ),
        sa.Column("flag_comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at_wat",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "is_locked",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["application_id"], ["applications.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["industry_supervisor_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_monthly_endorsements_id"),
        "monthly_endorsements",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_monthly_endorsements_app_month",
        "monthly_endorsements",
        ["application_id", "month_year"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_monthly_endorsements_app_month", table_name="monthly_endorsements")
    op.drop_index(op.f("ix_monthly_endorsements_id"), table_name="monthly_endorsements")
    op.drop_table("monthly_endorsements")
    postgresql.ENUM(name="endorsement_action_enum").drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f("ix_ai_quiz_attempts_id"), table_name="ai_quiz_attempts")
    op.drop_table("ai_quiz_attempts")

    op.drop_index(op.f("ix_artifacts_id"), table_name="artifacts")
    op.drop_table("artifacts")
    postgresql.ENUM(name="check_in_type_enum").drop(op.get_bind(), checkfirst=True)

    op.drop_index("ix_weekly_logs_application_week", table_name="weekly_logs")
    op.drop_index(op.f("ix_weekly_logs_id"), table_name="weekly_logs")
    op.drop_table("weekly_logs")
