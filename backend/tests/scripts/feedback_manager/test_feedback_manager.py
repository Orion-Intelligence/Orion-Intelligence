from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

from orion.api.interactive.feedback_manager.feedback_manager import FeedbackManager
from orion.services.mongo_manager.shared_model.db_auth_models import LicenseName, user_role
from orion.services.mongo_manager.shared_model.db_document_feedback_model import (
    DocumentFeedbackComment,
    DocumentFeedbackReaction,
    FeedbackTrustState,
    db_document_feedback_model,
)
from tests.model.fakes import FakeDoc, FakeMongoEngine
from tests.scripts.feedback_manager.helpers import (
    FakeSearch,
    _current_user,
    _encrypt,
    _make_manager,
    _make_tenant,
    _make_user,
    _patch_key_manager,
    _patch_search,
    _patch_tenant_lookup,
    _run,
)


def test_truncate_returns_short_value_unchanged():
    assert FeedbackManager._truncate("hello") == "hello"
    assert FeedbackManager._truncate("   ") == ""


def test_truncate_shortens_long_value_with_ellipsis():
    value = "x" * 200
    result = FeedbackManager._truncate(value, limit=50)
    assert len(result) == 50
    assert result.endswith("...")


def test_pick_title_returns_first_present_key():
    assert FeedbackManager._pick_title({"m_name": "second", "m_title": "first"}) == "first"
    assert FeedbackManager._pick_title({"m_url": "http://x"}) == "http://x"
    assert FeedbackManager._pick_title({"other": "y"}) == ""


def test_pick_preview_truncates_first_present_key():
    assert FeedbackManager._pick_preview({"m_content": "body"}) == "body"
    assert FeedbackManager._pick_preview({}) == ""


def test_pick_date_returns_first_present_key():
    assert FeedbackManager._pick_date({"m_update_date": "2026"}) == "2026"
    assert FeedbackManager._pick_date({}) == ""


def test_serialize_reaction_with_and_without_trust_state():
    now = datetime.now(UTC)
    reaction = DocumentFeedbackReaction(user_id="u1", username="a", recommended=True, trust_state=FeedbackTrustState.TRUST, created_at=now, updated_at=now)
    serialized = FeedbackManager._serialize_reaction(reaction)
    assert serialized["trust_state"] == "trust"
    assert serialized["recommended"] is True

    reaction2 = DocumentFeedbackReaction(user_id="u2", trust_state=None, created_at=now, updated_at=now)
    assert FeedbackManager._serialize_reaction(reaction2)["trust_state"] is None


def test_get_user_reaction_found_and_not_found():
    doc = db_document_feedback_model(doc_id="d")
    reaction = DocumentFeedbackReaction(user_id="u1")
    doc.reactions.append(reaction)
    assert FeedbackManager._get_user_reaction(doc, SimpleNamespace(id="u1")) is reaction
    assert FeedbackManager._get_user_reaction(doc, SimpleNamespace(id="other")) is None


def test_serialize_comment_decrypts_when_tenant_present(monkeypatch):
    key = Fernet.generate_key()
    user = _make_user(tenant_id="507f1f77bcf86cd799439012")
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[user]))
    _patch_key_manager(monkeypatch, key)
    now = datetime.now(UTC)
    comment = DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", username="alice", comment=_encrypt(key, "secret"), created_at=now, updated_at=now)

    result = _run(FeedbackManager._serialize_comment(comment))

    assert result["comment"] == "secret"
    assert result["is_deleted"] is False


def test_serialize_comment_blank_for_deleted_and_bad_cipher(monkeypatch):
    key = Fernet.generate_key()
    user = _make_user()
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[user, user]))
    _patch_key_manager(monkeypatch, key)
    now = datetime.now(UTC)

    deleted = DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", comment="x", is_deleted=True, created_at=now, updated_at=now)
    assert _run(FeedbackManager._serialize_comment(deleted))["comment"] == ""

    bad = DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", comment="not-cipher", created_at=now, updated_at=now)
    assert _run(FeedbackManager._serialize_comment(bad))["comment"] == ""


def test_get_tenant_id_for_user_id_variants(monkeypatch):
    assert _run(FeedbackManager._get_tenant_id_for_user_id("")) == ""

    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[None]))
    assert _run(FeedbackManager._get_tenant_id_for_user_id("507f1f77bcf86cd799439011")) == ""

    user = _make_user(tenant_id="tenant-x")
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[user]))
    assert _run(FeedbackManager._get_tenant_id_for_user_id("507f1f77bcf86cd799439011")) == "tenant-x"

    assert _run(FeedbackManager._get_tenant_id_for_user_id("not-an-object-id")) == ""


def test_get_or_create_returns_new_when_missing_and_existing_when_found():
    manager = _make_manager(FakeMongoEngine())
    created = _run(manager._get_or_create("new-doc"))
    assert created.doc_id == "new-doc"

    existing = db_document_feedback_model(doc_id="existing")
    manager2 = _make_manager(FakeMongoEngine(records=[existing]))
    assert _run(manager2._get_or_create("existing")) is existing


def test_get_feedback_serializes_existing_doc():
    doc = db_document_feedback_model(doc_id="d", recommended_count=2, trust_count=1)
    manager = _make_manager(FakeMongoEngine(records=[doc]))

    result = _run(manager.get_feedback("d", _current_user()))

    assert result["doc_id"] == "d"
    assert result["recommended_count"] == 2
    assert result["can_react"] is True
    assert result["current_user_reaction"] is None


def test_get_feedback_saves_when_doc_has_no_id(monkeypatch):
    manager = _make_manager(FakeMongoEngine())
    now = datetime.now(UTC)
    doc = FakeDoc(id=None, doc_id="d", recommended_count=0, trust_count=0, untrust_count=0, comments=[], reactions=[], created_at=now, updated_at=now)

    async def fake_get_or_create(doc_id):
        return doc

    monkeypatch.setattr(manager, "_get_or_create", fake_get_or_create)

    result = _run(manager.get_feedback("d"))

    assert result["doc_id"] == "d"
    assert manager._engine.saved == [doc]


def test_increment_recommended_toggles_on_then_off():
    doc = db_document_feedback_model(doc_id="d")
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    user = _current_user()

    first = _run(manager.increment_recommended("d", user))
    assert first["recommended_count"] == 1
    assert first["current_user_reaction"]["recommended"] is True

    second = _run(manager.increment_recommended("d", user))
    assert second["recommended_count"] == 0
    assert second["current_user_reaction"] is None


def test_increment_trust_and_switch_from_untrust():
    doc = db_document_feedback_model(doc_id="d")
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    user = _current_user()

    _run(manager.increment_untrust("d", user))
    assert doc.untrust_count == 1

    switched = _run(manager.increment_trust("d", user))
    assert switched["trust_count"] == 1
    assert switched["untrust_count"] == 0
    assert switched["current_user_reaction"]["trust_state"] == "trust"

    toggled_off = _run(manager.increment_trust("d", user))
    assert toggled_off["trust_count"] == 0
    assert toggled_off["current_user_reaction"] is None


def test_increment_untrust_and_switch_from_trust():
    doc = db_document_feedback_model(doc_id="d")
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    user = _current_user()

    _run(manager.increment_trust("d", user))
    switched = _run(manager.increment_untrust("d", user))
    assert switched["untrust_count"] == 1
    assert switched["trust_count"] == 0

    toggled_off = _run(manager.increment_untrust("d", user))
    assert toggled_off["untrust_count"] == 0


def test_save_reaction_saves_when_doc_has_no_id(monkeypatch):
    manager = _make_manager(FakeMongoEngine())
    now = datetime.now(UTC)
    doc = FakeDoc(id=None, doc_id="d", recommended_count=0, trust_count=0, untrust_count=0, comments=[], reactions=[], created_at=now, updated_at=now)

    async def fake_get_or_create(doc_id):
        return doc

    monkeypatch.setattr(manager, "_get_or_create", fake_get_or_create)

    result = _run(manager.increment_recommended("d", _current_user()))

    assert result["recommended_count"] == 1
    assert doc in manager._engine.saved


def test_add_comment_stores_plaintext_without_tenant(monkeypatch):
    doc = db_document_feedback_model(doc_id="d")
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[None]))

    result = _run(manager.add_comment("d", "  hello world  ", _current_user()))

    assert len(doc.comments) == 1
    assert doc.comments[0].comment == "hello world"
    assert result["comments"][0]["comment"] == ""


def test_add_comment_encrypts_when_tenant_present(monkeypatch):
    key = Fernet.generate_key()
    doc = db_document_feedback_model(doc_id="d")
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    user = _make_user()
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[user, user]))
    _patch_key_manager(monkeypatch, key)

    _run(manager.add_comment("d", "confidential", _current_user()))

    stored = doc.comments[0].comment
    assert stored != "confidential"
    assert Fernet(key).decrypt(stored.encode()).decode() == "confidential"


def test_add_comment_rate_limited_within_hour(monkeypatch):
    doc = db_document_feedback_model(doc_id="d")
    now = datetime.now(UTC)
    doc.comments.append(DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", comment="x", created_at=now, updated_at=now))
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[None]))

    with pytest.raises(HTTPException) as exc:
        _run(manager.add_comment("d", "again", _current_user()))

    assert exc.value.status_code == 429


def test_add_comment_ignores_deleted_and_naive_datetimes(monkeypatch):
    doc = db_document_feedback_model(doc_id="d")
    old_naive = datetime(2000, 1, 1)
    doc.comments.append(DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", comment="", is_deleted=True, created_at=datetime.now(UTC), updated_at=datetime.now(UTC)))
    doc.comments.append(DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", comment="old", created_at=old_naive, updated_at=old_naive))
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[None]))

    _run(manager.add_comment("d", "fresh", _current_user()))

    assert doc.comments[0].comment == "fresh"


def test_delete_comment_not_found_raises_404():
    doc = db_document_feedback_model(doc_id="d")
    manager = _make_manager(FakeMongoEngine(records=[doc]))

    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_comment("d", datetime.now(UTC).isoformat(), _current_user()))

    assert exc.value.status_code == 404


def test_delete_comment_wrong_owner_raises_403():
    doc = db_document_feedback_model(doc_id="d")
    now = datetime.now(UTC)
    doc.comments.append(DocumentFeedbackComment(user_id="someone-else", comment="x", created_at=now, updated_at=now))
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    created_at = doc.comments[0].created_at.isoformat()

    with pytest.raises(HTTPException) as exc:
        _run(manager.delete_comment("d", created_at, _current_user()))

    assert exc.value.status_code == 403


def test_delete_comment_marks_deleted(monkeypatch):
    doc = db_document_feedback_model(doc_id="d")
    now = datetime.now(UTC)
    doc.comments.append(DocumentFeedbackComment(user_id="507f1f77bcf86cd799439011", comment="x", created_at=now, updated_at=now))
    manager = _make_manager(FakeMongoEngine(records=[doc]))
    _patch_tenant_lookup(monkeypatch, FakeMongoEngine(find_one_results=[None]))
    created_at = doc.comments[0].created_at.isoformat()

    _run(manager.delete_comment("d", created_at, _current_user()))

    assert doc.comments[0].is_deleted is True
    assert doc.comments[0].comment == ""


def test_resolve_doc_summary_returns_first_matching_loader(monkeypatch):
    manager = _make_manager(FakeMongoEngine())
    _patch_search(monkeypatch, FakeSearch(results={"leak": {"m_title": "Leak Title", "m_content": "body text", "m_date": "2026-01-01"}}))

    summary = _run(manager._resolve_doc_summary("doc-1"))

    assert summary["title"] == "Leak Title"
    assert summary["index_name"] == "leak_model"
    assert summary["route_path"] == "/dashboard/profile/consolidated/leak/doc-1"


def test_resolve_doc_summary_skips_errors_and_non_dicts(monkeypatch):
    manager = _make_manager(FakeMongoEngine())
    fake = FakeSearch(
        results={"exploit": "not-a-dict", "apt": {"m_name": "APT Report"}},
        errors={"leak": HTTPException(status_code=404), "general": HTTPException(status_code=500)},
    )
    _patch_search(monkeypatch, fake)

    summary = _run(manager._resolve_doc_summary("doc-2"))

    assert summary["index_name"] == "apt_model"
    assert summary["title"] == "APT Report"


def test_resolve_doc_summary_defaults_when_all_fail(monkeypatch):
    manager = _make_manager(FakeMongoEngine())
    fake = FakeSearch(errors={name: ValueError("boom") for name in ("leak", "general", "exploit", "apt", "malware", "chat", "social", "defacement")})
    _patch_search(monkeypatch, fake)

    summary = _run(manager._resolve_doc_summary("doc-3"))

    assert summary == {
        "title": "doc-3",
        "preview": "",
        "report_date": "",
        "route_path": "",
        "route_query": {},
        "index_name": "",
    }


def test_get_user_activity_aggregates_and_sorts(monkeypatch):
    now = datetime.now(UTC)
    doc1 = db_document_feedback_model(doc_id="doc-1")
    doc1.reactions.append(DocumentFeedbackReaction(user_id="u1", recommended=True, trust_state=FeedbackTrustState.TRUST, created_at=now, updated_at=now))
    doc1.comments.append(DocumentFeedbackComment(user_id="u1", comment="hi", created_at=now, updated_at=now))
    doc2 = db_document_feedback_model(doc_id="doc-2")
    doc2.comments.append(DocumentFeedbackComment(user_id="u1", comment="deleted", is_deleted=True, created_at=now - timedelta(days=1), updated_at=now - timedelta(days=1)))
    manager = _make_manager(FakeMongoEngine(records=[doc1, doc2]))

    async def fake_summary(doc_id):
        return {"title": doc_id, "preview": "", "report_date": "", "route_path": "", "route_query": {}, "index_name": ""}

    monkeypatch.setattr(manager, "_resolve_doc_summary", fake_summary)

    activity = _run(manager.get_user_activity("u1"))

    assert len(activity) == 2
    assert activity[0]["doc_id"] == "doc-1"
    assert activity[0]["recommended"] is True
    assert activity[0]["trust_state"] == "trust"
    assert activity[0]["comments_count"] == 1
    doc2_entry = next(item for item in activity if item["doc_id"] == "doc-2")
    assert doc2_entry["comments_count"] == 0


def test_get_public_profile_missing_user_raises_404():
    manager = _make_manager(FakeMongoEngine(find_one_results=[None]))

    with pytest.raises(HTTPException) as exc:
        _run(manager._get_public_profile("507f1f77bcf86cd799439011", _current_user()))

    assert exc.value.status_code == 404


def test_get_public_profile_forbidden_cross_tenant():
    user = _make_user(tenant_id="507f1f77bcf86cd799439099")
    manager = _make_manager(FakeMongoEngine(find_one_results=[user]))
    viewer = _current_user(role=user_role.MEMBER, tenant_id="507f1f77bcf86cd799439012")

    with pytest.raises(HTTPException) as exc:
        _run(manager._get_public_profile("507f1f77bcf86cd799439011", viewer))

    assert exc.value.status_code == 403


def test_get_public_profile_hidden_by_user_pref():
    user = _make_user(preferences={"profile_visible": False})
    manager = _make_manager(FakeMongoEngine(find_one_results=[user]))
    viewer = _current_user(id="someone-else", role=user_role.MEMBER)

    result = _run(manager._get_public_profile("507f1f77bcf86cd799439011", viewer))

    assert result == {"hidden": True, "message": "Profile hidden by user"}


def test_get_public_profile_hidden_by_tenant():
    user = _make_user(preferences={"profile_visible": True})
    tenant = _make_tenant(profile_visibility_enabled=False)
    manager = _make_manager(FakeMongoEngine(find_one_results=[user, tenant]))
    viewer = _current_user(id="someone-else", role=user_role.MEMBER)

    result = _run(manager._get_public_profile("507f1f77bcf86cd799439011", viewer))

    assert result == {"hidden": True, "message": "Profile hidden by tenant"}


def test_get_public_profile_visible_decrypts_tenant_name(monkeypatch):
    key = Fernet.generate_key()
    user = _make_user(preferences={"profile_visible": True}, licenses=[LicenseName.FREE])
    tenant = _make_tenant(name=_encrypt(key, "Acme"), profile_visibility_enabled=True)
    manager = _make_manager(FakeMongoEngine(find_one_results=[user, tenant]))
    _patch_key_manager(monkeypatch, key)
    viewer = _current_user(role=user_role.ADMIN)

    result = _run(manager._get_public_profile("507f1f77bcf86cd799439011", viewer))

    assert result["hidden"] is False
    assert result["tenant_name"] == "Acme"
    assert result["licenses"] == ["free"]


def test_get_public_profile_bad_tenant_name_cipher_yields_blank(monkeypatch):
    key = Fernet.generate_key()
    user = _make_user(preferences={"profile_visible": True})
    tenant = _make_tenant(name="not-a-cipher", profile_visibility_enabled=True)
    manager = _make_manager(FakeMongoEngine(find_one_results=[user, tenant]))
    _patch_key_manager(monkeypatch, key)
    viewer = _current_user(role=user_role.ADMIN)

    result = _run(manager._get_public_profile("507f1f77bcf86cd799439011", viewer))

    assert result["tenant_name"] == ""


def test_get_public_user_activity_hidden_returns_empty(monkeypatch):
    manager = _make_manager(FakeMongoEngine())

    async def fake_profile(user_id, current_user):
        return {"hidden": True, "message": "Profile hidden by user"}

    monkeypatch.setattr(manager, "_get_public_profile", fake_profile)

    result = _run(manager.get_public_user_activity("507f1f77bcf86cd799439011", _current_user()))

    assert result["activity"] == []
    assert result["profile"]["hidden"] is True


def test_get_public_user_activity_visible_includes_activity(monkeypatch):
    manager = _make_manager(FakeMongoEngine())

    async def fake_profile(user_id, current_user):
        return {"hidden": False, "username": "alice"}

    async def fake_activity(user_id):
        return [{"doc_id": "doc-1"}]

    monkeypatch.setattr(manager, "_get_public_profile", fake_profile)
    monkeypatch.setattr(manager, "get_user_activity", fake_activity)

    result = _run(manager.get_public_user_activity("507f1f77bcf86cd799439011", _current_user()))

    assert result["activity"] == [{"doc_id": "doc-1"}]
