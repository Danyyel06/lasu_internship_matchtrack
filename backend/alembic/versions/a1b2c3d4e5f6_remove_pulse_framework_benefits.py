"""Remove pulse, framework, and benefits engine tables/columns.

Drops:
  - weekly_pulse table
  - unified_frameworks table
  - company_cycle_entitlements table
  - intern_satisfaction_score column from companies
  - full_time_offer_rate column from companies

Revision ID: a1b2c3d4e5f6
Revises: 596360dcd3fd
Create Date: 2026-06-30 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "596360dcd3fd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop weekly_pulse table
    op.drop_table("weekly_pulse")

    # Drop unified_frameworks table (includes revision_count and comment_history added later)
    op.drop_table("unified_frameworks")

    # Drop company_cycle_entitlements table
    op.drop_table("company_cycle_entitlements")

    # Drop satisfaction and offer-rate columns from companies
    op.drop_column("companies", "intern_satisfaction_score")
    op.drop_column("companies", "full_time_offer_rate")


def downgrade() -> None:
    # Restore company columns
    op.add_column(
        "companies",
        sa.Column("full_time_offer_rate", sa.Numeric(precision=5, scale=2), nullable=True),
    )
    op.add_column(
        "companies",
        sa.Column("intern_satisfaction_score", sa.Numeric(precision=5, scale=2), nullable=True),
    )

    # Restore company_cycle_entitlements
    op.create_table(
        "company_cycle_entitlements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("cycle_id", sa.Integer(), nullable=False),
        sa.Column("total_slots_offered", sa.Integer(), nullable=True),
        sa.Column("equity_quota_required", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column(
            "equity_quota_met",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
        sa.Column("fair_participation_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cycle_id"], ["internship_cycles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Restore unified_frameworks
    op.create_table(
        "unified_frameworks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column(
            "university_objectives",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "company_objectives",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("academic_supervisor_comments", sa.Text(), nullable=True),
        sa.Column(
            "submitted_by_industry_supervisor_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("approved_by_academic_supervisor_id", sa.Integer(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revision_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "comment_history",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["approved_by_academic_supervisor_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Restore weekly_pulse
    op.create_table(
        "weekly_pulse",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("internship_id", sa.Integer(), nullable=True),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("micro_goals", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("pin_links", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("hit_miss", sa.Boolean(), nullable=True),
        sa.Column("reflection", sa.String(length=200), nullable=True),
        sa.Column(
            "supervisor_endorsements",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("flagged", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["internship_id"], ["internships.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
