# Knowledge Base Cruvels - Integration Contract (Phase 1 Complete)

**Document Version:** 1.1.0  
**Target Consumer:** Cruvels Legal AI Application (Future Integration Boundary)  
**Protocol:** REST / JSON over HTTP(S)  
**Base Path:** `/v1`

---

## 1. Architectural Boundary & Guarantees

Knowledge Base Cruvels is an independent, standalone legal data service. It is **not** a submodule of Cruvels Legal AI.

### Guarantees
1. **Verbatim Law**: All statutory text returned from `/v1/provisions/resolve` is authentic primary law, never LLM-summarized or synthesized.
2. **Deterministic Identifiers**: Section resolution by `(act, section)` is deterministic.
3. **Immutability of Hashes**: The `canonical_hash` allows downstream clients to verify content integrity and implement client-side caching.
4. **Complete Phase-1 Coverage**: Covers Constitution, Core Statutes, Legacy Laws, Landmark Judgments, Legal Doctrines, Definitions, Procedures, Forms, Templates, Notifications, and Cross-References.
5. **Idempotent Versioning**: Breaking changes will be introduced only in superseding API paths (e.g. `/v2`).

---

## 2. Authentication

For initial standalone deployments, read-only endpoints are accessible with optional `X-API-Key` headers:
```http
GET /v1/provisions/resolve?act=Bharatiya+Nagarik+Suraksha+Sanhita,+2023&section=193 HTTP/1.1
Host: kb-cruvels.internal:8000
X-API-Key: <cruvels_internal_token>
```

---

## 3. Endpoints & Schemas Summary

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Health** | `/health` | `GET` | System and PostgreSQL connectivity status |
| **Statutes & Acts** | `/v1/instruments` | `GET` | List all 9,844 Acts & Instruments |
| **Section Resolution** | `/v1/provisions/resolve` | `GET` | Exact section retrieval (`act`, `section`) |
| **Statutory Search** | `/v1/search/legislation` | `GET` | Full-text lexical search across 203k provisions |
| **Landmark Judgments** | `/v1/judgments` | `GET` | Search & filter Supreme Court / High Court cases |
| **Judgment Details** | `/v1/judgments/{id_or_citation}` | `GET` | Full ratio decidendi, bench, cited sections |
| **Legal Doctrines** | `/v1/doctrines` | `GET` | Fundamental doctrines (*Natural Justice*, *Res Judicata*, *Basic Structure*) |
| **Legal Definitions** | `/v1/definitions` | `GET` | Structured statutory dictionary linked to Act/Section |
| **Legal Procedures** | `/v1/procedures` | `GET` | Step-by-step statutory workflows (Bail, Writs, Civil Suit) |
| **Legal Forms** | `/v1/forms` | `GET` | Court petition formats (Bail, Cheque Bounce Notice) |
| **Contract Templates** | `/v1/templates` | `GET` | Vetted drafting agreements (NDA, Employment, Lease) |
| **Notifications** | `/v1/notifications` | `GET` | Official directions (CERT-In, RBI, SEBI) |
| **Cross-References** | `/v1/cross-references` | `GET` | Bidirectional semantic linkage graph |

---

## 4. Example Responses

### A. Exact Statutory Provision Resolution
`GET /v1/provisions/resolve?act=Bharatiya%20Nagarik%20Suraksha%20Sanhita&section=193`
```json
{
  "id": "prov_6789e272e7c817b2",
  "instrument_id": "inst_3745fc1edaa28662",
  "section_number": "193",
  "section_number_norm": "193",
  "section_title": "Report of police officer on completion of investigation",
  "chapter": "CHAPTER XII - INFORMATION TO THE POLICE AND THEIR POWERS TO INVESTIGATE",
  "status": "in_force",
  "in_force": true,
  "canonical_hash": "99a821ab79d231e6ea2aa8cd2082c673901c8b41dd73c1ebecbc2efee3b1e14d",
  "source_text": "(1) Every investigation under this Chapter shall be completed without unnecessary delay...",
  "acts_referenced": ["Bharatiya Nyaya Sanhita, 2023"],
  "defined_terms": ["police report", "investigation", "Magistrate"],
  "nodes": [
    {
      "id": "prov_6789e272e7c817b2_sub_1",
      "node_type": "subsection",
      "ordinal": "(1)",
      "text": "(1) Every investigation under this Chapter shall be completed without unnecessary delay."
    }
  ]
}
```

### B. Landmark Judgment Retrieval
`GET /v1/judgments/(1973)%204%20SCC%20225`
```json
{
  "id": "jdg_kesavananda_bharati_1973",
  "case_title": "Kesavananda Bharati Sripadagalvaru and Ors. v. State of Kerala and Anr.",
  "citation": "(1973) 4 SCC 225",
  "court": "Supreme Court of India",
  "decision_year": 1973,
  "coram_size": 13,
  "subject_area": "Constitutional Law",
  "ratio_decidendi": "Parliament has the power to amend any part of the Constitution under Article 368, including Fundamental Rights, but cannot alter or destroy the 'Basic Structure' or essential framework of the Constitution.",
  "doctrines_applied": ["Basic Structure Doctrine", "Constitutional Supremacy", "Judicial Review"],
  "statutes_cited": ["Constitution of India"]
}
```
