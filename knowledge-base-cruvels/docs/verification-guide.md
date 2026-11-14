# Knowledge Base Cruvels - Verification & Integrity Guide

**Document Version:** 1.0.0  
**Target Subsystem:** `src/kb_cruvels/verification/` & `tests/integrity/`

---

## 1. Principles of Verification

A passing schema test does **not** establish that a statutory section contains the actual law it claims to represent. 

Knowledge Base Cruvels distinguishes four separate levels of verification:
1. **Source Content Present**: Raw bytes exist and row is parseable.
2. **Cryptographic Integrity**: Stored SHA-256 hash matches fresh hash recalculation from database bytes.
3. **Structural Fidelity**: Conservative AST parsing (subsections, provisos, explanations) reflects the real statutory text without fabricated nodes.
4. **Substantive Accuracy**: Random sample provisions are cross-checked against official India Code, Gazette, or Ministry publications.

---

## 2. Cryptographic Text Integrity Audits

The verification subsystem recalculates SHA-256 hashes directly from stored strings:

```bash
kb-cruvels audit integrity --sample 5000
# Or via script:
python scripts/audit_corpus.py
```

### Audit Metrics
- `total_provisions_audited`: Number of rows inspected.
- `hash_parity_percentage`: Must be **100.0%**.
- `mismatches_count`: Must be **0**.
- `empty_text_count`: Must be **0**.

---

## 3. Synthetic Content & Hallucination Audits

To ensure zero synthetic text exists in the database, `audit_synthetic_content` scans provisions for placeholder signatures (`[insert section here]`, `lorem ipsum`, `as an ai`, `here is a summary`):

```bash
kb-cruvels audit synthetic
```

---

## 4. Source Reconciliation & Coverage Reporting

Knowledge Base Cruvels never presents a single deceptive "100% complete" claim. Instead, reconciliation metrics distinguish:
- **Discovered upstream rows** (from `source_manifest.json`)
- **Staged records** (in `data/staging/`)
- **Committed database records** (in `statutory_provisions`)
- **Quarantined records** (in `data/quarantine/`)

```bash
kb-cruvels audit reconcile
```
