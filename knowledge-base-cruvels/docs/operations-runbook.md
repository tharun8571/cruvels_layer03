# Knowledge Base Cruvels - Operations Runbook

**Document Version:** 1.0.0  
**Target Operations:** Deployment, Startup, Maintenance, Monitoring, and Disaster Recovery

---

## 1. Service Startup & Shutdown

### Local Development / Server Startup
```bash
# Activate virtual environment
source .venv/bin/activate

# Apply migrations
kb-cruvels db migrate

# Start FastAPI Retrieval API server
kb-cruvels api serve --host 0.0.0.0 --port 8000
```

### Containerized Deployment (Docker Compose)
```bash
# Start PostgreSQL and API service in background
docker compose up -d

# Check container logs
docker compose logs -f api

# Stop all containers
docker compose down
```

---

## 2. Health Monitoring & Observability

### Health Check Endpoint
```bash
curl http://localhost:8000/health
```
Response:
```json
{
  "status": "healthy",
  "database_connected": true,
  "version": "0.1.0",
  "snapshot_version": "v2026.08"
}
```

### Corpus Statistics Endpoint
```bash
curl http://localhost:8000/v1/metadata/stats
```

---

## 3. Regular Maintenance & Ingestion Workflow

1. **Check Manifest Status**:
   ```bash
   kb-cruvels dataset inspect
   ```
2. **Execute Ingestion Run**:
   ```bash
   kb-cruvels ingest run --jurisdiction central --batch-size 1000
   ```
3. **Execute Integrity Audit**:
   ```bash
   kb-cruvels audit integrity --sample 5000
   kb-cruvels audit synthetic
   kb-cruvels audit reconcile
   ```
4. **Export Canonical Snapshot**:
   ```bash
   python scripts/export_records.py --jurisdiction central
   ```

---

## 4. Disaster Recovery & Rollback

1. If a bad snapshot was imported:
   - Identify the `snapshot_version` or `run_id`.
   - Revert via migration or delete by `snapshot_version` in a transaction.
2. In case of database crash:
   - Restore PostgreSQL dump using `pg_restore`.
   - Re-run `kb-cruvels audit integrity` to verify zero data corruption.
