from __future__ import annotations

from orion.services.stix_manager.converters.stix_minimal import convert_to_stix


def _rich_payload() -> dict:
    return {
        "m_hash": "abc123",
        "m_title": "Leak from forum",
        "m_content": "Contains IOC indicators",
        "m_important_content": "high signal",
        "m_url": "https://example.org/post/1",
        "m_base_url": "https://example.org",
        "m_weblink": ["https://example.org/post/1", "https://cdn.example.org/raw/1"],
        "m_domain": ["example.org"],
        "m_ip": ["1.2.3.4", "2001:db8::1"],
        "m_email": ["a@example.org"],
        "m_cve": ["CVE-2023-1234"],
        "m_cwe": ["CWE-79"],
        "m_team": "Threat Group",
        "m_author": "Analyst",
        "m_network": "onion",
        "m_platform": "telegram",
        "m_content_type": ["news", "leak"],
        "m_hashtag": ["#breach"],
        "m_mention": ["@actor"],
        "m_creation_date": "2026-03-01T10:00:00Z",
        "m_update_date": "2026-03-02T10:00:00Z",
    }


def test_convert_to_stix_builds_rich_bundle():
    out = convert_to_stix("leak", _rich_payload())

    assert out["type"] == "bundle"
    types = [obj["type"] for obj in out["objects"]]
    assert "report" in types
    assert "indicator" in types
    assert "vulnerability" in types
    assert "observed-data" in types
    assert "note" in types
    assert "relationship" in types


def test_convert_to_stix_all_kinds_return_bundle():
    payload = _rich_payload()
    for kind in ["general", "leak", "defacement", "exploit", "chat", "social"]:
        out = convert_to_stix(kind, payload)
        assert out["type"] == "bundle"
        assert out["objects"]


def test_convert_to_stix_handles_sparse_payload():
    out = convert_to_stix(
        "general",
        {
            "m_title": "Untitled",
            "m_url": "https://example.org",
            "m_creation_date": "bad-date",
            "m_update_date": "bad-date",
            "m_cve": ["INVALID", "CVE-2024-1111"],
            "m_cwe": ["CWE-89"],
            "m_ip": ["", None, "5.6.7.8"],
            "m_email": ["x@example.org", ""],
        },
    )

    report = next(obj for obj in out["objects"] if obj["type"] == "report")
    assert report["name"] == "Untitled"
    assert report["external_references"]

    vuln_names = [obj["name"] for obj in out["objects"] if obj["type"] == "vulnerability"]
    assert "CVE-2024-1111" in vuln_names
    assert "CWE-89" in vuln_names
