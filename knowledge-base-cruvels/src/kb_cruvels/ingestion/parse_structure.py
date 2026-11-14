"""Conservative structural AST parser for Indian statutory text.

Parses subsections, clauses, provisos, explanations, exceptions, and illustrations
only when explicitly supported by the text. Never invents missing hierarchy.
"""

from __future__ import annotations

import re

from kb_cruvels.domain.provisions import NodeType, ProvisionNodeDomain

# Regular expressions for Indian statutory subdivisions
RE_SUBSECTION = re.compile(r"(?:^|\n)\s*\((\d+[A-Za-z]?)\)\s+", re.MULTILINE)
RE_CLAUSE = re.compile(r"(?:^|\n)\s*\(([a-z]{1,2})\)\s+", re.MULTILINE)
RE_SUBCLAUSE = re.compile(r"(?:^|\n)\s*\(([ivxlcdm]+|[IVXLCDM]+)\)\s+", re.MULTILINE)
RE_PROVISO = re.compile(r"(?:^|\n)\s*(Provided\s+(?:further\s+|also\s+)?that\b)", re.IGNORECASE | re.MULTILINE)
RE_EXPLANATION = re.compile(r"(?:^|\n)\s*(Explanation(?:\s+\d+|\s+[I|V|X]+)?\s*[\.\:—\-])", re.IGNORECASE | re.MULTILINE)
RE_EXCEPTION = re.compile(r"(?:^|\n)\s*(Exception(?:\s+\d+|\s+[I|V|X]+)?\s*[\.\:—\-])", re.IGNORECASE | re.MULTILINE)
RE_ILLUSTRATION = re.compile(r"(?:^|\n)\s*(Illustration[s]?\s*[\.\:—\-])", re.IGNORECASE | re.MULTILINE)
RE_RECITAL = re.compile(r"(?:^|\n)\s*((?:AND\s+)?WHEREAS\b)", re.IGNORECASE | re.MULTILINE)


def parse_statutory_structure(
    provision_id: str,
    source_text: str,
) -> list[ProvisionNodeDomain]:
    """
    Conservatively parse structural AST nodes from source text.
    If no structural divisions exist or structure is ambiguous, returns an empty list
    or a single root node, preserving the complete source text in the parent provision.
    """
    if not source_text or len(source_text.strip()) == 0:
        return []

    nodes: list[ProvisionNodeDomain] = []
    text = source_text

    # Check for Subsections: (1), (2), (3)...
    matches = list(RE_SUBSECTION.finditer(text))
    if len(matches) >= 2:
        for idx, match in enumerate(matches):
            start = match.start()
            end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
            ordinal = f"({match.group(1)})"
            node_text = text[start:end].strip()
            nodes.append(
                ProvisionNodeDomain(
                    node_id=f"{provision_id}_sub_{idx}_{match.group(1)}",
                    provision_id=provision_id,
                    node_type=NodeType.SUBSECTION,
                    ordinal=ordinal,
                    text=node_text,
                    char_start=start,
                    char_end=end,
                    order_index=idx,
                )
            )
        return nodes

    # Check for Provisos
    proviso_matches = list(RE_PROVISO.finditer(text))
    if proviso_matches:
        for idx, match in enumerate(proviso_matches):
            start = match.start()
            end = proviso_matches[idx + 1].start() if idx + 1 < len(proviso_matches) else len(text)
            nodes.append(
                ProvisionNodeDomain(
                    node_id=f"{provision_id}_proviso_{idx + 1}",
                    provision_id=provision_id,
                    node_type=NodeType.PROVISO,
                    ordinal=f"Proviso {idx + 1}",
                    text=text[start:end].strip(),
                    char_start=start,
                    char_end=end,
                    order_index=idx,
                )
            )
        return nodes

    # Check for Explanations
    expl_matches = list(RE_EXPLANATION.finditer(text))
    if expl_matches:
        for idx, match in enumerate(expl_matches):
            start = match.start()
            end = expl_matches[idx + 1].start() if idx + 1 < len(expl_matches) else len(text)
            nodes.append(
                ProvisionNodeDomain(
                    node_id=f"{provision_id}_expl_{idx + 1}",
                    provision_id=provision_id,
                    node_type=NodeType.EXPLANATION,
                    ordinal=f"Explanation {idx + 1}",
                    text=text[start:end].strip(),
                    char_start=start,
                    char_end=end,
                    order_index=idx,
                )
            )
        return nodes

    # Check for Recitals (WHEREAS / AND WHEREAS clauses, common in Preambles)
    recital_matches = list(RE_RECITAL.finditer(text))
    if recital_matches:
        for idx, match in enumerate(recital_matches):
            start = match.start()
            end = recital_matches[idx + 1].start() if idx + 1 < len(recital_matches) else len(text)
            nodes.append(
                ProvisionNodeDomain(
                    node_id=f"{provision_id}_recital_{idx + 1}",
                    provision_id=provision_id,
                    node_type=NodeType.PARAGRAPH,
                    ordinal=f"Recital {idx + 1}",
                    text=text[start:end].strip(),
                    char_start=start,
                    char_end=end,
                    order_index=idx,
                )
            )
        return nodes

    return []

