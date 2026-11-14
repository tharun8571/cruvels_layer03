# Knowledge Base Cruvels - Database Guide

**Document Version:** 1.0.0  
**Database Engine:** PostgreSQL 15+ / 16  
**Default Database Name:** `kb_cruvels`

---

## 1. Setup & Connection

Knowledge Base Cruvels utilizes PostgreSQL as its production-grade canonical data store.

### Configuration (`.env`)
```bash
# Production PostgreSQL Connection:
DATABASE_URL=postgresql+psycopg2://<user>:<password>@localhost:5432/kb_cruvels
```

### PostgreSQL Initialization
```bash
# Create database
createdb kb_cruvels
# Apply all schema migrations
alembic -c database/alembic.ini upgrade head
# Or using the CLI:
kb-cruvels db migrate
```

---

## 2. Table Schemas & Compound Indexes

### `legal_instruments`
- **Primary Key**: `id` (VARCHAR(64))
- **Compound Indexes**:
  - `ix_instruments_jurisdiction_year` on `(jurisdiction, year)`
  - `ix_instruments_state_title` on `(state_or_ut, title)`
  - B-Tree index on `source_act_id` and `title`

### `statutory_provisions`
- **Primary Key**: `id` (VARCHAR(64))
- **Foreign Key**: `instrument_id` references `legal_instruments(id)` with `ON DELETE CASCADE`
- **Unique Constraint**: `uq_instrument_section_norm` on `(instrument_id, section_number_norm)`
- **Compound Indexes**:
  - `ix_provisions_inst_sec` on `(instrument_id, section_number_norm)`
  - `ix_provisions_status_in_force` on `(status, in_force)`
  - B-Tree index on `canonical_hash` and `raw_hash`

### `provision_nodes`
- **Foreign Key**: `provision_id` references `statutory_provisions(id)` with `ON DELETE CASCADE`
- **Self-referencing Foreign Key**: `parent_node_id` references `provision_nodes(id)`
- **Index**: `(provision_id, order_index)`

---

## 3. Database Migrations Workflow (Alembic)

Migrations are maintained under `database/migrations/`:
```bash
# Generate a new migration revision
alembic -c database/alembic.ini revision --autogenerate -m "add_new_feature"

# Upgrade database to latest HEAD
alembic -c database/alembic.ini upgrade head

# Rollback one revision
alembic -c database/alembic.ini downgrade -1
```

---

## 4. Backup & Restore Procedures

### Database Backup
```bash
pg_dump -Fc -h localhost -U <user> kb_cruvels > data/exports/kb_cruvels_backup_$(date +%Y%m%d).dump
```

### Database Restore
```bash
pg_restore -d kb_cruvels -c data/exports/kb_cruvels_backup_20261009.dump
```
