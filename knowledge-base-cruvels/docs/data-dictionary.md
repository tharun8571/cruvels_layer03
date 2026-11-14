# Knowledge Base Cruvels - Data Dictionary

**Document Version:** 1.0.0  
**Target Schema:** Canonical PostgreSQL Schema (`kb_cruvels`)

---

## 1. Table: `legal_instruments`
Stores legal enactments, Acts of Parliament, State Assemblies, Regulations, and the Constitution.

| Column | Type | Nullable | Description | Source Mapping |
|---|---|---|---|---|
| `id` | `VARCHAR(64)` | **NO** | Deterministic Primary Key (`inst_<hash>`). | Derived from jurisdiction, state, title, and year. |
| `source_act_id` | `VARCHAR(255)` | **NO** | Upstream source identifier. | `act_id` from Open India Law. |
| `title` | `TEXT` | **NO** | Official full title of the statute/regulation. | `title` |
| `short_title` | `VARCHAR(512)` | YES | Short title without enactment year suffix. | Derived via `extract_act_identity`. |
| `year` | `INTEGER` | YES | Enactment year (e.g., `2023`, `1860`). | `year` |
| `act_number` | `VARCHAR(128)` | YES | Official Act Number (e.g. `Act No. 46 of 2023`). | `act_number` |
| `instrument_type` | `VARCHAR(64)` | **NO** | `legislation`, `regulation`, `ordinance`, `rules`, `constitution`. | Repaired from upstream taxonomy. |
| `jurisdiction` | `VARCHAR(64)` | **NO** | Jurisdiction tier: `central`, `state`, `union_territory`. | `jurisdiction` / `state` |
| `state_or_ut` | `VARCHAR(64)` | YES | State or UT slug (e.g., `maharashtra`, `kerala`). | `state` |
| `status` | `VARCHAR(64)` | **NO** | Enforceability status: `in_force`, `repealed`, `spent`, `superseded`. | `act_status` |
| `in_force` | `BOOLEAN` | **NO** | Active enforceability flag (`true` / `false`). | `in_force` |
| `doc_type` | `VARCHAR(64)` | YES | Document taxonomy classification. | `doc_type` |
| `legal_subject` | `VARCHAR(255)` | YES | Legal subject area (e.g. `Criminal Law`, `Taxation`). | `legal_subject` |
| `department` | `VARCHAR(255)` | YES | Ministry or Government Department. | `department` |
| `regulatory_body` | `VARCHAR(255)` | YES | Regulator name if applicable (e.g., `RBI`, `SEBI`). | `regulatory_body` |
| `source_url` | `TEXT` | YES | Upstream source URL. | `source_url` |
| `snapshot_version` | `VARCHAR(64)` | **NO** | Dataset snapshot release tag (e.g. `v2026.08`). | Ingestion config. |
| `extra_metadata` | `JSON` | YES | Preserves all unmapped upstream payload keys. | Raw unmapped fields. |
| `created_at` | `TIMESTAMP` | **NO** | UTC record creation timestamp. | System generated. |
| `updated_at` | `TIMESTAMP` | **NO** | UTC record last updated timestamp. | System generated. |

---

## 2. Table: `statutory_provisions`
Stores section-level and article-level statutory provisions.

| Column | Type | Nullable | Description | Source Mapping |
|---|---|---|---|---|
| `id` | `VARCHAR(64)` | **NO** | Deterministic Primary Key (`prov_<hash>`). | Derived from `instrument_id` + `section_number_norm`. |
| `instrument_id` | `VARCHAR(64)` | **NO** | Foreign Key -> `legal_instruments.id` (ON DELETE CASCADE). | Relational linkage. |
| `source_chunk_id`| `VARCHAR(255)` | YES | Upstream vector/chunk identifier. | `chunk_id` |
| `section_number` | `VARCHAR(64)` | **NO** | Raw section number string from source. | `section_number` |
| `section_number_norm`| `VARCHAR(64)` | **NO** | Normalized section number (`193`, `53A`, `72A`, `SCH-1`). | `normalize_section_number()`. |
| `section_title` | `TEXT` | YES | Section heading/title. | `section_title` |
| `chapter` | `VARCHAR(255)` | YES | Chapter number and title. | `chapter` |
| `part` | `VARCHAR(255)` | YES | Part number and title. | `part` |
| `provision_type`| `VARCHAR(64)` | **NO** | `section`, `article`, `rule`, `regulation`, `schedule`, `preamble`. | Derived taxonomy. |
| `source_text` | `TEXT` | **NO** | Exact verbatim text from source material. | `text` |
| `canonical_text`| `TEXT` | **NO** | Canonical normalized statutory text. | Normalized text. |
| `raw_hash` | `VARCHAR(64)` | **NO** | SHA-256 hash of `source_text`. | Recalculated. |
| `canonical_hash`| `VARCHAR(64)` | **NO** | SHA-256 hash of `canonical_text`. | Recalculated. |
| `status` | `VARCHAR(64)` | **NO** | Provision status (`in_force`, `repealed`, `omitted`). | `section_status` / `act_status`. |
| `in_force` | `BOOLEAN` | **NO** | Provision in force flag. | `in_force`. |
| `has_proviso` | `BOOLEAN` | **NO** | Contains provisos. | `has_proviso`. |
| `has_non_obstante`| `BOOLEAN` | **NO** | Contains non-obstante clauses. | `has_non_obstante`. |
| `acts_referenced`| `JSON` | YES | List of cross-referenced statutes. | `acts_referenced`. |
| `defined_terms` | `JSON` | YES | List of terms defined within this provision. | `defined_terms`. |
| `amendment_count`| `INTEGER` | **NO** | Count of recorded historical amendments. | `amendment_count`. |
| `source_url` | `TEXT` | YES | Direct statutory URL. | `source_url`. |
| `snapshot_version`| `VARCHAR(64)` | **NO** | Snapshot tag (`v2026.08`). | System config. |

---

## 3. Table: `provision_nodes`
Stores conservative AST subdivisions (subsections, clauses, provisos, explanations).

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `VARCHAR(64)` | **NO** | Primary Key (`<provision_id>_<type>_<ordinal>`). |
| `provision_id` | `VARCHAR(64)` | **NO** | Foreign Key -> `statutory_provisions.id`. |
| `parent_node_id` | `VARCHAR(64)` | YES | Foreign Key -> `provision_nodes.id` for nested clauses. |
| `node_type` | `VARCHAR(64)` | **NO** | `subsection`, `clause`, `subclause`, `proviso`, `explanation`. |
| `ordinal` | `VARCHAR(64)` | **NO** | Ordinal identifier (e.g. `(1)`, `(a)`, `Proviso 1`). |
| `text` | `TEXT` | **NO** | Verbatim text slice for this structural node. |
| `char_start` | `INTEGER` | YES | Starting character offset in `source_text`. |
| `char_end` | `INTEGER` | YES | Ending character offset in `source_text`. |
| `order_index` | `INTEGER` | **NO** | Positional sequence index within provision. |

---

## 4. Table: `source_artifacts`
Tracks raw partition files, sizes, SHA-256 hashes, and verification timestamps.

| Column | Type | Description |
|---|---|---|
| `id` | `VARCHAR(64)` | Primary Key. |
| `filename` | `VARCHAR(255)` | Unique filename (e.g. `in_central_legislation.parquet`). |
| `jurisdiction` | `VARCHAR(64)` | Jurisdiction category (`central`, `state`, `union_territory`). |
| `record_type` | `VARCHAR(64)` | `legislation` or `regulation`. |
| `file_size_bytes`| `BIGINT` | Raw file byte length. |
| `record_count` | `INTEGER` | Number of rows contained. |
| `sha256_hash` | `VARCHAR(64)` | SHA-256 checksum of raw file. |
| `source_url` | `TEXT` | Remote download URL. |
| `is_verified` | `BOOLEAN` | True if verified against upstream manifest. |

---

## 5. Table: `ingestion_runs` & `ingestion_checkpoints`
Tracks durable execution state, progress, and batch commitments.
