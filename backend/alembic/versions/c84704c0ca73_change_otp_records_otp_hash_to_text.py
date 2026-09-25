"""change_otp_records_otp_hash_to_text

Revision ID: c84704c0ca73
Revises: f2a3b4c5d6e7
Create Date: 2026-09-24 02:24:48.332682

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c84704c0ca73'
down_revision: Union[str, None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'otp_records',
        'otp_hash',
        existing_type=sa.String(length=255),
        type_=sa.Text(),
        existing_nullable=False
    )


def downgrade() -> None:
    op.alter_column(
        'otp_records',
        'otp_hash',
        existing_type=sa.Text(),
        type_=sa.String(length=255),
        existing_nullable=False
    )
