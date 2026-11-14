"""Normalization pipeline preserving verbatim legal text."""

from __future__ import annotations

import re


def clean_statutory_text(raw_text: str | None) -> str:
    """
    Clean extracted text while strictly preserving all statutory wording:
    - Removes null bytes and non-printable control codes.
    - Normalizes unicode whitespace and line endings.
    - Preserves subsections, clauses, provisos, explanations, illustrations, and verbatim words.
    """
    if not raw_text:
        return ""

    text = raw_text

    # Remove null bytes and carriage returns
    text = text.replace("\x00", "").replace("\r\n", "\n").replace("\r", "\n")

    # Remove zero-width spaces and control characters (preserving tab and newline)
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f\u200b\ufeff]", "", text)

    # Normalize unicode non-breaking space
    text = text.replace("\u00a0", " ")

    # Normalize excessive consecutive blank lines (max 2 consecutive newlines)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()
