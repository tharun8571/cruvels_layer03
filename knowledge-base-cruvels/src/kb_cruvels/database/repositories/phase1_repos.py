"""Repositories for Phase 1 entities: Doctrines, Definitions, Procedures, Templates, Notifications, and Cross-References."""

from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from kb_cruvels.database.models.cross_references import CrossReferenceLink
from kb_cruvels.database.models.definitions import LegalDefinition
from kb_cruvels.database.models.doctrines import LegalDoctrine
from kb_cruvels.database.models.notifications import GovernmentNotification
from kb_cruvels.database.models.procedures import LegalProcedure
from kb_cruvels.database.models.templates import DocumentTemplate, LegalForm


class DoctrineRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, doctrine_id: str) -> LegalDoctrine | None:
        return self.session.query(LegalDoctrine).filter(LegalDoctrine.id == doctrine_id).first()

    def get_by_name(self, name: str) -> LegalDoctrine | None:
        norm = name.strip().lower()
        return self.session.query(LegalDoctrine).filter(
            or_(
                LegalDoctrine.name.ilike(name),
                LegalDoctrine.name_normalized == norm,
            )
        ).first()

    def search(self, query: str | None = None, category: str | None = None, limit: int = 20) -> tuple[list[LegalDoctrine], int]:
        q = self.session.query(LegalDoctrine)
        if category:
            q = q.filter(LegalDoctrine.category.ilike(f"%{category}%"))
        if query:
            pattern = f"%{query}%"
            q = q.filter(
                or_(
                    LegalDoctrine.name.ilike(pattern),
                    LegalDoctrine.latin_maxim.ilike(pattern),
                    LegalDoctrine.summary.ilike(pattern),
                    LegalDoctrine.detailed_explanation.ilike(pattern),
                )
            )
        total = q.count()
        return q.order_by(LegalDoctrine.name.asc()).limit(limit).all(), total

    def upsert(self, doc: LegalDoctrine) -> LegalDoctrine:
        existing = self.get_by_name(doc.name)
        if existing:
            for attr in ["name_normalized", "latin_maxim", "category", "summary", "detailed_explanation", "constitutional_provisions", "statutory_provisions", "leading_judgments", "exceptions", "key_elements", "canonical_hash"]:
                setattr(existing, attr, getattr(doc, attr))
            self.session.flush()
            return existing
        self.session.add(doc)
        self.session.flush()
        return doc


class DefinitionRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, def_id: str) -> LegalDefinition | None:
        return self.session.query(LegalDefinition).filter(LegalDefinition.id == def_id).first()

    def get_by_term(self, term: str, act_title: str | None = None) -> list[LegalDefinition]:
        norm = term.strip().lower()
        q = self.session.query(LegalDefinition).filter(LegalDefinition.term_normalized == norm)
        if act_title:
            q = q.filter(LegalDefinition.source_act_title.ilike(f"%{act_title}%"))
        return q.all()

    def search(self, query: str | None = None, domain: str | None = None, act_title: str | None = None, limit: int = 50) -> tuple[list[LegalDefinition], int]:
        q = self.session.query(LegalDefinition)
        if domain:
            q = q.filter(LegalDefinition.legal_domain.ilike(f"%{domain}%"))
        if act_title:
            q = q.filter(LegalDefinition.source_act_title.ilike(f"%{act_title}%"))
        if query:
            pattern = f"%{query}%"
            q = q.filter(
                or_(
                    LegalDefinition.term.ilike(pattern),
                    LegalDefinition.definition_text.ilike(pattern),
                )
            )
        total = q.count()
        return q.order_by(LegalDefinition.term.asc()).limit(limit).all(), total

    def upsert(self, d: LegalDefinition) -> LegalDefinition:
        existing = self.session.query(LegalDefinition).filter(
            LegalDefinition.term_normalized == d.term_normalized,
            LegalDefinition.source_act_title == d.source_act_title,
            LegalDefinition.source_section_number == d.source_section_number,
        ).first()
        if existing:
            existing.definition_text = d.definition_text
            existing.source_provision_id = d.source_provision_id
            existing.legal_domain = d.legal_domain
            existing.related_terms = d.related_terms
            existing.key_cases = d.key_cases
            existing.canonical_hash = d.canonical_hash
            self.session.flush()
            return existing
        self.session.add(d)
        self.session.flush()
        return d


class ProcedureRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, proc_id: str) -> LegalProcedure | None:
        return self.session.query(LegalProcedure).filter(LegalProcedure.id == proc_id).first()

    def get_by_name(self, name: str) -> LegalProcedure | None:
        return self.session.query(LegalProcedure).filter(LegalProcedure.procedure_name.ilike(name)).first()

    def list_all(self, category: str | None = None) -> list[LegalProcedure]:
        q = self.session.query(LegalProcedure)
        if category:
            q = q.filter(LegalProcedure.category.ilike(f"%{category}%"))
        return q.order_by(LegalProcedure.procedure_name.asc()).all()

    def upsert(self, p: LegalProcedure) -> LegalProcedure:
        existing = self.get_by_name(p.procedure_name)
        if existing:
            for attr in ["category", "governing_act", "governing_sections", "forum_jurisdiction", "summary", "prerequisites", "stages", "limitation_period", "required_documents", "common_grounds", "leading_cases", "canonical_hash"]:
                setattr(existing, attr, getattr(p, attr))
            self.session.flush()
            return existing
        self.session.add(p)
        self.session.flush()
        return p


class TemplateRepository:
    def __init__(self, session: Session):
        self.session = session

    # Forms
    def get_form_by_id(self, form_id: str) -> LegalForm | None:
        return self.session.query(LegalForm).filter(LegalForm.id == form_id).first()

    def list_forms(self, category: str | None = None) -> list[LegalForm]:
        q = self.session.query(LegalForm)
        if category:
            q = q.filter(LegalForm.category.ilike(f"%{category}%"))
        return q.order_by(LegalForm.title.asc()).all()

    def upsert_form(self, f: LegalForm) -> LegalForm:
        existing = self.session.query(LegalForm).filter(LegalForm.title.ilike(f.title)).first()
        if existing:
            for attr in ["category", "governing_act", "governing_section", "description", "fillable_fields", "template_format", "drafting_notes", "canonical_hash"]:
                setattr(existing, attr, getattr(f, attr))
            self.session.flush()
            return existing
        self.session.add(f)
        self.session.flush()
        return f

    # Templates
    def get_template_by_id(self, template_id: str) -> DocumentTemplate | None:
        return self.session.query(DocumentTemplate).filter(DocumentTemplate.id == template_id).first()

    def list_templates(self, category: str | None = None) -> list[DocumentTemplate]:
        q = self.session.query(DocumentTemplate)
        if category:
            q = q.filter(DocumentTemplate.category.ilike(f"%{category}%"))
        return q.order_by(DocumentTemplate.title.asc()).all()

    def upsert_template(self, t: DocumentTemplate) -> DocumentTemplate:
        existing = self.session.query(DocumentTemplate).filter(DocumentTemplate.title.ilike(t.title)).first()
        if existing:
            for attr in ["category", "description", "standard_clauses", "template_content", "governing_statutes", "is_vetted", "canonical_hash"]:
                setattr(existing, attr, getattr(t, attr))
            self.session.flush()
            return existing
        self.session.add(t)
        self.session.flush()
        return t


class NotificationRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, notif_id: str) -> GovernmentNotification | None:
        return self.session.query(GovernmentNotification).filter(GovernmentNotification.id == notif_id).first()

    def search(self, authority: str | None = None, query: str | None = None, limit: int = 50) -> tuple[list[GovernmentNotification], int]:
        q = self.session.query(GovernmentNotification)
        if authority:
            q = q.filter(GovernmentNotification.issuing_authority.ilike(f"%{authority}%"))
        if query:
            pattern = f"%{query}%"
            q = q.filter(
                or_(
                    GovernmentNotification.title.ilike(pattern),
                    GovernmentNotification.notification_number.ilike(pattern),
                    GovernmentNotification.full_text.ilike(pattern),
                )
            )
        total = q.count()
        return q.order_by(GovernmentNotification.issue_date.desc().nullslast()).limit(limit).all(), total

    def upsert(self, n: GovernmentNotification) -> GovernmentNotification:
        existing = self.session.query(GovernmentNotification).filter(
            GovernmentNotification.notification_number == n.notification_number,
            GovernmentNotification.issuing_authority == n.issuing_authority,
        ).first()
        if existing:
            for attr in ["title", "subject", "issue_date", "effective_date", "notification_type", "full_text", "summary", "applicable_acts", "source_url", "in_force", "canonical_hash"]:
                setattr(existing, attr, getattr(n, attr))
            self.session.flush()
            return existing
        self.session.add(n)
        self.session.flush()
        return n


class CrossReferenceRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_links_for_source(self, source_type: str, source_id: str) -> list[CrossReferenceLink]:
        return self.session.query(CrossReferenceLink).filter(
            CrossReferenceLink.source_type == source_type,
            CrossReferenceLink.source_id == source_id,
        ).all()

    def get_links_for_target(self, target_type: str, target_id: str) -> list[CrossReferenceLink]:
        return self.session.query(CrossReferenceLink).filter(
            CrossReferenceLink.target_type == target_type,
            CrossReferenceLink.target_id == target_id,
        ).all()

    def search_links(self, source_type: str | None = None, target_type: str | None = None, rel_type: str | None = None) -> list[CrossReferenceLink]:
        q = self.session.query(CrossReferenceLink)
        if source_type:
            q = q.filter(CrossReferenceLink.source_type == source_type)
        if target_type:
            q = q.filter(CrossReferenceLink.target_type == target_type)
        if rel_type:
            q = q.filter(CrossReferenceLink.relationship_type == rel_type)
        return q.limit(100).all()

    def add_link(self, link: CrossReferenceLink) -> CrossReferenceLink:
        existing = self.session.query(CrossReferenceLink).filter(
            CrossReferenceLink.source_type == link.source_type,
            CrossReferenceLink.source_id == link.source_id,
            CrossReferenceLink.target_type == link.target_type,
            CrossReferenceLink.target_id == link.target_id,
            CrossReferenceLink.relationship_type == link.relationship_type,
        ).first()
        if existing:
            return existing
        self.session.add(link)
        self.session.flush()
        return link

    def upsert(self, link: CrossReferenceLink) -> CrossReferenceLink:
        return self.add_link(link)
