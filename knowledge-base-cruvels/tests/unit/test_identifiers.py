"""Unit tests for identifier normalization, hashing, and title extraction."""

from kb_cruvels.domain.identifiers import (
    calculate_sha256,
    extract_act_identity,
    normalize_section_number,
    normalize_statutory_text,
)


def test_normalize_section_number_standard():
    assert normalize_section_number("193") == "193"
    assert normalize_section_number("Section 193") == "193"
    assert normalize_section_number("sec. 42.") == "42"
    assert normalize_section_number("  10  ") == "10"


def test_normalize_section_number_lettered():
    # Lettered sections must preserve uppercase suffix
    assert normalize_section_number("53A") == "53A"
    assert normalize_section_number("53a") == "53A"
    assert normalize_section_number("53 A") == "53A"
    assert normalize_section_number("Sec 153B") == "153B"
    assert normalize_section_number("72A") == "72A"


def test_normalize_section_number_articles_and_schedules():
    assert normalize_section_number("Article 21") == "21"
    assert normalize_section_number("Art. 21A") == "21A"
    assert normalize_section_number("Schedule 1") == "SCH-1"
    assert normalize_section_number("Schedule I") == "SCH-I"
    assert normalize_section_number("Preamble") == "PREAMBLE"


def test_calculate_sha256():
    text = "Protection of life and personal liberty."
    expected_hash = calculate_sha256(text)
    assert len(expected_hash) == 64
    assert calculate_sha256(text) == expected_hash
    # Different text yields different hash
    assert calculate_sha256("Different text") != expected_hash


def test_normalize_statutory_text():
    raw = "Section 1. \r\n“Protection of life”—no person…\u00a0"
    normalized = normalize_statutory_text(raw)
    assert "\r" not in normalized
    assert "\u00a0" not in normalized
    assert '"' in normalized


def test_extract_act_identity():
    title1, year1 = extract_act_identity("Bharatiya Nagarik Suraksha Sanhita, 2023")
    assert title1 == "Bharatiya Nagarik Suraksha Sanhita"
    assert year1 == 2023

    title2, year2 = extract_act_identity("The Indian Penal Code, 1860")
    assert title2 == "The Indian Penal Code"
    assert year2 == 1860
