# Knowledge Base Cruvels (KB-Cruvels)

**Standalone Indian Legal Knowledge Platform**

Knowledge Base Cruvels is a production-grade, standalone Indian legal knowledge platform designed to acquire, normalize, validate, index, and serve verbatim Central, State, and Union Territory statutory legislation and subordinate regulations across India.

---

## 🏛️ Mission & Principles

1. **Independent & Production-Oriented**: Built as an autonomous legal data platform with its own PostgreSQL canonical database, migrations, streaming ingestion, verification subsystem, and versioned REST API (`/v1`).
2. **Absolute Content Integrity**: Every provision contains genuine statutory wording directly from source material. Legal text is **never synthesized, hallucinated, or approximated by an LLM**.
3. **Multi-Jurisdiction Provenance**: Full provenance tracking across Central legislation, 28 States, 8 Union Territories, and statutory regulatory bodies.
4. **Dual Retrieval Engine**:
   - **Exact Statutory Resolution**: High-precision retrieval by Act identity, jurisdiction, chapter, and normalized section identifier (e.g. `193`, `53A`, `72A`).
   - **Full-Text Search (FTS)**: Lexical indexing with PostgreSQL `tsvector` and GIN indexing for legal phrase and subject queries.
5. **Zero Data in Git**: Strict segregation between code/manifests and immutable raw datasets, staging batches, and exports.

---

## 📐 Architecture Overview

```
Official Sources (India Code, Gazettes, Regulators) + Open India Law Published Corpus
                                      │
                                      ▼
                      Immutable Raw Archive (data/raw/)
                                      │
                                      ▼
                     Normalized Staging (data/staging/)
                                      │
                         Validation & Hash Audit
                                      │
                                      ▼
                  PostgreSQL Canonical Database (kb_cruvels)
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
     Exact Section Lookup                         Full-Text Search (GIN/tsvector)
               └──────────────────────┬──────────────────────┘
                                      ▼
                        Versioned REST API (/v1)
                                      │
                                      ▼
                   Cruvels Legal AI Integration Layer
```

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.11+ (Python 3.12 or 3.13 recommended)
- PostgreSQL 15+ (running locally or via Docker)
- Docker & Docker Compose (optional for containerized setup)

### 2. Installation

```bash
# Clone and enter directory
cd "knowledge base cruvels"

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install package and dependencies
pip install -e ".[dev]"
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure your PostgreSQL database URL:

```bash
cp .env.example .env
# Edit .env to set your DATABASE_URL, e.g.:
# DATABASE_URL=postgresql+psycopg2://localhost:5432/kb_cruvels
```

### 4. Database Initialization & Migrations

```bash
# Apply database migrations
alembic upgrade head
# Or use the CLI
kb-cruvels db migrate
```

### 5. Running the Retrieval API

```bash
# Run FastAPI server
kb-cruvels api serve --host 0.0.0.0 --port 8000
# Or directly via uvicorn
uvicorn kb_cruvels.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive documentation is available at `http://localhost:8000/docs`.

---

## 🛠️ CLI Operations & Ingestion

Knowledge Base Cruvels includes a unified command-line tool `kb-cruvels`:

```bash
# 1. Inspect upstream source snapshot and generate manifest
kb-cruvels dataset inspect
kb-cruvels dataset manifest --output data/manifests/source_manifest.json

# 2. Ingest legislation (Central, State, or specific jurisdiction)
kb-cruvels ingest run --jurisdiction central --batch-size 1000
kb-cruvels ingest run --file data/raw/open-india-law/v2026.08/in_central_legislation.parquet

# 3. Resume interrupted ingestion
kb-cruvels ingest resume

# 4. Audit corpus integrity and calculate hash metrics
kb-cruvels audit integrity
kb-cruvels audit reconcile

# 5. Search provisions via CLI
kb-cruvels search resolve --act "Bharatiya Nagarik Suraksha Sanhita, 2023" --section "193"
kb-cruvels search query "police investigation report" --jurisdiction central
```

---

## 📚 Documentation Index

- [Architecture & Data Flow](docs/architecture.md)
- [Canonical Data Dictionary](docs/data-dictionary.md)
- [Source & License Policy](docs/source-and-license-policy.md)
- [Ingestion Guide & Checkpoint Model](docs/ingestion-guide.md)
- [Database Setup & Migrations Guide](docs/database-guide.md)
- [Operations & Runbook](docs/operations-runbook.md)
- [Verification & Integrity Guide](docs/verification-guide.md)
- [API Integration Contract](docs/integration-contract.md)

---

## ⚖️ Licensing & Attribution

- **Application Code & Tools**: Apache-2.0 License.
- **Dataset Compilation & Normalization**: CC BY 4.0 (Open India Law / Vaquill AI). Prominent source attribution is preserved on all records.
- **Underlying Statutory Text**: Government of India works under Section 17(d) and Section 52(1)(q) of the Indian Copyright Act, 1957.
