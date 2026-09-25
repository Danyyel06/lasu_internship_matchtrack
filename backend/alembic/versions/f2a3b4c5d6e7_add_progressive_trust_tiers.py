"""add progressive trust tiers

Revision ID: f2a3b4c5d6e7
Revises: 2249789b93b7
Create Date: 2026-09-15 07:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, None] = '2249789b93b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add columns to companies table
    op.add_column('companies', sa.Column('trust_tier', sa.SmallInteger(), server_default='1', nullable=False))
    op.add_column('companies', sa.Column('tier_1_status', sa.String(length=20), server_default="'pending'", nullable=False))
    op.add_column('companies', sa.Column('tier_2_status', sa.String(length=20), nullable=True))
    op.add_column('companies', sa.Column('tier_3_status', sa.String(length=20), nullable=True))
    op.add_column('companies', sa.Column('tier_4_status', sa.String(length=20), nullable=True))
    op.add_column('companies', sa.Column('verification_method', sa.String(length=30), nullable=True))
    op.add_column('companies', sa.Column('is_individual_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('companies', sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('companies', sa.Column('suspension_reason', sa.String(length=500), nullable=True))
    op.add_column('companies', sa.Column('state', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('lga', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('rep_job_title', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('rep_phone', sa.String(length=30), nullable=True))
    op.add_column('companies', sa.Column('internship_description', sa.Text(), nullable=True))

    # 2. Create table verification_submissions
    op.create_table('verification_submissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('tier', sa.SmallInteger(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewer_id', sa.Integer(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewer_note', sa.Text(), nullable=True),
        sa.Column('auto_check_result', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # 3. Create table verification_documents
    op.create_table('verification_documents',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('submission_id', sa.Integer(), nullable=False),
        sa.Column('doc_type', sa.String(length=50), nullable=False),
        sa.Column('storage_path', sa.String(length=500), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('review_status', sa.String(length=20), nullable=False),
        sa.Column('review_note', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['submission_id'], ['verification_submissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Create table verification_events
    op.create_table('verification_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('tier', sa.SmallInteger(), nullable=True),
        sa.Column('from_status', sa.String(length=20), nullable=True),
        sa.Column('to_status', sa.String(length=20), nullable=True),
        sa.Column('from_tier', sa.SmallInteger(), nullable=True),
        sa.Column('to_tier', sa.SmallInteger(), nullable=True),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('actor_role', sa.String(length=30), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Create table otp_records
    op.create_table('otp_records',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('identifier', sa.String(length=200), nullable=False),
        sa.Column('purpose', sa.String(length=50), nullable=False),
        sa.Column('otp_hash', sa.String(length=255), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_otp_records_identifier'), 'otp_records', ['identifier'], unique=False)

    # 6 & 7. Backfill
    op.execute(
        "UPDATE companies SET trust_tier = 3, tier_1_status = 'approved', tier_2_status = 'approved', tier_3_status = 'approved' WHERE is_admin_verified = true"
    )
    op.execute(
        "UPDATE companies SET trust_tier = 1, tier_1_status = 'approved' WHERE is_admin_verified = false"
    )

    # 8. Create partial unique index
    op.execute(
        "CREATE UNIQUE INDEX ix_verification_submissions_company_tier_active ON verification_submissions (company_id, tier) WHERE status NOT IN ('approved', 'rejected')"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_verification_submissions_company_tier_active")
    op.drop_index(op.f('ix_otp_records_identifier'), table_name='otp_records')
    op.drop_table('otp_records')
    op.drop_table('verification_events')
    op.drop_table('verification_documents')
    op.drop_table('verification_submissions')
    op.drop_column('companies', 'internship_description')
    op.drop_column('companies', 'rep_phone')
    op.drop_column('companies', 'rep_job_title')
    op.drop_column('companies', 'lga')
    op.drop_column('companies', 'state')
    op.drop_column('companies', 'suspension_reason')
    op.drop_column('companies', 'suspended_at')
    op.drop_column('companies', 'is_individual_verified')
    op.drop_column('companies', 'verification_method')
    op.drop_column('companies', 'tier_4_status')
    op.drop_column('companies', 'tier_3_status')
    op.drop_column('companies', 'tier_2_status')
    op.drop_column('companies', 'tier_1_status')
    op.drop_column('companies', 'trust_tier')
