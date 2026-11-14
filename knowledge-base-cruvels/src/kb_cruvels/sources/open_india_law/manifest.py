"""Upstream Manifest generation and inventory for Open India Law corpus."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from kb_cruvels.core.config import settings

#: Inventory of all 37 published legislation files with verified sizes and record metrics
LEGISLATION_INVENTORY = [
    {"file": "in_central_legislation.parquet", "jurisdiction": "central", "state": None, "size_mb": 25.29, "expected_rows": 628863, "instruments": 13720},
    {"file": "in_west-bengal_legislation.parquet", "jurisdiction": "state", "state": "west-bengal", "size_mb": 10.95, "expected_rows": 32238, "instruments": 715},
    {"file": "in_maharashtra_legislation.parquet", "jurisdiction": "state", "state": "maharashtra", "size_mb": 8.69, "expected_rows": 30271, "instruments": 379},
    {"file": "in_karnataka_legislation.parquet", "jurisdiction": "state", "state": "karnataka", "size_mb": 7.17, "expected_rows": 29485, "instruments": 279},
    {"file": "in_rajasthan_legislation.parquet", "jurisdiction": "state", "state": "rajasthan", "size_mb": 7.68, "expected_rows": 26759, "instruments": 383},
    {"file": "in_chhattisgarh_legislation.parquet", "jurisdiction": "state", "state": "chhattisgarh", "size_mb": 11.88, "expected_rows": 25368, "instruments": 359},
    {"file": "in_chandigarh_legislation.parquet", "jurisdiction": "union_territory", "state": "chandigarh", "size_mb": 7.45, "expected_rows": 21805, "instruments": 256},
    {"file": "in_kerala_legislation.parquet", "jurisdiction": "state", "state": "kerala", "size_mb": 5.71, "expected_rows": 19164, "instruments": 322},
    {"file": "in_punjab_legislation.parquet", "jurisdiction": "state", "state": "punjab", "size_mb": 6.41, "expected_rows": 18037, "instruments": 303},
    {"file": "in_madhya-pradesh_legislation.parquet", "jurisdiction": "state", "state": "madhya-pradesh", "size_mb": 6.61, "expected_rows": 17477, "instruments": 216},
    {"file": "in_telangana_legislation.parquet", "jurisdiction": "state", "state": "telangana", "size_mb": 3.92, "expected_rows": 16785, "instruments": 259},
    {"file": "in_dadra-nagar-haveli_legislation.parquet", "jurisdiction": "union_territory", "state": "dadra-nagar-haveli", "size_mb": 4.85, "expected_rows": 15619, "instruments": 186},
    {"file": "in_tamil-nadu_legislation.parquet", "jurisdiction": "state", "state": "tamil-nadu", "size_mb": 5.11, "expected_rows": 15524, "instruments": 308},
    {"file": "in_goa_legislation.parquet", "jurisdiction": "state", "state": "goa", "size_mb": 3.91, "expected_rows": 14539, "instruments": 212},
    {"file": "in_uttar-pradesh_legislation.parquet", "jurisdiction": "state", "state": "uttar-pradesh", "size_mb": 3.98, "expected_rows": 14308, "instruments": 338},
    {"file": "in_gujarat_legislation.parquet", "jurisdiction": "state", "state": "gujarat", "size_mb": 4.17, "expected_rows": 12868, "instruments": 226},
    {"file": "in_assam_legislation.parquet", "jurisdiction": "state", "state": "assam", "size_mb": 4.82, "expected_rows": 12429, "instruments": 987},
    {"file": "in_andhra-pradesh_legislation.parquet", "jurisdiction": "state", "state": "andhra-pradesh", "size_mb": 2.67, "expected_rows": 12264, "instruments": 189},
    {"file": "in_haryana_legislation.parquet", "jurisdiction": "state", "state": "haryana", "size_mb": 4.16, "expected_rows": 11787, "instruments": 204},
    {"file": "in_odisha_legislation.parquet", "jurisdiction": "state", "state": "odisha", "size_mb": 3.93, "expected_rows": 11370, "instruments": 282},
    {"file": "in_bihar_legislation.parquet", "jurisdiction": "state", "state": "bihar", "size_mb": 3.69, "expected_rows": 10910, "instruments": 298},
    {"file": "in_jharkhand_legislation.parquet", "jurisdiction": "state", "state": "jharkhand", "size_mb": 4.06, "expected_rows": 10831, "instruments": 194},
    {"file": "in_himachal-pradesh_legislation.parquet", "jurisdiction": "state", "state": "himachal-pradesh", "size_mb": 2.67, "expected_rows": 10765, "instruments": 178},
    {"file": "in_uttarakhand_legislation.parquet", "jurisdiction": "state", "state": "uttarakhand", "size_mb": 3.86, "expected_rows": 10531, "instruments": 244},
    {"file": "in_jammu-kashmir_legislation.parquet", "jurisdiction": "union_territory", "state": "jammu-kashmir", "size_mb": 2.08, "expected_rows": 9223, "instruments": 156},
    {"file": "in_tripura_legislation.parquet", "jurisdiction": "state", "state": "tripura", "size_mb": 2.57, "expected_rows": 8070, "instruments": 142},
    {"file": "in_delhi_legislation.parquet", "jurisdiction": "union_territory", "state": "delhi", "size_mb": 2.88, "expected_rows": 8006, "instruments": 164},
    {"file": "in_puducherry_legislation.parquet", "jurisdiction": "union_territory", "state": "puducherry", "size_mb": 1.74, "expected_rows": 7117, "instruments": 118},
    {"file": "in_arunachal-pradesh_legislation.parquet", "jurisdiction": "state", "state": "arunachal-pradesh", "size_mb": 2.11, "expected_rows": 6996, "instruments": 112},
    {"file": "in_meghalaya_legislation.parquet", "jurisdiction": "state", "state": "meghalaya", "size_mb": 1.12, "expected_rows": 5550, "instruments": 96},
    {"file": "in_nagaland_legislation.parquet", "jurisdiction": "state", "state": "nagaland", "size_mb": 1.61, "expected_rows": 4861, "instruments": 84},
    {"file": "in_andaman-nicobar_legislation.parquet", "jurisdiction": "union_territory", "state": "andaman-nicobar", "size_mb": 1.50, "expected_rows": 4626, "instruments": 72},
    {"file": "in_manipur_legislation.parquet", "jurisdiction": "state", "state": "manipur", "size_mb": 1.92, "expected_rows": 4560, "instruments": 81},
    {"file": "in_sikkim_legislation.parquet", "jurisdiction": "state", "state": "sikkim", "size_mb": 2.13, "expected_rows": 4266, "instruments": 76},
    {"file": "in_ladakh_legislation.parquet", "jurisdiction": "union_territory", "state": "ladakh", "size_mb": 0.67, "expected_rows": 3119, "instruments": 42},
    {"file": "in_mizoram_legislation.parquet", "jurisdiction": "state", "state": "mizoram", "size_mb": 0.59, "expected_rows": 2015, "instruments": 38},
    {"file": "in_lakshadweep_legislation.parquet", "jurisdiction": "union_territory", "state": "lakshadweep", "size_mb": 0.08, "expected_rows": 171, "instruments": 12},
]

#: Inventory of 12 published regulatory files
REGULATIONS_INVENTORY = [
    {"file": "in_cbic_regulations.parquet", "agency": "CBIC", "size_mb": 1.38},
    {"file": "in_cpcb_regulations.parquet", "agency": "CPCB", "size_mb": 4.37},
    {"file": "in_dfs_regulations.parquet", "agency": "DFS", "size_mb": 7.87},
    {"file": "in_dgft_regulations.parquet", "agency": "DGFT", "size_mb": 1.28},
    {"file": "in_irdai_regulations.parquet", "agency": "IRDAI", "size_mb": 7.25},
    {"file": "in_law-commission_regulations.parquet", "agency": "Law Commission", "size_mb": 39.19},
    {"file": "in_mca_regulations.parquet", "agency": "MCA", "size_mb": 17.86},
    {"file": "in_moefcc_regulations.parquet", "agency": "MOEFCC", "size_mb": 38.23},
    {"file": "in_rbi_regulations.parquet", "agency": "RBI", "size_mb": 44.27},
    {"file": "in_sebi_regulations.parquet", "agency": "SEBI", "size_mb": 31.83},
    {"file": "in_state-gst_regulations.parquet", "agency": "State GST", "size_mb": 13.32},
    {"file": "in_trai_regulations.parquet", "agency": "TRAI", "size_mb": 8.33},
]


def build_manifest_data(snapshot_version: str = "v2026.08") -> dict[str, Any]:
    """Generate complete source manifest object based on verified upstream inspection."""
    base_download_url = f"https://huggingface.co/datasets/{settings.UPSTREAM_HF_DATASET}/resolve/main"

    files_list = []
    total_size_mb = 0.0
    total_provisions = 0
    total_instruments = 0

    for item in LEGISLATION_INVENTORY:
        total_size_mb += item["size_mb"]
        total_provisions += item["expected_rows"]
        total_instruments += item["instruments"]
        files_list.append({
            "filename": item["file"],
            "jurisdiction": item["jurisdiction"],
            "state_or_ut": item["state"],
            "record_type": "legislation",
            "size_mb": item["size_mb"],
            "expected_rows": item["expected_rows"],
            "expected_instruments": item["instruments"],
            "download_url": f"{base_download_url}/{item['file']}",
            "license": "CC-BY-4.0",
        })

    regulations_list = []
    total_reg_size_mb = 0.0
    for reg in REGULATIONS_INVENTORY:
        total_reg_size_mb += reg["size_mb"]
        regulations_list.append({
            "filename": reg["file"],
            "agency": reg["agency"],
            "record_type": "regulation",
            "size_mb": reg["size_mb"],
            "download_url": f"{base_download_url}/{reg['file']}",
            "license": "CC-BY-4.0",
        })

    manifest = {
        "manifest_version": "1.0.0",
        "upstream_repository": "https://github.com/Vaquill-AI/open-india-law",
        "upstream_dataset": f"https://huggingface.co/datasets/{settings.UPSTREAM_HF_DATASET}",
        "snapshot_version": snapshot_version,
        "snapshot_commit": settings.UPSTREAM_COMMIT,
        "publication_date": "2026-08-26",
        "licensing": {
            "application_code": "Apache-2.0",
            "dataset_compilation": "CC-BY-4.0",
            "underlying_statutory_text": "Government work under s.17(d) and s.52(1)(q) of Indian Copyright Act 1957",
        },
        "summary": {
            "total_legislation_files": len(LEGISLATION_INVENTORY),
            "total_legislation_size_mb": round(total_size_mb, 2),
            "total_legislation_size_gb": round(total_size_mb / 1024, 2),
            "total_expected_provisions": total_provisions,
            "total_expected_instruments": total_instruments,
            "total_regulation_files": len(REGULATIONS_INVENTORY),
            "total_regulation_size_mb": round(total_reg_size_mb, 2),
        },
        "legislation_files": files_list,
        "regulation_files": regulations_list,
    }
    return manifest


def save_source_manifest(output_path: Path | None = None) -> Path:
    """Write verified source manifest to data/manifests/source_manifest.json."""
    path = output_path or (settings.manifests_dir / "source_manifest.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest_data(settings.UPSTREAM_SNAPSHOT)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    return path
