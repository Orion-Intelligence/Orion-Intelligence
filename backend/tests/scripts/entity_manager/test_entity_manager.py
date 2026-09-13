from datetime import datetime

from orion.api.server.crawl_manager.class_model.entity_model import entity_model
from orion.api.server.entity_manager.constants import enums as graph_enums

from tests.scripts.entity_manager.helpers import DEFAULT_RELIABILITY, EM, build_manager, graph_item, run


def test_normalize_key_lowercases_and_replaces_spaces():
    assert EM._normalize_key("Hello World") == "hello_world"
    assert EM._normalize_key(123) == "123"


def test_sanitize_strips_disallowed_and_lowercases():
    assert EM._sanitize("A B#C") == "a_bc"


def test_clean_text_handles_none_and_whitespace():
    assert EM._clean_text(None) == ""
    assert EM._clean_text("  x  ") == "x"


def test_json_safe_serializes_datetime_and_containers():
    result = EM._json_safe({"when": datetime(2024, 1, 2, 3, 4, 5), "items": {"a", "a"}})
    assert result["when"] == "2024-01-02T03:04:05"
    assert result["items"] == ["a"]


def test_as_values_flattens_and_drops_empty():
    assert EM._as_values(None) == []
    assert EM._as_values("x") == ["x"]
    assert EM._as_values(["a", ["b"]]) == ["a", "b"]
    assert EM._as_values({}) == []


def test_first_non_empty_returns_first_present():
    assert EM._first_non_empty({"a": "", "b": "x"}, ("a", "b")) == "x"
    assert EM._first_non_empty({"a": ""}, ("a",)) is None


def test_as_graph_values_splits_only_split_keys():
    assert EM._as_graph_values("m_ip", "1.2.3.4,5.6.7.8") == ["1.2.3.4,5.6.7.8"]
    split_keys = list(graph_enums.SPLIT_VALUE_KEYS)
    if split_keys:
        assert EM._as_graph_values(split_keys[0], "a, b ,c") == ["a", "b", "c"]


def test_truncate_appends_ellipsis():
    assert EM._truncate("abcdef", 5) == "ab..."
    assert EM._truncate("abc", 5) == "abc"


def test_canonical_cluster_id_defaults_to_general():
    assert EM._canonical_cluster_id(None) == "general"
    assert EM._canonical_cluster_id("") == "general"


def test_strip_org_suffixes_removes_trailing_suffix():
    suffixes = list(graph_enums.ORG_SUFFIXES)
    if suffixes:
        suffix = suffixes[0]
        assert EM._strip_org_suffixes(f"Acme {suffix}") == "Acme"


def test_strip_actor_variant_suffixes_removes_version_tail():
    assert EM._strip_actor_variant_suffixes("Lazarus.v3") == "Lazarus"
    assert EM._strip_actor_variant_suffixes("Lazarus_Group") == "Lazarus Group"


def test_canonical_entity_value_uppercases_cve_without_alias():
    normalized, display, alias = EM._canonical_entity_value("m_cve", "cve-2021-1234")
    assert display == "CVE-2021-1234"
    assert normalized == "cve-2021-1234"
    assert alias is None


def test_canonical_entity_value_org_strips_suffix_and_records_alias():
    suffixes = list(graph_enums.ORG_SUFFIXES)
    if not suffixes:
        return
    normalized, display, alias = EM._canonical_entity_value("m_org", f"Acme {suffixes[0]}")
    assert display == "Acme"
    assert normalized == "acme"
    assert alias == f"Acme {suffixes[0]}"


def test_display_from_normalized_titlecases():
    assert EM._display_from_normalized("acme_corp") == "Acme Corp"


def test_canonical_graph_value_key_hash_length_and_passthrough():
    assert EM._canonical_graph_value_key("m_ip", "1.2.3.4") == "m_ip"
    hex64 = "a" * 64
    expected = graph_enums.HASH_KEY_BY_HEX_LENGTH.get(64)
    assert EM._canonical_graph_value_key("m_hashes", hex64) == expected
    assert EM._canonical_graph_value_key("m_hashes", "nothex") is None


def test_entity_role_for_key():
    assert EM._entity_role_for_key("m_attacker", "leak") == "threat_actor"
    assert EM._entity_role_for_key("m_org", "leak") == "victim_organization"


def test_edge_type_for_context():
    assert EM._edge_type_for_context("m_attacker", "threat_actor") == "attributed_to_actor"
    assert EM._edge_type_for_context("m_org", "victim_organization") == "impacts_organization"


def test_relationship_type_for_role_defaults_to_mentions():
    assert EM._relationship_type_for_role("threat_actor") == "attributed-to"
    assert EM._relationship_type_for_role("something_else") == "mentions"


def test_source_name_prefers_known_keys():
    assert EM._source_name({"m_source_url": "http://x"}) == "http://x"
    assert EM._source_name({}) == "unknown"


def test_explicit_confidence_score_normalizes():
    assert EM._explicit_confidence_score({"m_confidence": 80}) == 0.8
    assert EM._explicit_confidence_score({"m_confidence": 0.5}) == 0.5
    assert EM._explicit_confidence_score({}) is None


def test_source_reliability_explicit_overrides_and_bounds():
    assert EM._source_reliability({"m_confidence": 90}, "leak", "src") == 0.9
    score = EM._source_reliability({}, "social", "http://darkweb.onion")
    assert 0.1 <= score <= 0.95


def test_score_confidence_baseline():
    assert EM._score_confidence(0.75, 1, DEFAULT_RELIABILITY) == 0.75


def test_confidence_for_key_tiers():
    assert EM._confidence_for_key("m_cve") == 0.95
    assert EM._confidence_for_key("m_unmapped_key") == 0.75


def test_confidence_for_observation_uses_key_base():
    assert EM._confidence_for_observation("m_cve", DEFAULT_RELIABILITY) == 0.95


def test_merge_unique_dedupes_and_limits():
    assert EM._merge_unique(["a"], ["a", "b", ""]) == ["a", "b"]
    assert EM._merge_unique([], ["a", "b", "c"], 2) == ["a", "b"]


def test_updated_evidence_count_counts_new_ids():
    old = {"evidence_count": 2, "evidence_doc_ids": ["d1"]}
    assert EM._updated_evidence_count(old, ["d1", "d2"]) == 3


def test_is_low_value_entity_rules():
    assert EM._is_low_value_entity("m_person", "P", "p") is True
    assert EM._is_low_value_entity("m_username", "1234", "1234") is True
    assert EM._is_low_value_entity("m_url", "http", "http") is True
    assert EM._is_low_value_entity("m_ip", "1.2.3.4", "1.2.3.4") is False


def test_safe_key_joins_and_hashes_long_input():
    assert EM._safe_key("Doc ID", "m_ip", "1.2.3.4") == "doc_id_m_ip_1.2.3.4"
    long_key = EM._safe_key("x" * 400)
    assert len(long_key) <= 240
    assert "_" in long_key


def test_report_title_falls_back_to_doc_id():
    assert EM._report_title({}, "doc1") == "doc1"


def test_report_metadata_skips_empty():
    assert EM._report_metadata({}) == {}


def test_extract_document_ids_from_graph_results():
    results = [graph_item("doc-a", "m_ip", "8.8.8.8")]
    assert EM._extract_document_ids_from_graph_results(results) == {"cti_vertices/doc-a"}
    assert EM._extract_document_ids_from_graph_results([]) == set()


def test_min_and_max_seen():
    assert EM._min_seen(None, "2024-01-02") == "2024-01-02"
    assert EM._max_seen(None, "2024-01-02") == "2024-01-02"


def test_upsert_vertex_sync_merges_arrays_and_persists():
    manager, db, _upserts, _derived = build_manager()
    manager._run_arango_with_retry_sync = lambda operation: operation()

    vertices = db.collection("cti_vertices")
    vertices.documents["m_ip:8.8.8.8"] = {
        "_key": "m_ip:8.8.8.8",
        "_id": "cti_vertices/m_ip:8.8.8.8",
        "sources": ["src-a"],
    }

    manager._upsert_vertex_sync(
        {
            "_key": "m_ip:8.8.8.8",
            "value": "8.8.8.8",
            "base_confidence": 0.95,
            "max_source_reliability": 0.9,
        },
        merge_arrays={"sources": ["src-b"]},
    )

    stored = vertices.get("m_ip:8.8.8.8")
    assert stored["value"] == "8.8.8.8"
    assert stored["sources"] == ["src-a", "src-b"]
    assert "_rev" not in stored


def test_create_or_update_skips_without_document_id():
    manager, _db, _upserts, _derived = build_manager()
    result = run(manager.create_or_update_entity_nodes(entity_model(m_ip="8.8.8.8")))
    assert result["status"] == "skipped"


def test_create_or_update_skips_without_valid_properties():
    manager, _db, _upserts, _derived = build_manager()
    entity = entity_model(m_document_id="DOC-1", m_cluster_id="leak")
    result = run(manager.create_or_update_entity_nodes(entity))
    assert result["status"] == "skipped"


def test_create_or_update_persists_report_cluster_and_properties():
    manager, db, upserts, derived = build_manager()
    entity = entity_model(
        m_document_id="DOC-1",
        m_cluster_id="leak",
        m_ip="8.8.8.8",
        m_domain="evil.com",
        m_title="Breach Report",
    )

    result = run(manager.create_or_update_entity_nodes(entity))

    assert result["status"] == "success"

    vertices = db.collection("cti_vertices")
    assert vertices.has("doc-1")
    assert vertices.has("leak")
    assert vertices.get("doc-1")["node_class"] == "report"

    edges = db.collection("cti_edges")
    edge_types = {edge.get("edge_type") for edge in edges.inserts}
    assert "belongs_to_cluster" in edge_types

    upserted_values = {upsert["document"]["normalized_value"] for upsert in upserts}
    assert "8.8.8.8" in upserted_values
    assert "evil.com" in upserted_values

    assert len(derived) == 1
    assert derived[0]["doc_id"] == "doc-1"
    assert derived[0]["cluster_id"] == "leak"
