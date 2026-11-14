"""Unit tests for conservative structural AST parser."""

from kb_cruvels.domain.provisions import NodeType
from kb_cruvels.ingestion.parse_structure import parse_statutory_structure


def test_parse_statutory_structure_subsections():
    text = (
        "(1) Every investigation shall be completed without delay.\n\n"
        "(2) As soon as it is completed, report shall be forwarded.\n\n"
        "(3) The police officer shall state if accused was arrested."
    )
    nodes = parse_statutory_structure("prov_123", text)
    assert len(nodes) == 3
    assert nodes[0].node_type == NodeType.SUBSECTION
    assert nodes[0].ordinal == "(1)"
    assert "(1) Every investigation" in nodes[0].text
    assert nodes[1].ordinal == "(2)"
    assert nodes[2].ordinal == "(3)"


def test_parse_statutory_structure_proviso():
    text = (
        "No person shall be detained without grounds.\n\n"
        "Provided that such person may be detained if order is issued.\n\n"
        "Provided further that detention period shall not exceed 30 days."
    )
    nodes = parse_statutory_structure("prov_456", text)
    assert len(nodes) == 2
    assert nodes[0].node_type == NodeType.PROVISO
    assert nodes[0].ordinal == "Proviso 1"
    assert nodes[1].ordinal == "Proviso 2"


def test_parse_statutory_structure_conservative_fallback():
    # Plain unstructured text should not fabricate fake nodes
    unstructured_text = "The High Court may call for and examine the record of any proceeding."
    nodes = parse_statutory_structure("prov_789", unstructured_text)
    assert len(nodes) == 0  # No artificial hierarchy invented
