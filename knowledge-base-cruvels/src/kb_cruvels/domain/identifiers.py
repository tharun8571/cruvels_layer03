"""Identifier normalization, hashing, and resolution utilities for Indian statutes."""

from __future__ import annotations

import hashlib
import re


def normalize_section_number(raw: str | None) -> str:
    """
    Consistently normalize section identifiers while preserving lettered sections (e.g., 53A, 72A).

    Examples:
        '193' -> '193'
        '53A' -> '53A'
        '53 a' -> '53A'
        'Section 193' -> '193'
        'Sec. 153B' -> '153B'
        'Article 21' -> '21'
        'Art. 21A' -> '21A'
        'Rule 4(1)' -> '4(1)'
        'Schedule I' -> 'SCH-I'
        'Schedule 1' -> 'SCH-1'
        'Preamble' -> 'PREAMBLE'
    """
    if not raw:
        return ""

    s = raw.strip()

    # Handle Preamble
    if re.match(r"^preamble\b", s, re.IGNORECASE):
        return "PREAMBLE"

    # Handle Schedule
    sch_match = re.match(r"^(?:schedule|sched)\.?\s*([0-9a-zA-Z_\-]+)", s, re.IGNORECASE)
    if sch_match:
        return f"SCH-{sch_match.group(1).upper()}"

    # Remove leading prefix labels like 'Section', 'Sec', 'Article', 'Art', 'Rule', 'Regulation'
    cleaned = re.sub(r"^(?:section|sec|article|art|rule|reg|regulation)\.?\s*", "", s, flags=re.IGNORECASE)

    # Remove trailing periods
    cleaned = cleaned.rstrip(".")

    # Remove internal spaces between digits and suffix letters: "53 A" -> "53A"
    cleaned = re.sub(r"(\d+)\s+([A-Za-z])", r"\1\2", cleaned)

    # Convert trailing section letters to uppercase: "53a" -> "53A"
    cleaned = re.sub(r"(\d+)([a-zA-Z]+)", lambda m: f"{m.group(1)}{m.group(2).upper()}", cleaned)

    # Collapse any extraneous spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    return cleaned


def normalize_statutory_text(text: str | None) -> str:
    """
    Normalize statutory text for canonical hashing:
    - Normalizes Unicode characters (curly quotes, dashes, non-breaking spaces).
    - Normalizes line breaks and trailing whitespace.
    - Preserves verbatim words, punctuation, numbers, and case.
    """
    if not text:
        return ""

    t = text
    # Replace non-breaking spaces
    t = t.replace("\u00a0", " ").replace("\u200b", "")
    # Normalize quotes and dashes
    t = t.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    t = t.replace("—", "-").replace("–", "-")
    # Normalize line endings
    t = t.replace("\r\n", "\n").replace("\r", "\n")
    # Strip trailing whitespace on each line
    lines = [line.rstrip() for line in t.split("\n")]
    # Strip leading/trailing blank lines
    return "\n".join(lines).strip()


def calculate_sha256(content: str | bytes) -> str:
    """Calculate SHA-256 hex digest for content."""
    if isinstance(content, str):
        content = content.encode("utf-8")
    return hashlib.sha256(content).hexdigest()


def extract_act_identity(title: str, default_year: int | None = None) -> tuple[str, int | None]:
    """
    Extract standard title and enactment year from an Act title string.
    Example:
        'Bharatiya Nagarik Suraksha Sanhita, 2023' -> ('Bharatiya Nagarik Suraksha Sanhita', 2023)
        'The Indian Penal Code, 1860' -> ('The Indian Penal Code', 1860)
        'Income-tax Act, 1961' -> ('Income-tax Act', 1961)
    """
    if not title:
        return "", default_year

    s = title.strip()
    year_match = re.search(r",?\s*(?:of\s+)?\(?(1[789]\d\d|20[0-2]\d)\)?\s*$", s)
    if year_match:
        year = int(year_match.group(1))
        clean_title = s[: year_match.start()].rstrip(" ,-")
        return clean_title, year

    return s, default_year
