"""Add phone, office_location, faculty, title to academic_supervisor_profiles

Revision ID: f1a2b3c4d5e6
Revises: de2a49f9afb0
Create Date: 2026-07-11 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'de2a49f9afb0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('academic_supervisor_profiles', sa.Column('phone_number', sa.String(length=20), nullable=True))
    op.add_column('academic_supervisor_profiles', sa.Column('office_location', sa.String(length=100), nullable=True))
    op.add_column('academic_supervisor_profiles', sa.Column('faculty', sa.String(length=100), nullable=True))
    op.add_column('academic_supervisor_profiles', sa.Column('title', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('academic_supervisor_profiles', 'title')
    op.drop_column('academic_supervisor_profiles', 'faculty')
    op.drop_column('academic_supervisor_profiles', 'office_location')
    op.drop_column('academic_supervisor_profiles', 'phone_number')
