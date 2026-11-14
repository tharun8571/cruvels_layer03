"""Pydantic schemas for Phase 1 entities."""

from __future__ import annotations

from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# 1. Definitions
class DefinitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    term: str
    term_normalized: str
    definition_text: str
    source_act_title: str
    source_section_number: str
    source_provision_id: str | None = None
    legal_domain: str
    related_terms: list[str] = Field(default_factory=list)
    key_cases: list[str] = Field(default_factory=list)
    canonical_hash: str


# 2. Doctrines
class DoctrineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    name_normalized: str
    latin_maxim: str | None = None
    category: str
    summary: str
    detailed_explanation: str
    constitutional_provisions: list[str] = Field(default_factory=list)
    statutory_provisions: list[dict[str, Any]] = Field(default_factory=list)
    leading_judgments: list[dict[str, Any]] = Field(default_factory=list)
    exceptions: list[str] = Field(default_factory=list)
    key_elements: list[str] = Field(default_factory=list)
    canonical_hash: str


# 3. Procedures
class ProcedureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    procedure_name: str
    category: str
    governing_act: str
    governing_sections: list[str] = Field(default_factory=list)
    forum_jurisdiction: str
    summary: str
    prerequisites: list[str] = Field(default_factory=list)
    stages: list[dict[str, Any]] = Field(default_factory=list)
    limitation_period: str | None = None
    required_documents: list[str] = Field(default_factory=list)
    common_grounds: list[str] = Field(default_factory=list)
    leading_cases: list[dict[str, Any]] = Field(default_factory=list)
    canonical_hash: str


# 4. Forms & Templates
class FormResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: str
    governing_act: str | None = None
    governing_section: str | None = None
    description: str
    fillable_fields: list[dict[str, Any]] = Field(default_factory=list)
    template_format: str
    drafting_notes: list[str] = Field(default_factory=list)
    canonical_hash: str


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    category: str
    description: str
    standard_clauses: list[str] = Field(default_factory=list)
    template_content: str
    governing_statutes: list[str] = Field(default_factory=list)
    is_vetted: bool
    canonical_hash: str


# 5. Notifications
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    notification_number: str
    issuing_authority: str
    title: str
    subject: str | None = None
    issue_date: date | None = None
    effective_date: date | None = None
    notification_type: str
    full_text: str
    summary: str | None = None
    applicable_acts: list[str] = Field(default_factory=list)
    source_url: str | None = None
    in_force: bool
    canonical_hash: str


# 6. Cross-References
class CrossReferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    source_type: str
    source_id: str
    source_label: str | None = None
    target_type: str
    target_id: str
    target_label: str | None = None
    relationship_type: str
    confidence_score: float
    description: str | None = None
