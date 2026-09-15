from __future__ import annotations

from orion.management.jobs.alert.result_mappers import (
    DynamicResultMapper,
    ElasticsearchResultMapper,
    RawFindingSanitizer,
    ResultMetadataMapper,
    ScanResultMapper,
    VulnerabilityScanResultMapper,
)


def test_raw_finding_sanitizer_drops_hidden_keys_and_empties():
    value = {
        "_id": "x",
        "hash": "abc",
        "keep": "value",
        "empty": "",
        "none": None,
        "list": [],
        "nested": {"m_content": "hide", "good": "v", "blank": ""},
    }
    cleaned = RawFindingSanitizer.clean(value)
    assert cleaned == {"keep": "value", "nested": {"good": "v"}}


def test_raw_finding_sanitizer_cleans_lists_and_scalars():
    assert RawFindingSanitizer.clean([{"m_hash": "x"}, {"good": "v"}, "", None]) == [{"good": "v"}]
    assert RawFindingSanitizer.clean("plain") == "plain"
    assert RawFindingSanitizer.clean(5) == 5


def test_get_additional_result_keys_filters_excluded_and_empty():
    result = {
        "m_hash": "hidden",
        "keep": "v",
        "none": None,
        "empty_list": [],
        "blank": "   ",
        "num": 3,
    }
    keys = ResultMetadataMapper.get_additional_result_keys(result)
    assert ("keep", "v") in keys
    assert ("num", 3) in keys
    assert all(key != "m_hash" for key, _ in keys)
    assert all(key not in ("none", "empty_list", "blank") for key, _ in keys)


def test_all_iocs_for_result_lists_scalars_and_lists():
    result = {"emails": ["a@b.com", "c@d.com"], "note": "text"}
    iocs = ResultMetadataMapper.all_iocs_for_result(result, "domain", "example.com")
    assert iocs[0].name == "domain"
    assert iocs[0].values == ["example.com"]
    names = {ioc.name: ioc.values for ioc in iocs}
    assert names["emails"] == ["a@b.com", "c@d.com"]
    assert names["note"] == ["text"]


def test_elasticsearch_to_alert_payload_default_branch():
    result = {
        "m_hash": "hash-1",
        "m_content_type": ["leak"],
        "m_title": "Title",
        "m_content": "Body",
        "m_url": ["http://a"],
        "m_network": "darkweb",
        "extra": "meta",
    }
    payload = ElasticsearchResultMapper.to_alert_payload("leak", "domain", "example.com", result)
    assert payload["title"] == "Title"
    assert payload["description"] == "Body"
    assert payload["url"] == "http://a"
    assert payload["source"] == "darkweb"
    assert payload["data_hash"] == "hash-1"
    assert payload["content_types"] == ["leak"]


def test_elasticsearch_to_alert_payload_defacement_uses_team():
    result = {"m_team": "TeamX", "m_content": "c"}
    payload = ElasticsearchResultMapper.to_alert_payload("defacement", "url", "http://x", result)
    assert payload["title"] == "TeamX"


def test_elasticsearch_stealerlogs_username_password():
    result = {
        "type": "credential",
        "email": ["a@b.com"],
        "username": ["user1"],
        "password": "secret",
        "channel": "chan",
    }
    payload = ElasticsearchResultMapper.to_alert_payload("stealerlogs", "email", "a@b.com", result)
    assert payload["title"] == "user1"
    assert payload["description"] == "secret"
    assert payload["source"] == "chan"


def test_elasticsearch_stealerlogs_raw_with_colon():
    result = {"type": "credential", "email": ["a@b.com"], "raw": "http://host:pass123"}
    payload = ElasticsearchResultMapper.to_alert_payload("email-breach", "email", "a@b.com", result)
    assert payload["title"] == "host"
    assert payload["description"] == "pass123"


def test_elasticsearch_stealerlogs_raw_without_colon():
    result = {"type": "credential", "email": ["a@b.com"], "raw": "hostonly"}
    payload = ElasticsearchResultMapper.to_alert_payload("stealerlogs", "email", "a@b.com", result)
    assert payload["title"] == "hostonly"
    assert payload["description"] == "-"


def test_elasticsearch_stealerlogs_no_raw_no_creds():
    result = {"type": "credential", "email": ["a@b.com"]}
    payload = ElasticsearchResultMapper.to_alert_payload("stealerlogs", "email", "a@b.com", result)
    assert payload["title"] == "-"
    assert payload["description"] == "-"


def test_elasticsearch_default_description_dash_and_domain_url():
    result = {"domain": "fallback.com"}
    payload = ElasticsearchResultMapper.to_alert_payload("leak", "domain", "d", result)
    assert payload["description"] == "-"
    assert payload["url"] == "fallback.com"
    assert payload["source"] == "-"


def test_scan_result_mapper_normalize_risk_variants():
    assert ScanResultMapper._normalize_risk("info") == "Informational"
    assert ScanResultMapper._normalize_risk("HIGH") == "High"
    assert ScanResultMapper._normalize_risk("") == ""
    assert ScanResultMapper._normalize_risk("n/a") == ""
    assert ScanResultMapper._normalize_risk("Custom") == "Custom"


def test_scan_result_mapper_risk_from_items():
    items = {
        "cat": [
            {"risk": "low"},
            {"severity": "critical"},
            "not-a-dict",
        ],
        "other": "skip",
    }
    assert ScanResultMapper._risk_from_items(items) == "Critical"
    assert ScanResultMapper._risk_from_items("nope") == ""


def test_scan_result_mapper_risk_from_grade_counts():
    assert ScanResultMapper._risk_from_grade_counts({"high": 2}) == "High"
    assert ScanResultMapper._risk_from_grade_counts({"high": 0, "low": 0}) == "Informational"
    assert ScanResultMapper._risk_from_grade_counts({"high": "bad"}) == "Informational"
    assert ScanResultMapper._risk_from_grade_counts("nope") == ""


def test_scan_result_mapper_risk_from_result_prefers_direct():
    assert ScanResultMapper._risk_from_result({"risk": "medium"}) == "Medium"
    assert ScanResultMapper._risk_from_result({"threats": {"a": [{"risk": "high"}]}}) == "High"


def test_scan_result_mapper_to_alert_fields_none_when_no_grade():
    assert ScanResultMapper.to_alert_fields("tls", "domain", "d", {"grade": "N/A"}) is None
    assert ScanResultMapper.to_alert_fields("tls", "domain", "d", {}) is None


def test_scan_result_mapper_to_alert_fields_builds_payload():
    result = {
        "grade": "A",
        "grade_counts": {"high": 1, "medium": 2, "low": 3},
        "threats": {"xss": [{"risk": "high"}]},
    }
    fields = ScanResultMapper.to_alert_fields("tls", "domain", "example.com", result)
    assert fields["category"] == "tls scanning"
    assert fields["title"] == "TLS Scan: example.com (Grade: A)"
    assert fields["risk"] == "High"
    assert fields["content_types"] == ["xss"]
    assert "High: 1" in fields["description"]


def test_vulnerability_findings_from_result_variants():
    assert VulnerabilityScanResultMapper.findings_from_result({"findings": {"a": 1}}) == [{"a": 1}]
    assert VulnerabilityScanResultMapper.findings_from_result({"top_findings": [{"b": 2}, "x"]}) == [{"b": 2}]
    assert VulnerabilityScanResultMapper.findings_from_result({"findings": "bad"}) == []
    assert VulnerabilityScanResultMapper.findings_from_result({}) == []


def test_vulnerability_to_alert_fields_full():
    result = {"domain": "example.com", "final_url": "http://x/y"}
    finding = {"title": "SQLi", "risk": "High", "description": "desc", "category": "injection", "url": "http://x/y"}
    fields = VulnerabilityScanResultMapper.to_alert_fields("domain", "example.com", result, finding)
    assert fields["category"] == "vulnerability-scanning"
    assert fields["title"] == "Vulnerability Scan: SQLi (High)"
    assert fields["risk"] == "High"
    assert fields["content_types"] == ["injection"]
    assert any(ioc.name == "url" for ioc in fields["all_ioc"])
    assert len(fields["data_hash"]) == 64


def test_vulnerability_to_alert_fields_defaults():
    fields = VulnerabilityScanResultMapper.to_alert_fields("domain", "example.com", {}, {})
    assert fields["title"] == "Vulnerability Scan: Vulnerability Finding (Unknown)"
    assert fields["url"] == "example.com"
    assert fields["source"] == "Orion Network Intel"


def test_dynamic_result_mapper_email_breach():
    result = {"m_title": "T", "m_important_content": "imp", "m_url": "http://u", "m_content_type": ["x"]}
    fields = DynamicResultMapper.to_alert_fields("email-breach", "email", "a@b.com", result)
    assert fields["title"] == "T"
    assert fields["description"] == "imp"
    assert fields["url"] == "http://u"


def test_dynamic_result_mapper_playstore():
    result = {"m_app_name": "App", "m_package_id": "com.x", "m_version": "1.0", "m_app_url": "http://p"}
    fields = DynamicResultMapper.to_alert_fields("playstore-scanning", "app", "com.x", result)
    assert fields["title"] == "App"
    assert "com.x" in fields["description"]
    assert fields["url"] == "http://p"


def test_dynamic_result_mapper_software():
    result = {"m_app_name": "SW", "m_package_id": "com.y"}
    fields = DynamicResultMapper.to_alert_fields("software-scanning", "app", "com.y", result)
    assert fields["title"] == "SW"
    assert "com.y" in fields["description"]


def test_dynamic_result_mapper_unknown_returns_none():
    assert DynamicResultMapper.to_alert_fields("unknown", "x", "y", {}) is None
