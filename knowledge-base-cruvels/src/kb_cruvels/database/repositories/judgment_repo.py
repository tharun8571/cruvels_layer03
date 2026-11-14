"""CourtJudgment repository for querying landmark case law."""

from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import Session

from kb_cruvels.database.models.judgments import CourtJudgment


class JudgmentRepository:
    """Data access layer for Supreme Court and High Court judgments."""

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, judgment_id: str) -> CourtJudgment | None:
        return self.session.query(CourtJudgment).filter(CourtJudgment.id == judgment_id).first()

    def get_by_citation(self, citation: str) -> CourtJudgment | None:
        return self.session.query(CourtJudgment).filter(CourtJudgment.citation == citation).first()

    def search_judgments(
        self,
        query: str | None = None,
        subject_area: str | None = None,
        court: str | None = None,
        statute: str | None = None,
        section: str | None = None,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[CourtJudgment], int]:
        """Search judgments with multi-field filtering."""
        q = self.session.query(CourtJudgment)

        if subject_area:
            q = q.filter(CourtJudgment.subject_area.ilike(f"%{subject_area}%"))
        if court:
            q = q.filter(CourtJudgment.court.ilike(f"%{court}%"))
        if status:
            q = q.filter(CourtJudgment.status == status)

        if query:
            terms = query.strip().split()
            for t in terms:
                pattern = f"%{t}%"
                q = q.filter(
                    or_(
                        CourtJudgment.case_title.ilike(pattern),
                        CourtJudgment.citation.ilike(pattern),
                        CourtJudgment.legal_issue.ilike(pattern),
                        CourtJudgment.ratio_decidendi.ilike(pattern),
                        CourtJudgment.full_text.ilike(pattern),
                    )
                )

        total = q.count()
        results = q.order_by(CourtJudgment.decision_year.desc().nullslast()).offset(offset).limit(limit).all()
        return results, total

    def upsert_judgment(self, judgment: CourtJudgment) -> CourtJudgment:
        existing = self.get_by_id(judgment.id) or self.get_by_citation(judgment.citation)
        if existing:
            for attr in [
                "case_title", "court", "court_type", "decision_date", "decision_year",
                "bench", "coram_size", "parties", "subject_area", "legal_issue",
                "ratio_decidendi", "full_text", "summary", "statutes_cited",
                "sections_cited", "doctrines_applied", "overruled_cases", "followed_cases",
                "status", "canonical_hash", "extra_metadata",
            ]:
                setattr(existing, attr, getattr(judgment, attr))
            self.session.flush()
            return existing
        else:
            self.session.add(judgment)
            self.session.flush()
            return judgment

    def upsert(self, judgment: CourtJudgment) -> CourtJudgment:
        return self.upsert_judgment(judgment)
