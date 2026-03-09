from __future__ import annotations

from types import SimpleNamespace

from orion.helper_manager.helper_controller import helper_controller


def test_extract_domains_from_text():
    text = "visit https://www.example.com/path and sub.domain.org now"
    domains = helper_controller.extract_domains_from_text(text)
    assert "example.com" in domains
    assert "sub.domain.org" in domains


def test_transform_query_match_modes():
    assert helper_controller.transform_query_match("foo bar", "or") == "foo bar"
    assert helper_controller.transform_query_match("foo bar", "and") == '"foo" "bar"'
    assert helper_controller.transform_query_match("foo bar", "full") == '"foo bar"'


def test_parse_tagged_logic_query_for_iocs():
    parsed = helper_controller.parse_tagged_logic_query_for_iocs("m_email:test@example.com AND m_ip:1.1.1.1")
    assert isinstance(parsed, dict)


def test_password_matches_schema():
    schema = SimpleNamespace(minLength=8, maxLength=64, hasAlphabets=True, hasNumbers=True, hasSpecialChars=True)
    assert helper_controller.password_matches_schema("Abcdef1!", schema) is True
    assert helper_controller.password_matches_schema("abcdef12", schema) is False
