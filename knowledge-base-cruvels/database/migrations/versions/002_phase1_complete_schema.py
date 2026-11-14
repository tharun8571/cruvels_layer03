"""Phase 1 Complete Schema: Judgments, Definitions, Doctrines, Procedures, Forms, Templates, Notifications, Cross References.

Revision ID: 002_phase1_complete_schema
Revises: 001_initial_schema
Create Date: 2026-10-09 23:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_phase1_complete_schema'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. court_judgments
    op.create_table(
        'court_judgments',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('case_title', sa.Text(), nullable=False),
        sa.Column('citation', sa.String(255), nullable=False, unique=True),
        sa.Column('alternate_citations', sa.JSON(), nullable=True),
        sa.Column('court', sa.String(128), nullable=False),
        sa.Column('court_type', sa.String(64), nullable=False, server_default='supreme_court'),
        sa.Column('decision_date', sa.Date(), nullable=True),
        sa.Column('decision_year', sa.Integer(), nullable=True),
        sa.Column('bench', sa.JSON(), nullable=True),
        sa.Column('coram_size', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('parties', sa.JSON(), nullable=True),
        sa.Column('subject_area', sa.String(128), nullable=False),
        sa.Column('legal_issue', sa.Text(), nullable=True),
        sa.Column('ratio_decidendi', sa.Text(), nullable=False),
        sa.Column('full_text', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('statutes_cited', sa.JSON(), nullable=True),
        sa.Column('sections_cited', sa.JSON(), nullable=True),
        sa.Column('doctrines_applied', sa.JSON(), nullable=True),
        sa.Column('overruled_cases', sa.JSON(), nullable=True),
        sa.Column('followed_cases', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(64), nullable=False, server_default='good_law'),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('snapshot_version', sa.String(64), nullable=False, server_default='v2026.08'),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_judgments_id', 'court_judgments', ['id'])
    op.create_index('ix_judgments_citation', 'court_judgments', ['citation'])
    op.create_index('ix_judgments_court', 'court_judgments', ['court'])
    op.create_index('ix_judgments_court_type', 'court_judgments', ['court_type'])
    op.create_index('ix_judgments_decision_date', 'court_judgments', ['decision_date'])
    op.create_index('ix_judgments_decision_year', 'court_judgments', ['decision_year'])
    op.create_index('ix_judgments_subject_area', 'court_judgments', ['subject_area'])
    op.create_index('ix_judgments_status', 'court_judgments', ['status'])
    op.create_index('ix_judgments_canonical_hash', 'court_judgments', ['canonical_hash'])
    op.create_index('ix_judgments_court_year', 'court_judgments', ['court', 'decision_year'])
    op.create_index('ix_judgments_subject_status', 'court_judgments', ['subject_area', 'status'])

    # 2. legal_definitions
    op.create_table(
        'legal_definitions',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('term', sa.String(255), nullable=False),
        sa.Column('term_normalized', sa.String(255), nullable=False),
        sa.Column('definition_text', sa.Text(), nullable=False),
        sa.Column('source_act_title', sa.String(255), nullable=False),
        sa.Column('source_section_number', sa.String(64), nullable=False),
        sa.Column('source_provision_id', sa.String(64), sa.ForeignKey('statutory_provisions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('legal_domain', sa.String(128), nullable=False, server_default='general'),
        sa.Column('related_terms', sa.JSON(), nullable=True),
        sa.Column('key_cases', sa.JSON(), nullable=True),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_definitions_id', 'legal_definitions', ['id'])
    op.create_index('ix_definitions_term', 'legal_definitions', ['term'])
    op.create_index('ix_definitions_term_norm', 'legal_definitions', ['term_normalized'])
    op.create_index('ix_definitions_source_act', 'legal_definitions', ['source_act_title'])
    op.create_index('ix_definitions_source_sec', 'legal_definitions', ['source_section_number'])
    op.create_index('ix_definitions_source_prov', 'legal_definitions', ['source_provision_id'])
    op.create_index('ix_definitions_domain', 'legal_definitions', ['legal_domain'])
    op.create_index('ix_definitions_hash', 'legal_definitions', ['canonical_hash'])
    op.create_index('ix_definitions_term_domain', 'legal_definitions', ['term_normalized', 'legal_domain'])
    op.create_index('ix_definitions_act_sec', 'legal_definitions', ['source_act_title', 'source_section_number'])

    # 3. legal_doctrines
    op.create_table(
        'legal_doctrines',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('name_normalized', sa.String(255), nullable=False),
        sa.Column('latin_maxim', sa.String(255), nullable=True),
        sa.Column('category', sa.String(128), nullable=False, server_default='general'),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('detailed_explanation', sa.Text(), nullable=False),
        sa.Column('constitutional_provisions', sa.JSON(), nullable=True),
        sa.Column('statutory_provisions', sa.JSON(), nullable=True),
        sa.Column('leading_judgments', sa.JSON(), nullable=True),
        sa.Column('exceptions', sa.JSON(), nullable=True),
        sa.Column('key_elements', sa.JSON(), nullable=True),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_doctrines_id', 'legal_doctrines', ['id'])
    op.create_index('ix_doctrines_name', 'legal_doctrines', ['name'])
    op.create_index('ix_doctrines_name_norm', 'legal_doctrines', ['name_normalized'])
    op.create_index('ix_doctrines_category', 'legal_doctrines', ['category'])
    op.create_index('ix_doctrines_hash', 'legal_doctrines', ['canonical_hash'])

    # 4. legal_procedures
    op.create_table(
        'legal_procedures',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('procedure_name', sa.String(255), nullable=False, unique=True),
        sa.Column('category', sa.String(128), nullable=False),
        sa.Column('governing_act', sa.String(255), nullable=False),
        sa.Column('governing_sections', sa.JSON(), nullable=True),
        sa.Column('forum_jurisdiction', sa.String(255), nullable=False),
        sa.Column('summary', sa.Text(), nullable=False),
        sa.Column('prerequisites', sa.JSON(), nullable=True),
        sa.Column('stages', sa.JSON(), nullable=True),
        sa.Column('limitation_period', sa.String(255), nullable=True),
        sa.Column('required_documents', sa.JSON(), nullable=True),
        sa.Column('common_grounds', sa.JSON(), nullable=True),
        sa.Column('leading_cases', sa.JSON(), nullable=True),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_procedures_id', 'legal_procedures', ['id'])
    op.create_index('ix_procedures_name', 'legal_procedures', ['procedure_name'])
    op.create_index('ix_procedures_cat', 'legal_procedures', ['category'])
    op.create_index('ix_procedures_category_forum', 'legal_procedures', ['category', 'forum_jurisdiction'])

    # 5. legal_forms
    op.create_table(
        'legal_forms',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False, unique=True),
        sa.Column('category', sa.String(128), nullable=False),
        sa.Column('governing_act', sa.String(255), nullable=True),
        sa.Column('governing_section', sa.String(128), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('fillable_fields', sa.JSON(), nullable=True),
        sa.Column('template_format', sa.Text(), nullable=False),
        sa.Column('drafting_notes', sa.JSON(), nullable=True),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_forms_id', 'legal_forms', ['id'])
    op.create_index('ix_forms_title', 'legal_forms', ['title'])
    op.create_index('ix_forms_category', 'legal_forms', ['category'])

    # 6. document_templates
    op.create_table(
        'document_templates',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False, unique=True),
        sa.Column('category', sa.String(128), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('standard_clauses', sa.JSON(), nullable=True),
        sa.Column('template_content', sa.Text(), nullable=False),
        sa.Column('governing_statutes', sa.JSON(), nullable=True),
        sa.Column('is_vetted', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_templates_id', 'document_templates', ['id'])
    op.create_index('ix_templates_title', 'document_templates', ['title'])
    op.create_index('ix_templates_category', 'document_templates', ['category'])

    # 7. government_notifications
    op.create_table(
        'government_notifications',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('notification_number', sa.String(255), nullable=False),
        sa.Column('issuing_authority', sa.String(128), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('subject', sa.String(255), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('notification_type', sa.String(64), nullable=False, server_default='circular'),
        sa.Column('full_text', sa.Text(), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('applicable_acts', sa.JSON(), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('in_force', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('canonical_hash', sa.String(64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_notifications_id', 'government_notifications', ['id'])
    op.create_index('ix_notifications_num', 'government_notifications', ['notification_number'])
    op.create_index('ix_notifications_auth', 'government_notifications', ['issuing_authority'])
    op.create_index('ix_notifications_type', 'government_notifications', ['notification_type'])
    op.create_index('ix_notifications_authority_date', 'government_notifications', ['issuing_authority', 'issue_date'])

    # 8. cross_reference_links
    op.create_table(
        'cross_reference_links',
        sa.Column('id', sa.String(64), primary_key=True),
        sa.Column('source_type', sa.String(64), nullable=False),
        sa.Column('source_id', sa.String(64), nullable=False),
        sa.Column('source_label', sa.String(255), nullable=True),
        sa.Column('target_type', sa.String(64), nullable=False),
        sa.Column('target_id', sa.String(64), nullable=False),
        sa.Column('target_label', sa.String(255), nullable=True),
        sa.Column('relationship_type', sa.String(64), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_crossref_id', 'cross_reference_links', ['id'])
    op.create_index('ix_crossref_source', 'cross_reference_links', ['source_type', 'source_id'])
    op.create_index('ix_crossref_target', 'cross_reference_links', ['target_type', 'target_id'])
    op.create_index('ix_crossref_rel', 'cross_reference_links', ['relationship_type'])


def downgrade() -> None:
    op.drop_table('cross_reference_links')
    op.drop_table('government_notifications')
    op.drop_table('document_templates')
    op.drop_table('legal_forms')
    op.drop_table('legal_procedures')
    op.drop_table('legal_doctrines')
    op.drop_table('legal_definitions')
    op.drop_table('court_judgments')
