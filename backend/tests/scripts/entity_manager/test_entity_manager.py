from __future__ import annotations

from datetime import date, datetime

import pytest
from fastapi import HTTPException

from orion.api.server.entity_manager.entity_manager import entity_manager

from tests.scripts.entity_manager.fakes import (
    _FakeAql,
    _FakeArango,
    _FakeArangoCollection,
    _FakeArangoDB,
    _FakeArangoLockTimeout,
    _FakeArangoProvider,
    _FakeCountingOperation,
    _FakeExplodingArangoDB,
)
from tests.scripts.entity_manager.fixtures import _patch_entity_collaborators
from tests.scripts.entity_manager.helpers import (
    _edge_item,
    _make_batch_query,
    _make_entity,
    _make_graph_item,
    _make_manager,
    _make_norm_item,
    _make_query,
    _run,
    _vertex_item,
)


def test_normalize_key_handles_non_string():
    assert entity_manager._normalize_key(123) == "123"
    assert entity_manager._normalize_key("Hello World") == "hello_world"


def test_sanitize_strips_disallowed_characters():
    assert entity_manager._sanitize("A B#c!") == "a_bc!"


def test_clean_text_none_and_value():
    assert entity_manager._clean_text(None) == ""
    assert entity_manager._clean_text("  hi  ") == "hi"


def test_json_safe_converts_datetime_date_and_containers():
    value = {
        "when": datetime(2021, 5, 1, 12, 0, 0),
        "day": date(2021, 5, 1),
        "items": [1, {"nested": datetime(2020, 1, 1)}],
        "tuple": (1, 2),
        "set": {"x"},
    }
    result = entity_manager._json_safe(value)
    assert result["when"] == "2021-05-01T12:00:00"
    assert result["day"] == "2021-05-01"
    assert result["items"][1]["nested"] == "2020-01-01T00:00:00"
    assert result["tuple"] == [1, 2]
    assert result["set"] == ["x"]


def test_as_values_variants():
    assert entity_manager._as_values(None) == []
    assert entity_manager._as_values("") == []
    assert entity_manager._as_values({"a": 1}) == []
    assert entity_manager._as_values([1, [2, 3]]) == [1, 2, 3]
    assert entity_manager._as_values((1, 2)) == [1, 2]
    assert entity_manager._as_values({4, 5}) in ([4, 5], [5, 4])
    assert entity_manager._as_values("v") == ["v"]


def test_first_non_empty_returns_first_available():
    raw = {"a": "", "b": ["x"], "c": "y"}
    assert entity_manager._first_non_empty(raw, ("a", "b", "c")) == "x"
    assert entity_manager._first_non_empty(raw, ("a",)) is None


def test_as_graph_values_splits_split_keys():
    assert entity_manager._as_graph_values("m_country", "US, UK") == ["US", "UK"]
    assert entity_manager._as_graph_values("m_ip", "1.2.3.4") == ["1.2.3.4"]


def test_truncate_short_and_long():
    assert entity_manager._truncate("abc", 10) == "abc"
    truncated = entity_manager._truncate("a" * 20, 10)
    assert truncated.endswith("...")
    assert len(truncated) == 10


def test_canonical_cluster_id_alias_and_default():
    assert entity_manager._canonical_cluster_id("telegram") == "chat"
    assert entity_manager._canonical_cluster_id("") == "general"
    assert entity_manager._canonical_cluster_id("leak") == "leak"


def test_strip_org_suffixes():
    assert entity_manager._strip_org_suffixes("Acme Inc") == "Acme"
    assert entity_manager._strip_org_suffixes("Ltd") == "Ltd"


def test_strip_actor_variant_suffixes():
    assert entity_manager._strip_actor_variant_suffixes("Lazarus v2") == "Lazarus"
    assert entity_manager._strip_actor_variant_suffixes("APT28.1") == "APT"
    assert entity_manager._strip_actor_variant_suffixes("Group_v3") == "Group"
    assert entity_manager._strip_actor_variant_suffixes("Fancy-Bear") == "Fancy Bear"


def test_canonical_entity_value_branches():
    normalized, display, alias = entity_manager._canonical_entity_value("m_org", "Acme Inc")
    assert display == "Acme"
    assert normalized == "acme"
    assert alias == "Acme Inc"

    normalized, display, alias = entity_manager._canonical_entity_value("m_attacker", "Lazarus v2")
    assert display == "Lazarus"
    assert alias == "Lazarus v2"

    normalized, _display, _alias = entity_manager._canonical_entity_value(
        "m_enterprise_attack_techniques", "Uses T1059 technique"
    )
    assert normalized == "t1059"

    normalized, _display, alias = entity_manager._canonical_entity_value("m_ip", "1.2.3.4")
    assert normalized == "1.2.3.4"
    assert alias is None


def test_display_from_normalized():
    assert entity_manager._display_from_normalized("fancy_bear") == "Fancy Bear"


def test_canonical_graph_key_branches():
    assert entity_manager._canonical_graph_key("m_team", "apt") == "m_attacker"
    assert entity_manager._canonical_graph_key("m_team", "news") == "m_team"
    assert entity_manager._canonical_graph_key("m_company_name", "news") == "m_org"
    assert entity_manager._canonical_graph_key("unknown_key_xyz", "news") is None
    assert entity_manager._canonical_graph_key("m_ip", "news") == "m_ip"


def test_canonical_graph_value_key_hashes():
    assert entity_manager._canonical_graph_value_key("m_ip", "1.2.3.4") == "m_ip"
    assert entity_manager._canonical_graph_value_key("m_hashes", "a" * 32) == "m_md5"
    assert entity_manager._canonical_graph_value_key("m_hashes", "xyz") is None
    assert entity_manager._canonical_graph_value_key("m_hashes", "a" * 33) is None


def test_entity_role_for_key_all_branches():
    assert entity_manager._entity_role_for_key("m_attacker", "apt") == "threat_actor"
    assert entity_manager._entity_role_for_key("m_org", "leak") == "victim_organization"
    assert entity_manager._entity_role_for_key("m_org", "exploit") == "target_organization"
    assert entity_manager._entity_role_for_key("m_org", "news") == "mentioned_organization"
    assert entity_manager._entity_role_for_key("m_enterprise_attack_techniques", "apt") == "attack_technique"
    assert entity_manager._entity_role_for_key("m_enterprise_attack_tactics", "apt") == "attack_tactic"
    assert entity_manager._entity_role_for_key("m_author", "news") == "reporting_source"
    assert entity_manager._entity_role_for_key("m_ip", "news") == "mentioned_entity"


def test_edge_type_for_context_all_branches():
    assert entity_manager._edge_type_for_context("m_attacker", "threat_actor") == "attributed_to_actor"
    assert entity_manager._edge_type_for_context("m_org", "victim_organization") == "impacts_organization"
    assert entity_manager._edge_type_for_context("m_org", "target_organization") == "targets_organization"
    assert entity_manager._edge_type_for_context("m_org", "mentioned_organization") == "mentions_organization"
    assert entity_manager._edge_type_for_context("m_author", "reporting_source") == "published_by_source"
    assert entity_manager._edge_type_for_context("m_ip", "mentioned_entity") == "reports_indicator"
    assert entity_manager._edge_type_for_context("nope", "mentioned_entity") == "mentions_indicator"


def test_relationship_type_for_role():
    assert entity_manager._relationship_type_for_role("threat_actor") == "attributed-to"
    assert entity_manager._relationship_type_for_role("mentioned_entity") == "mentions"


def test_source_name_branches():
    assert entity_manager._source_name({"m_scrap_file": "file.txt"}) == "file.txt"
    assert entity_manager._source_name({}) == "unknown"
    assert entity_manager._source_name({"m_source_url": ["https://a.test"]}) == "https://a.test"


def test_explicit_confidence_score_branches():
    assert entity_manager._explicit_confidence_score({}) is None
    assert entity_manager._explicit_confidence_score({"m_confidence": 85}) == 0.85
    assert entity_manager._explicit_confidence_score({"m_confidence": 0.5}) == 0.5
    assert entity_manager._explicit_confidence_score({"m_confidence": "high"}) == 0.82
    assert entity_manager._explicit_confidence_score({"m_confidence": "weird-label"}) is None


def test_source_reliability_branches():
    explicit = entity_manager._source_reliability({"m_confidence": "high"}, "leak", "src")
    assert explicit == 0.82

    clearnet = entity_manager._source_reliability(
        {"m_network": "clearnet", "m_source_url": "x"}, "apt", "https://a.test"
    )
    assert clearnet <= 0.95

    darkweb = entity_manager._source_reliability({"m_network": "onion darkweb"}, "chat", "src")
    assert darkweb >= 0.1


def test_score_confidence_and_observation_helpers():
    score = entity_manager._score_confidence(0.75, 5, 0.8, 3)
    assert 0.1 <= score <= 0.99
    assert entity_manager._confidence_for_observation("m_cve", 0.8) > 0
    assert entity_manager._observation_confidence({"confidence": 0.42}) == 0.42
    assert entity_manager._observation_confidence({}) == 0.0


def test_merge_unique_dedupes_and_limits():
    result = entity_manager._merge_unique(["a", "", None], ["a", "b", "c"], limit=2)
    assert result == ["a", "b"]
    assert entity_manager._merge_unique("not-a-list", ["x"]) == ["x"]


def test_updated_evidence_count():
    old = {"evidence_doc_ids": ["d1"], "evidence_count": 1}
    assert entity_manager._updated_evidence_count(old, ["d1", "d2"]) == 2


def test_upsert_lock_returns_lock():
    lock_a = entity_manager._upsert_lock("vertex:abc")
    lock_b = entity_manager._upsert_lock("vertex:abc")
    assert lock_a is lock_b


def test_is_arango_lock_timeout_branches():
    assert entity_manager._is_arango_lock_timeout(_FakeArangoLockTimeout()) is True
    assert entity_manager._is_arango_lock_timeout(Exception("ERR 1200 problem")) is True
    assert entity_manager._is_arango_lock_timeout(Exception("timeout waiting to lock key foo")) is True
    assert entity_manager._is_arango_lock_timeout(Exception("some other error")) is False


def test_run_arango_with_retry_sync_success_first_try():
    op = _FakeCountingOperation(failures=0, exc=RuntimeError("x"))
    assert entity_manager._run_arango_with_retry_sync(op) == "done"
    assert op.attempts == 1


def test_run_arango_with_retry_sync_retries_on_lock_timeout():
    op = _FakeCountingOperation(failures=2, exc=_FakeArangoLockTimeout())
    assert entity_manager._run_arango_with_retry_sync(op) == "done"
    assert op.attempts == 3


def test_run_arango_with_retry_sync_reraises_non_timeout():
    op = _FakeCountingOperation(failures=1, exc=RuntimeError("boom"))
    with pytest.raises(RuntimeError):
        entity_manager._run_arango_with_retry_sync(op)


def test_run_arango_with_retry_sync_exhausts_attempts():
    op = _FakeCountingOperation(failures=10, exc=_FakeArangoLockTimeout())
    with pytest.raises(_FakeArangoLockTimeout):
        entity_manager._run_arango_with_retry_sync(op)
    assert op.attempts == entity_manager.ARANGO_LOCK_RETRY_ATTEMPTS


def test_min_and_max_seen():
    assert entity_manager._min_seen(None, "2021") == "2021"
    assert entity_manager._min_seen("2021", None) == "2021"
    assert entity_manager._min_seen("2021", "2020") == "2020"
    assert entity_manager._max_seen(None, "2021") == "2021"
    assert entity_manager._max_seen("2021", None) == "2021"
    assert entity_manager._max_seen("2021", "2022") == "2022"


def test_campaign_period():
    assert entity_manager._campaign_period(None) == "unknown"
    assert entity_manager._campaign_period("2021-05-01") == "2021-05"
    assert entity_manager._campaign_period("not-a-date") == "unknown"


def test_derived_use_edge_type_all_branches():
    assert entity_manager._derived_use_edge_type("m_cve")[0] == "uses_vulnerability"
    assert entity_manager._derived_use_edge_type("m_enterprise_attack_techniques")[0] == "uses_technique"
    assert entity_manager._derived_use_edge_type("m_enterprise_attack_tactics")[0] == "uses_tactic"
    assert entity_manager._derived_use_edge_type("m_family")[0] == "uses_malware_family"
    assert entity_manager._derived_use_edge_type("m_crypto_address")[0] == "uses_financial_indicator"
    assert entity_manager._derived_use_edge_type("m_domain")[0] == "uses_infrastructure"
    assert entity_manager._derived_use_edge_type("m_registry_key_path")[0] == "uses_host_indicator"
    assert entity_manager._derived_use_edge_type("m_md5")[0] == "uses_file_indicator"
    assert entity_manager._derived_use_edge_type("m_product")[0] == "targets_technology"
    assert entity_manager._derived_use_edge_type("m_yara_rule")[0] == "detected_by_rule"
    assert entity_manager._derived_use_edge_type("m_other")[0] == "associated_with_indicator"


def test_safe_key_short_and_hashed():
    assert entity_manager._safe_key("cti", "", None) == "cti"
    assert entity_manager._safe_key() == "cti"
    long_key = entity_manager._safe_key("x" * 400, max_len=50)
    assert len(long_key) <= 50
    assert "_" in long_key


def test_display_value_upper_for_cve_cwe():
    assert entity_manager._display_value("m_cve", "cve-2021-1") == "CVE-2021-1"
    assert entity_manager._display_value("m_ip", "1.2.3.4") == "1.2.3.4"


def test_is_low_value_entity_branches():
    assert entity_manager._is_low_value_entity("m_ip", "1.2.3.4", "") is True
    assert entity_manager._is_low_value_entity("m_person", "ab", "ab") is True
    assert entity_manager._is_low_value_entity("m_username", "abcd", "abcd") is True
    assert entity_manager._is_low_value_entity("m_username", "12345", "12345") is True
    assert entity_manager._is_low_value_entity("m_mac_address", "not-a-mac", "not-a-mac") is True
    assert entity_manager._is_low_value_entity("m_mac_address", "aa:bb:cc:dd:ee:ff", "aa:bb:cc:dd:ee:ff") is False
    assert entity_manager._is_low_value_entity("m_registry_key_path", "bad", "bad") is True
    assert entity_manager._is_low_value_entity("m_registry_key_path", "HKLM\\Soft", "hklm\\soft") is False
    assert entity_manager._is_low_value_entity("m_uk_nhs", "123", "123") is True
    assert entity_manager._is_low_value_entity("m_uk_nhs", "1111111111", "1111111111") is True
    assert entity_manager._is_low_value_entity("m_url", "http", "http") is True
    assert entity_manager._is_low_value_entity("m_ip", "1.2.3.4", "1.2.3.4") is False


def test_entity_label_uses_titles():
    assert entity_manager._entity_label("m_org", "Acme") == "Organization: Acme"
    assert entity_manager._entity_label("m_unknown_thing", "x") == "Unknown Thing: x"


def test_confidence_for_key_branches():
    assert entity_manager._confidence_for_key("m_cve") == 0.95
    assert entity_manager._confidence_for_key("m_org") == 0.85
    assert entity_manager._confidence_for_key("m_username") == 0.65
    assert entity_manager._confidence_for_key("m_country") == 0.55
    assert entity_manager._confidence_for_key("m_team") == 0.7
    assert entity_manager._confidence_for_key("m_misc") == 0.75


def test_report_helpers():
    raw = {"m_title": "A Title", "m_important_content": "Summary text", "m_date": "2021-05-01"}
    assert entity_manager._report_title(raw, "docid") == "A Title"
    assert entity_manager._report_title({}, "docid") == "docid"
    assert entity_manager._report_summary(raw) == "Summary text"
    assert entity_manager._report_published(raw) == "2021-05-01"
    assert entity_manager._report_published({}) is None


def test_report_metadata_filters_and_truncates():
    raw = {"m_url": "https://a.test", "m_important_content": "z" * 800, "m_title": ""}
    metadata = entity_manager._report_metadata(raw)
    assert metadata["m_url"] == "https://a.test"
    assert metadata["m_important_content"].endswith("...")
    assert "m_title" not in metadata


def test_graph_query_values_dedupes():
    assert entity_manager._graph_query_values(["A", "a", ""], "x") == ["A"]
    assert entity_manager._graph_query_values(None, "solo") == ["solo"]


def test_merge_graph_query_values_dedupes():
    assert entity_manager._merge_graph_query_values(["A"], ["a", "B", ""]) == ["A", "B"]


def test_graph_batch_items_merges_list_keys():
    items = [
        _make_graph_item(data_point_type="property", model_type="m_country", query_values=["US"]),
        _make_graph_item(data_point_type="property", model_type="m_country", query_values=["UK"]),
    ]
    query = _make_batch_query(requests=items)
    normalized = entity_manager._graph_batch_items(items, query)
    assert len(normalized) == 1
    assert normalized[0]["query_values"] == ["US", "UK"]


def test_graph_batch_items_skips_empty_and_normalizes_operator():
    items = [
        _make_graph_item(query_values=[], query_value=""),
        _make_graph_item(model_type="m_ip", query_values=["1.2.3.4"], operator="AND"),
    ]
    query = _make_batch_query(requests=items)
    normalized = entity_manager._graph_batch_items(items, query)
    assert len(normalized) == 1
    assert normalized[0]["operator"] == "&&"


def test_graph_document_limit_bounds():
    assert entity_manager._graph_document_limit("not-int") == 25
    assert entity_manager._graph_document_limit(5) == 20
    assert entity_manager._graph_document_limit(9999) == 800
    assert entity_manager._graph_document_limit(50) == 50


def test_graph_and_candidate_scan_limit_values():
    assert entity_manager._graph_and_candidate_scan_limit(10) == 5000
    assert entity_manager._graph_and_candidate_scan_limit(100) == 20000
    assert entity_manager._graph_and_candidate_scan_limit(1000) == 50000


def test_conjunctive_graph_groups_none_for_single_item():
    assert entity_manager._conjunctive_graph_groups([_make_norm_item()]) is None


def test_conjunctive_graph_groups_none_for_or_operator():
    items = [_make_norm_item(), _make_norm_item(operator="||")]
    assert entity_manager._conjunctive_graph_groups(items) is None


def test_conjunctive_graph_groups_none_for_scope_mismatch():
    items = [
        _make_norm_item(scope_cluster="leak"),
        _make_norm_item(operator="&&", scope_cluster="apt"),
    ]
    assert entity_manager._conjunctive_graph_groups(items) is None


def test_conjunctive_graph_groups_cluster_all_and_property():
    items = [
        _make_norm_item(data_point_type="cluster", model_type="cluster", query_values=["all"]),
        _make_norm_item(operator="&&", data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"]),
    ]
    groups = entity_manager._conjunctive_graph_groups(items)
    assert groups is not None
    assert groups["match_groups"][0]["kind"] == "cluster"
    assert len(groups["match_groups"][0]["ids"]) == len(entity_manager.CLUSTER_LABELS)
    assert groups["match_groups"][1]["kind"] == "property"
    assert groups["match_groups"][1]["edge_type"] == "has_m_ip"


def test_conjunctive_graph_groups_specific_cluster():
    items = [
        _make_norm_item(data_point_type="cluster", model_type="cluster", query_values=["leak", "leak"]),
        _make_norm_item(operator="&&", data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"]),
    ]
    groups = entity_manager._conjunctive_graph_groups(items)
    assert groups["match_groups"][0]["ids"] == ["cti_vertices/leak"]


def test_conjunctive_graph_groups_none_when_group_empty():
    items = [
        _make_norm_item(data_point_type="cluster", model_type="cluster", query_values=["not-a-cluster"]),
        _make_norm_item(operator="&&", data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"]),
    ]
    assert entity_manager._conjunctive_graph_groups(items) is None


def test_conjunctive_graph_groups_none_for_property_all():
    items = [
        _make_norm_item(data_point_type="property", model_type="all", query_values=["x"]),
        _make_norm_item(operator="&&", data_point_type="property", model_type="all", query_values=["y"]),
    ]
    assert entity_manager._conjunctive_graph_groups(items) is None


def test_dedupe_graph_results_and_repr_fallback():
    item = _edge_item("cti_vertices/doc1", "cti_vertices/m_ip:1", "has_m_ip", {"_id": "cti_vertices/m_ip:1", "_key": "m_ip:1"})
    keyless_a = {"vertex": {}, "edge": {}, "path": None, "marker": "a"}
    keyless_b = {"vertex": {}, "edge": {}, "path": None, "marker": "b"}
    deduped = entity_manager._dedupe_graph_results([item, item, keyless_a, keyless_a, keyless_b])
    assert len(deduped) == 3


def test_extract_document_ids_from_graph_result():
    item = {
        "vertex": {"type": "document", "_id": "cti_vertices/doc1"},
        "edge": {"type": "cluster_to_doc", "_to": "cti_vertices/doc2"},
        "path": {
            "vertices": [{"type": "document", "_id": "cti_vertices/doc3"}],
            "edges": [{"type": "has_m_ip", "_from": "cti_vertices/doc4"}],
        },
    }
    ids = set(entity_manager._extract_document_ids_from_graph_result(item))
    assert ids == {"cti_vertices/doc1", "cti_vertices/doc2", "cti_vertices/doc3", "cti_vertices/doc4"}


def test_extract_document_ids_ignores_clusters():
    item = {"edge": {"type": "cluster_to_doc", "_to": "cti_vertices/leak"}, "vertex": {}, "path": None}
    assert entity_manager._extract_document_ids_from_graph_result(item) == []


def test_extract_document_ids_from_graph_results_aggregate():
    items = [
        {"vertex": {"type": "document", "_id": "cti_vertices/d1"}, "edge": None, "path": None},
        {"vertex": {"type": "document", "_id": "cti_vertices/d2"}, "edge": None, "path": None},
    ]
    assert entity_manager._extract_document_ids_from_graph_results(items) == {"cti_vertices/d1", "cti_vertices/d2"}


def test_union_and_intersect_sets():
    assert entity_manager._union_sets({"a"}, {"b"}) == {"a", "b"}
    assert entity_manager._intersect_sets({"a", "b"}, {"b"}) == {"b"}


def test_merge_graph_result_groups_or_operator():
    group_a = {"operator": "||", "results": [{"vertex": {"type": "document", "_id": "cti_vertices/d1"}, "edge": None, "path": None}]}
    group_b = {"operator": "||", "results": [{"vertex": {"type": "document", "_id": "cti_vertices/d2"}, "edge": None, "path": None}]}
    merged = entity_manager._merge_graph_result_groups([group_a, group_b])
    assert len(merged) == 2


def test_merge_graph_result_groups_and_intersection():
    shared = {"vertex": {"type": "document", "_id": "cti_vertices/d1"}, "edge": None, "path": None}
    other = {"vertex": {"type": "document", "_id": "cti_vertices/d2"}, "edge": None, "path": None}
    group_a = {"operator": "||", "results": [shared, other]}
    group_b = {"operator": "&&", "results": [shared]}
    merged = entity_manager._merge_graph_result_groups([group_a, group_b])
    doc_ids = entity_manager._extract_document_ids_from_graph_results(merged)
    assert doc_ids == {"cti_vertices/d1"}


def test_merge_graph_result_groups_and_empty_breaks():
    group_a = {"operator": "||", "results": [{"vertex": {"type": "document", "_id": "cti_vertices/d1"}, "edge": None, "path": None}]}
    group_b = {"operator": "&&", "results": []}
    assert entity_manager._merge_graph_result_groups([group_a, group_b]) == []
    assert entity_manager._merge_graph_result_groups([]) == []


def test_group_graph_results_by_document_with_unscoped():
    scoped = {"vertex": {"type": "document", "_id": "cti_vertices/d1"}, "edge": None, "path": None}
    unscoped = {"vertex": {}, "edge": None, "path": None}
    grouped = entity_manager._group_graph_results_by_document([scoped, scoped, unscoped])
    assert len(grouped) == 2


def test_interleave_graph_result_sets_by_document():
    set_a = [{"vertex": {"type": "document", "_id": "cti_vertices/d1"}, "edge": None, "path": None}]
    set_b = [{"vertex": {"type": "document", "_id": "cti_vertices/d2"}, "edge": None, "path": None}]
    interleaved = entity_manager._interleave_graph_result_sets_by_document([set_a, set_b])
    assert len(interleaved) == 2
    assert entity_manager._interleave_graph_result_sets_by_document([]) == []


def test_limit_graph_results_by_documents_branches():
    items = [
        {"vertex": {"type": "document", "_id": f"cti_vertices/d{i}"}, "edge": None, "path": None}
        for i in range(3)
    ]
    assert len(entity_manager._limit_graph_results_by_documents(items, 0)) == 3
    assert len(entity_manager._limit_graph_results_by_documents(items, 10)) == 3
    limited = entity_manager._limit_graph_results_by_documents(items, 1)
    assert entity_manager._extract_document_ids_from_graph_results(limited) == {"cti_vertices/d0"}


def test_resolve_existing_actor_variant_no_underscore():
    manager = _make_manager()
    assert manager._resolve_existing_actor_variant_sync("lazarus", "Lazarus") == ("lazarus", "Lazarus", None)


def test_resolve_existing_actor_variant_matches_existing():
    collection = _FakeArangoCollection(
        "cti_vertices",
        docs={"m_attacker:lazarus": {"node_class": "threat_actor", "display_value": "Lazarus"}},
    )
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    resolved = manager._resolve_existing_actor_variant_sync("lazarus_group", "Lazarus Group")
    assert resolved == ("lazarus", "Lazarus", "Lazarus Group")


def test_resolve_existing_actor_variant_uses_normalized_display():
    collection = _FakeArangoCollection(
        "cti_vertices",
        docs={"m_attacker:lazarus": {"node_class": "threat_actor"}},
    )
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    resolved = manager._resolve_existing_actor_variant_sync("lazarus_group", "Lazarus Group")
    assert resolved == ("lazarus", "Lazarus", "Lazarus Group")


def test_resolve_existing_actor_variant_skips_short_and_non_actor():
    collection = _FakeArangoCollection(
        "cti_vertices",
        docs={"m_attacker:cd": {"node_class": "threat_actor"}, "m_attacker:foo": {"node_class": "malware"}},
    )
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    assert manager._resolve_existing_actor_variant_sync("ab_cd", "Ab Cd") == ("ab_cd", "Ab Cd", None)
    assert manager._resolve_existing_actor_variant_sync("foo_bar", "Foo Bar") == ("foo_bar", "Foo Bar", None)


def test_upsert_vertex_sync_new_document_with_arrays():
    collection = _FakeArangoCollection("cti_vertices")
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    document = {
        "_key": "m_ip:1",
        "base_confidence": 0.75,
        "first_seen": "2021-05-01",
        "last_seen": "2021-05-02",
        "max_source_reliability": 0.7,
    }
    manager._upsert_vertex_sync(
        document,
        {"aliases": ["a1"], "evidence_doc_ids": ["d1", "d2"], "sources": ["s1"]},
    )
    stored = collection.docs["m_ip:1"]
    assert stored["evidence_count"] == 2
    assert stored["aliases"] == ["a1"]
    assert stored["first_seen"] == "2021-05-01"
    assert stored["last_seen"] == "2021-05-02"
    assert "confidence" in stored
    assert "evidence_doc_ids" not in stored


def test_upsert_vertex_sync_merges_with_existing():
    collection = _FakeArangoCollection(
        "cti_vertices",
        docs={
            "m_ip:1": {
                "_id": "cti_vertices/m_ip:1",
                "_rev": "rev",
                "aliases": ["old"],
                "first_seen": "2020-01-01",
                "last_seen": "2020-01-01",
                "max_source_reliability": 0.9,
                "evidence_count": 1,
                "evidence_doc_ids": ["d0"],
            }
        },
    )
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    manager._upsert_vertex_sync(
        {"_key": "m_ip:1", "first_seen": "2021-05-01", "last_seen": "2021-05-05", "max_source_reliability": 0.5},
        {"aliases": ["new"], "evidence_doc_ids": ["d1"]},
    )
    stored = collection.docs["m_ip:1"]
    assert stored["aliases"] == ["old", "new"]
    assert stored["first_seen"] == "2020-01-01"
    assert stored["last_seen"] == "2021-05-05"
    assert stored["max_source_reliability"] == 0.9
    assert "_id" not in stored


def test_upsert_derived_edge_sync():
    collection = _FakeArangoCollection("cti_edges")
    manager = _make_manager(_FakeArangoDB(collections={"cti_edges": collection}))
    manager._upsert_derived_edge_sync(
        {"_key": "e1", "base_confidence": 0.8},
        "d1",
        "src",
        "leak",
        "2021-05-01",
        0.7,
    )
    stored = collection.docs["e1"]
    assert stored["evidence_count"] == 1
    assert stored["sources"] == ["src"]
    assert stored["source_modules"] == ["leak"]
    assert "confidence" in stored


def test_upsert_observation_vertex_uses_distributed_lock():
    collection = _FakeArangoCollection("cti_vertices")
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    _run(
        manager._upsert_observation_vertex(
            {"_key": "m_ip:1", "base_confidence": 0.75},
            ["alias"],
            "leak",
            ["m_ip"],
            "d1",
        )
    )
    assert "m_ip:1" in collection.docs


def test_upsert_derived_edge_builds_edge():
    collection = _FakeArangoCollection("cti_edges")
    manager = _make_manager(_FakeArangoDB(collections={"cti_edges": collection}))
    _run(
        manager._upsert_derived_edge(
            "cti_vertices/a",
            "cti_vertices/b",
            "uses_infrastructure",
            "uses",
            "uses infrastructure",
            "d1",
            "src",
            "leak",
            "2021-05-01",
            0.7,
            0.8,
            {"from_entity_role": "threat_actor"},
        )
    )
    assert len(collection.docs) == 1
    stored = next(iter(collection.docs.values()))
    assert stored["from_entity_role"] == "threat_actor"
    assert stored["type"] == "derived_uses_infrastructure"


def test_upsert_campaign_vertex_returns_id():
    collection = _FakeArangoCollection("cti_vertices")
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    actor = {"normalized_value": "lazarus", "display_value": "Lazarus", "prop_key": "m_attacker:lazarus"}
    result = _run(manager._upsert_campaign_vertex(actor, "leak", "d1", "src", "2021-05-01", 0.7))
    assert result.startswith("cti_vertices/")
    assert collection.docs


def test_ensure_default_clusters_inserts_all():
    collection = _FakeArangoCollection("cti_vertices")
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": collection}))
    _run(manager._ensure_default_clusters())
    assert len(collection.inserted) == len(entity_manager.CLUSTER_LABELS)


def test_get_entity_relations_cluster_query():
    depth1 = [
        _edge_item("cti_vertices/leak", "cti_vertices/d1", "cluster_to_doc"),
        _edge_item("cti_vertices/leak", "cti_vertices/d1", "cluster_to_doc"),
        {"vertex": {"_id": "cti_vertices/d1"}, "edge": None, "path": None},
    ]
    aql = _FakeAql(results=[{"depth1": depth1, "matched_ids": ["cti_vertices/leak"], "limit_hit_depth1": True}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    query = _make_query(data_point_type="cluster", model_type="cluster", query_value="leak", depth="10", edge="1000")
    result = _run(manager.get_entity_relations(query))
    assert result["limit_reached"] is True
    assert len(result["results"]) == 1
    assert result["queried_id"] == "cti_vertices/leak"


def test_get_entity_relations_property_all_query_with_scope():
    aql = _FakeAql(results=[{"depth1": [], "matched_ids": [], "limit_hit_depth1": False}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    query = _make_query(data_point_type="property", model_type="all", query_value="acme", scope_cluster="telegram", depth="0")
    result = _run(manager.get_entity_relations(query))
    assert result["results"] == []
    assert result["queried_id"] is not None


def test_get_entity_relations_document_query_default_branch():
    aql = _FakeAql(results=[{"depth1": [], "matched_ids": ["cti_vertices/x"], "limit_hit_depth1": False}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    query = _make_query(data_point_type="document", model_type="m_ip", query_value="x")
    result = _run(manager.get_entity_relations(query))
    assert result["matched_vertex_ids"] == ["cti_vertices/x"]


def test_get_entity_relations_handles_exception():
    aql = _FakeAql(error=RuntimeError("aql down"))
    manager = _make_manager(_FakeArangoDB(aql=aql))
    query = _make_query()
    result = _run(manager.get_entity_relations(query))
    assert result == {"results": [], "limit_reached": False, "queried_id": None, "matched_vertex_ids": []}


def test_get_conjunctive_graph_relations_returns_none_for_single_item():
    manager = _make_manager()
    assert _run(manager._get_conjunctive_graph_relations([_make_norm_item()], 25)) is None


def test_get_conjunctive_property_only_relations():
    depth1 = [_edge_item("cti_vertices/d1", "cti_vertices/m_ip:1", "has_m_ip")]
    aql = _FakeAql(results=[{"depth1": depth1, "limit_hit_depth1": True, "matched_ids": ["cti_vertices/m_ip:1"]}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    items = [
        _make_norm_item(model_type="m_ip", query_values=["1.2.3.4"], scope_cluster="leak"),
        _make_norm_item(operator="&&", model_type="m_domain", query_values=["evil.com"], scope_cluster="leak"),
    ]
    result = _run(manager._get_conjunctive_graph_relations(items, 25))
    assert result["limit_reached"] is True
    assert result["queried_ids"]


def test_get_conjunctive_property_only_relations_no_scope():
    aql = _FakeAql(results=[{"depth1": [], "limit_hit_depth1": False, "matched_ids": []}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    items = [
        _make_norm_item(model_type="m_ip", query_values=["1.2.3.4"]),
        _make_norm_item(operator="&&", model_type="m_domain", query_values=["evil.com"]),
    ]
    result = _run(manager._get_conjunctive_graph_relations(items, 25))
    assert result["results"] == []


def test_get_conjunctive_graph_relations_mixed_cluster_and_property():
    depth1 = [_edge_item("cti_vertices/d1", "cti_vertices/m_ip:1", "has_m_ip")]
    aql = _FakeAql(results=[{"depth1": depth1, "limit_hit_depth1": False, "matched_ids": []}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    items = [
        _make_norm_item(data_point_type="cluster", model_type="cluster", query_values=["leak"], scope_cluster="leak"),
        _make_norm_item(operator="&&", data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"], scope_cluster="leak"),
    ]
    result = _run(manager._get_conjunctive_graph_relations(items, 25))
    assert "results" in result


def test_get_entity_relations_batch_conjunctive_path():
    depth1 = [_edge_item("cti_vertices/d1", "cti_vertices/m_ip:1", "has_m_ip")]
    aql = _FakeAql(results=[{"depth1": depth1, "limit_hit_depth1": False, "matched_ids": []}])
    manager = _make_manager(_FakeArangoDB(aql=aql))
    requests = [
        _make_graph_item(data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"]),
        _make_graph_item(data_point_type="property", model_type="m_domain", query_values=["evil.com"], operator="&&"),
    ]
    query = _make_batch_query(requests=requests)
    result = _run(manager.get_entity_relations_batch(query))
    assert "results" in result


def test_get_entity_relations_batch_non_conjunctive_loop():
    seq = [
        [{"depth1": [_edge_item("cti_vertices/leak", "cti_vertices/d1", "cluster_to_doc")], "matched_ids": ["cti_vertices/m_ip:1"], "limit_hit_depth1": False}],
    ]
    aql = _FakeAql(sequence=seq)
    manager = _make_manager(_FakeArangoDB(aql=aql))
    requests = [_make_graph_item(data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"])]
    query = _make_batch_query(requests=requests)
    result = _run(manager.get_entity_relations_batch(query))
    assert result["queried_ids"] == ["cti_vertices/m_ip:1.2.3.4"]
    assert result["matched_vertex_ids"] == ["cti_vertices/m_ip:1"]


def test_get_entity_relations_batch_handles_exception():
    aql = _FakeAql(error=RuntimeError("aql broke"))
    manager = _make_manager(_FakeArangoDB(aql=aql))
    requests = [
        _make_graph_item(data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"]),
        _make_graph_item(data_point_type="property", model_type="m_domain", query_values=["evil.com"], operator="&&"),
    ]
    query = _make_batch_query(requests=requests)
    result = _run(manager.get_entity_relations_batch(query))
    assert result == {"results": [], "limit_reached": False, "queried_id": None, "queried_ids": [], "matched_vertex_ids": []}


def test_get_entity_relations_batch_without_db_uses_loop():
    seq = [[{"depth1": [], "matched_ids": [], "limit_hit_depth1": False}]]
    aql = _FakeAql(sequence=seq)
    manager = _make_manager(_FakeArangoDB(aql=aql))
    manager._entity_manager__db = None
    requests = [
        _make_graph_item(data_point_type="property", model_type="m_ip", query_values=["1.2.3.4"]),
        _make_graph_item(data_point_type="property", model_type="m_domain", query_values=["evil.com"], operator="&&"),
    ]
    query = _make_batch_query(requests=requests)
    manager._entity_manager__db = None
    result = _run(manager.get_entity_relations_batch(query))
    assert "results" in result


def test_create_or_update_entity_nodes_skips_without_doc_id():
    manager = _make_manager()
    entity = _make_entity(m_ip=["1.2.3.4"])
    result = _run(manager.create_or_update_entity_nodes(entity))
    assert result["status"] == "skipped"


def test_create_or_update_entity_nodes_skips_without_valid_properties():
    manager = _make_manager()
    entity = _make_entity(m_document_id="d1", m_person="ab")
    result = _run(manager.create_or_update_entity_nodes(entity))
    assert result["status"] == "skipped"
    assert "no valid properties" in result["message"]


def test_create_or_update_entity_nodes_full_success():
    vertices = _FakeArangoCollection("cti_vertices")
    edges = _FakeArangoCollection("cti_edges")
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": vertices, "cti_edges": edges}))
    entity = _make_entity(
        m_document_id="DOC-1",
        m_cluster_id="leak",
        m_attacker="EvilCorp",
        m_org="Acme Inc",
        m_cve="cve-2021-1234",
        m_domain="evil.com",
        m_enterprise_attack_techniques="Uses T1059",
        m_enterprise_attack_tactics="TA0001",
        m_source_url="https://example.com/report",
        m_title="Big Leak Report",
        m_important_content="Something happened",
        m_date="2021-05-01",
    )
    result = _run(manager.create_or_update_entity_nodes(entity))
    assert result["status"] == "success"
    assert "DOC-1" in result["message"] or "doc-1" in result["message"]
    assert vertices.docs
    assert edges.docs


def test_create_or_update_entity_nodes_raises_http_exception_on_failure():
    manager = _make_manager(_FakeExplodingArangoDB())
    entity = _make_entity(m_document_id="DOC-2", m_cluster_id="leak", m_org="Acme Inc")
    with pytest.raises(HTTPException) as exc:
        _run(manager.create_or_update_entity_nodes(entity))
    assert exc.value.status_code == 500


def test_create_or_update_entity_nodes_logs_property_upsert_errors():
    vertices = _FakeArangoCollection("cti_vertices")
    edges = _FakeArangoCollection("cti_edges", insert_error=RuntimeError("edge boom"))
    manager = _make_manager(_FakeArangoDB(collections={"cti_vertices": vertices, "cti_edges": edges}))
    entity = _make_entity(
        m_document_id="DOC-3",
        m_cluster_id="news",
        m_ip="8.8.8.8",
        m_title="Report",
    )
    with pytest.raises(HTTPException):
        _run(manager.create_or_update_entity_nodes(entity))


def test_refresh_arango_handles_and_get_instance(monkeypatch):
    import orion.api.server.entity_manager.entity_manager as entity_module

    fake_db = _FakeArangoDB()
    provider = _FakeArangoProvider(_FakeArango(fake_db, graph="graph-handle"))
    monkeypatch.setattr(entity_module, "arango_controller", provider)
    monkeypatch.setattr(entity_manager, "_entity_manager__instance", None, raising=False)

    manager = object.__new__(entity_manager)
    manager._refresh_arango_handles()
    assert manager._entity_manager__db is fake_db
    assert manager._entity_manager__graph == "graph-handle"

    instance = entity_manager.get_instance()
    assert isinstance(instance, entity_manager)
    monkeypatch.setattr(entity_manager, "_entity_manager__instance", None, raising=False)
