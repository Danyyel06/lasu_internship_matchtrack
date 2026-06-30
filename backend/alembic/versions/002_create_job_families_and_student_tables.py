"""create job_families, sub_roles, students, student_job_family_selections, student_skills

Revision ID: 002
Revises: 001
Create Date: 2026-06-20 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. job_families
    op.create_table(
        "job_families",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("default_weights", JSONB(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # 2. sub_roles (FK → job_families)
    op.create_table(
        "sub_roles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("job_family_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("skills", JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["job_family_id"], ["job_families.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sub_roles_job_family_id", "sub_roles", ["job_family_id"])

    # 3. students (FK → users)
    op.create_table(
        "students",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("matric_no", sa.String(length=20), nullable=False),
        sa.Column("faculty", sa.String(length=100), nullable=False),
        sa.Column("department", sa.String(length=100), nullable=False),
        sa.Column("level", sa.Integer(), nullable=True),
        sa.Column("cgpa", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("gender", sa.String(length=20), nullable=True),
        sa.Column("profile_photo_url", sa.String(length=255), nullable=True),
        sa.Column("preliminary_fit_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_tier", sa.String(length=10), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("matric_no"),
    )
    op.create_index("ix_students_user_id", "students", ["user_id"])

    # 4. student_job_family_selections (FK → students, job_families, sub_roles)
    op.create_table(
        "student_job_family_selections",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("job_family_id", sa.Integer(), nullable=False),
        sa.Column("selected_sub_role_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["job_family_id"], ["job_families.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["selected_sub_role_id"], ["sub_roles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("student_id"),
    )

    # 5. student_skills (FK → students)
    op.create_table(
        "student_skills",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("skill_name", sa.String(length=100), nullable=False),
        sa.Column("claimed_level", sa.Integer(), nullable=True),
        sa.Column("verified_level", sa.Integer(), nullable=True),
        sa.Column("test_score", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["students.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_student_skills_student_id", "student_skills", ["student_id"])


def downgrade() -> None:
    op.drop_index("ix_student_skills_student_id", table_name="student_skills")
    op.drop_table("student_skills")
    op.drop_table("student_job_family_selections")
    op.drop_index("ix_students_user_id", table_name="students")
    op.drop_table("students")
    op.drop_index("ix_sub_roles_job_family_id", table_name="sub_roles")
    op.drop_table("sub_roles")
    op.drop_table("job_families")
