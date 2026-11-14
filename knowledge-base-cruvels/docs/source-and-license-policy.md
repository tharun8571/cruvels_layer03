# Knowledge Base Cruvels - Source and License Policy

**Document Version:** 1.0.0  
**Legal Framework:** Indian Copyright Act, 1957; Apache-2.0; Creative Commons CC BY 4.0

---

## 1. Legal Status of Underlying Statutory Text

The statutory text of Indian legislation, parliamentary enactments, state assembly acts, ordinances, government notifications, gazette publications, and subordinate rules constitutes **Government works** under **Section 17(d)** of the Indian Copyright Act, 1957.

Pursuant to **Section 52(1)(q)** of the Indian Copyright Act, 1957:
> *"The reproduction or publication of any Act of a Legislature or the rules and orders made thereunder, shall not constitute an infringement of copyright."*

Knowledge Base Cruvels asserts no proprietary copyright over the underlying statutory text of the Indian legislation contained in the canonical corpus. The public right to access, reproduce, and build upon primary legal text derives directly from the statute.

---

## 2. Upstream Source Attribution & Provenance

Knowledge Base Cruvels acquires and normalizes primary law from public compilations and official portals:

1. **Primary Upstream Normalized Corpus**:
   - **Repository**: [Open India Law (Vaquill AI)](https://github.com/Vaquill-AI/open-india-law)
   - **Dataset**: `vaquill/open-india-law` on Hugging Face (Snapshot `v2026.08`).
   - **License for Dataset Compilation & Metadata**: **Creative Commons Attribution 4.0 International (CC BY 4.0)**.
   - **Attribution Notice**: In accordance with the CC BY 4.0 license, Open India Law is acknowledged as the source compilation and normalization pipeline for the structured Parquet datasets.
2. **Primary Government Sources**:
   - **India Code**: [indiacode.nic.in](https://www.indiacode.nic.in) (Legislative Department, Ministry of Law and Justice, Government of India).
   - **Gazettes of India & State Gazettes**: Official notifications and enactment publications.
   - **Statutory Regulators**: Reserve Bank of India (RBI), Securities and Exchange Board of India (SEBI), Central Board of Indirect Taxes and Customs (CBIC), Ministry of Corporate Affairs (MCA), Telecom Regulatory Authority of India (TRAI), Insurance Regulatory and Development Authority of India (IRDAI).

---

## 3. Platform Software Licensing

- **Knowledge Base Cruvels Source Code & Tooling**: Distributed under the **Apache License, Version 2.0**.
- **Internal APIs and Integrations**: Standalone service interface designed for secure downstream consumption by Cruvels Legal AI.

---

## 4. Content Reuse, Redaction & Integrity Policy

1. **Strict Verbatim Principle**: No statutory wording may be modified, summarized, or paraphrased within the canonical storage layer.
2. **Redaction of Sensitive Private Information**: Conforms to legal non-disclosure requirements (e.g., anonymization mandated under POCSO Act or specific court orders).
3. **Auditability**: Every provision preserves its `source_url`, `snapshot_version`, `raw_hash`, and `canonical_hash`. Material discrepancies must be verified against official India Code and Gazette publications.
