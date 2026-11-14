"""Initial schema for Knowledge Base Cruvels.

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-09 12:30:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '001_initial_schema'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. legal_instruments table
    op.create_table(
        'legal_instruments',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('source_act_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('short_title', sa.String(length=512), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('act_number', sa.String(length=128), nullable=True),
        sa.Column('instrument_type', sa.String(length=64), nullable=False),
        sa.Column('jurisdiction', sa.String(length=64), nullable=False),
        sa.Column('state_or_ut', sa.String(length=64), nullable=True),
        sa.Column('status', sa.String(length=64), nullable=False),
        sa.Column('in_force', sa.Boolean(), nullable=False),
        sa.Column('doc_type', sa.String(length=64), nullable=True),
        sa.Column('legal_subject', sa.String(length=255), nullable=True),
        sa.Column('department', sa.String(length=255), nullable=True),
        sa.Column('regulatory_body', sa.String(length=255), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('snapshot_version', sa.String(length=64), nullable=False),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_legal_instruments_id', 'legal_instruments', ['id'])
    op.create_index('ix_legal_instruments_source_act_id', 'legal_instruments', ['source_act_id'])
    op.create_index('ix_legal_instruments_title', 'legal_instruments', ['title'])
    op.create_index('ix_legal_instruments_year', 'legal_instruments', ['year'])
    op.create_index('ix_legal_instruments_jurisdiction', 'legal_instruments', ['jurisdiction'])
    op.create_index('ix_legal_instruments_state_or_ut', 'legal_instruments', ['state_or_ut'])
    op.create_index('ix_legal_instruments_status', 'legal_instruments', ['status'])
    op.create_index('ix_legal_instruments_in_force', 'legal_instruments', ['in_force'])
    op.create_index('ix_instruments_jurisdiction_year', 'legal_instruments', ['jurisdiction', 'year'])
    op.create_index('ix_instruments_state_title', 'legal_instruments', ['state_or_ut', 'title'])

    # 2. statutory_provisions table
    op.create_table(
        'statutory_provisions',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('instrument_id', sa.String(length=64), nullable=False),
        sa.Column('source_chunk_id', sa.String(length=255), nullable=True),
        sa.Column('section_number', sa.String(length=64), nullable=False),
        sa.Column('section_number_norm', sa.String(length=64), nullable=False),
        sa.Column('section_title', sa.Text(), nullable=True),
        sa.Column('chapter', sa.String(length=255), nullable=True),
        sa.Column('part', sa.String(length=255), nullable=True),
        sa.Column('provision_type', sa.String(length=64), nullable=False),
        sa.Column('source_text', sa.Text(), nullable=False),
        sa.Column('canonical_text', sa.Text(), nullable=False),
        sa.Column('raw_hash', sa.String(length=64), nullable=False),
        sa.Column('canonical_hash', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=64), nullable=False),
        sa.Column('in_force', sa.Boolean(), nullable=False),
        sa.Column('has_proviso', sa.Boolean(), nullable=False),
        sa.Column('has_non_obstante', sa.Boolean(), nullable=False),
        sa.Column('acts_referenced', sa.JSON(), nullable=True),
        sa.Column('defined_terms', sa.JSON(), nullable=True),
        sa.Column('amendment_count', sa.Integer(), nullable=False),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('snapshot_version', sa.String(length=64), nullable=False),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['instrument_id'], ['legal_instruments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('instrument_id', 'section_number_norm', name='uq_instrument_section_norm')
    )
    op.create_index('ix_statutory_provisions_id', 'statutory_provisions', ['id'])
    op.create_index('ix_statutory_provisions_instrument_id', 'statutory_provisions', ['instrument_id'])
    op.create_index('ix_statutory_provisions_section_number_norm', 'statutory_provisions', ['section_number_norm'])
    op.create_index('ix_statutory_provisions_raw_hash', 'statutory_provisions', ['raw_hash'])
    op.create_index('ix_statutory_provisions_canonical_hash', 'statutory_provisions', ['canonical_hash'])
    op.create_index('ix_statutory_provisions_status', 'statutory_provisions', ['status'])
    op.create_index('ix_statutory_provisions_in_force', 'statutory_provisions', ['in_force'])
    op.create_index('ix_provisions_inst_sec', 'statutory_provisions', ['instrument_id', 'section_number_norm'])
    op.create_index('ix_provisions_status_in_force', 'statutory_provisions', ['status', 'in_force'])

    # 3. provision_nodes table
    op.create_table(
        'provision_nodes',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('provision_id', sa.String(length=64), nullable=False),
        sa.Column('parent_node_id', sa.String(length=64), nullable=True),
        sa.Column('node_type', sa.String(length=64), nullable=False),
        sa.Column('ordinal', sa.String(length=64), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('char_start', sa.Integer(), nullable=True),
        sa.Column('char_end', sa.Integer(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['parent_node_id'], ['provision_nodes.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['provision_id'], ['statutory_provisions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_provision_nodes_id', 'provision_nodes', ['id'])
    op.create_index('ix_provision_nodes_provision_id', 'provision_nodes', ['provision_id'])
    op.create_index('ix_provision_nodes_prov_order', 'provision_nodes', ['provision_id', 'order_index'])

    # 4. source_artifacts table
    op.create_table(
        'source_artifacts',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('publisher', sa.String(length=128), nullable=False),
        sa.Column('snapshot_version', sa.String(length=64), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('jurisdiction', sa.String(length=64), nullable=False),
        sa.Column('record_type', sa.String(length=64), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('record_count', sa.Integer(), nullable=False),
        sa.Column('sha256_hash', sa.String(length=64), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=False),
        sa.Column('license_spdx', sa.String(length=64), nullable=False),
        sa.Column('downloaded_at', sa.DateTime(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('filename')
    )
    op.create_index('ix_source_artifacts_id', 'source_artifacts', ['id'])
    op.create_index('ix_source_artifacts_filename', 'source_artifacts', ['filename'])
    op.create_index('ix_source_artifacts_jurisdiction', 'source_artifacts', ['jurisdiction'])

    # 5. ingestion_runs table
    op.create_table(
        'ingestion_runs',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('snapshot_version', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('total_files', sa.Integer(), nullable=False),
        sa.Column('files_completed', sa.Integer(), nullable=False),
        sa.Column('records_processed', sa.BigInteger(), nullable=False),
        sa.Column('records_committed', sa.BigInteger(), nullable=False),
        sa.Column('records_quarantined', sa.BigInteger(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ingestion_runs_id', 'ingestion_runs', ['id'])
    op.create_index('ix_ingestion_runs_status', 'ingestion_runs', ['status'])

    # 6. ingestion_checkpoints table
    op.create_table(
        'ingestion_checkpoints',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('run_id', sa.String(length=64), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('jurisdiction', sa.String(length=64), nullable=False),
        sa.Column('batch_index', sa.Integer(), nullable=False),
        sa.Column('records_in_batch', sa.Integer(), nullable=False),
        sa.Column('records_committed_cumulative', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('last_processed_chunk_id', sa.String(length=255), nullable=True),
        sa.Column('checkpoint_data', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['run_id'], ['ingestion_runs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ingestion_checkpoints_id', 'ingestion_checkpoints', ['id'])
    op.create_index('ix_ingestion_checkpoints_run_id', 'ingestion_checkpoints', ['run_id'])
    op.create_index('ix_ingestion_checkpoints_filename', 'ingestion_checkpoints', ['filename'])
    op.create_index('ix_checkpoints_run_file', 'ingestion_checkpoints', ['run_id', 'filename'])

    # 7. provision_versions table
    op.create_table(
        'provision_versions',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('provision_id', sa.String(length=64), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('amendment_act_id', sa.String(length=255), nullable=True),
        sa.Column('amendment_title', sa.Text(), nullable=True),
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_to', sa.Date(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=False),
        sa.Column('version_text', sa.Text(), nullable=False),
        sa.Column('canonical_hash', sa.String(length=64), nullable=False),
        sa.Column('change_note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['provision_id'], ['statutory_provisions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_provision_versions_id', 'provision_versions', ['id'])
    op.create_index('ix_provision_versions_provision_id', 'provision_versions', ['provision_id'])
    op.create_index('ix_prov_versions_prov_num', 'provision_versions', ['provision_id', 'version_number'])


def downgrade() -> None:
    op.drop_table('provision_versions')
    op.drop_table('ingestion_checkpoints')
    op.drop_table('ingestion_runs')
    op.drop_table('source_artifacts')
    op.drop_table('provision_nodes')
    op.drop_table('statutory_provisions')
    op.drop_table('legal_instruments')
