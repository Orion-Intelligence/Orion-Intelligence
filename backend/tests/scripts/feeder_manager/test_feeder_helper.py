from __future__ import annotations

from pathlib import Path

import pytest
from bson import ObjectId
from fastapi import HTTPException

from orion.api.interactive.feeder_manager.feeder_helper import FeederHelper
from orion.api.interactive.feeder_manager.models.feeder_models import FeederScriptItem
from orion.constants import constant
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.permission_manager.permission_models import UserPermission
from tests.model.fakes import FakeMongoEngine
from tests.scripts.feeder_manager.fakes import FeederFindEngine
from tests.scripts.feeder_manager.helpers import _feeder, _make_helper, _record, _run, _user


SEED_SCRIPT = (
    "class Parser:\n"
    "    @property\n"
    "    def seed_url(self) -> str:\n"
    "        return \"https://seed.example/path\"\n"
)

RULE_CONFIG_SHARED = (
    "class Parser:\n"
    "    def rule_config(self) -> RuleConfig:\n"
    "        m_rule_type = RuleType.SHARED\n"
)


def test_sanitize_file_name_variants():
    assert FeederHelper.sanitize_file_name("My Script!.py") == "_my-script.py"
    assert FeederHelper.sanitize_file_name("already_ok.txt") == "_already_ok.txt"
    assert FeederHelper.sanitize_file_name("!!!.py") == "_script.py"
    assert FeederHelper.sanitize_file_name("_kept.py") == "_kept.py"


def test_sanitize_support_file_name():
    assert FeederHelper.sanitize_support_file_name("_my_script.py", "session.zip") == "_my_script_session.zip"
    assert FeederHelper.sanitize_support_file_name("!!!", "x") == "script_session"


def test_resolve_target_dir(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.resolve_target_dir("cat", FeederHelper.ROOT_SUBCATEGORY) == tmp_path / "cat"
    assert helper.resolve_target_dir("cat", "sub") == tmp_path / "cat" / "sub"


def test_safe_relative_path_branches(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.safe_relative_path(tmp_path / "cat" / "file.py") == Path("cat/file.py")
    assert helper.safe_relative_path(tmp_path / "cat" / ".." / "x") is None
    assert helper.safe_relative_path(Path("/somewhere/else/file.py")) is None
    assert helper.safe_relative_path(Path("plain/file.py")) == Path("plain/file.py")


def test_parser_file_path_valid_and_missing(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    target = tmp_path / "cat" / "file.py"
    target.parent.mkdir(parents=True)
    target.write_text("x", encoding="utf-8")
    assert helper.parser_file_path(target) == target.resolve()
    assert helper.parser_file_path(tmp_path / "cat" / "missing.py") is None
    assert helper.parser_file_path(tmp_path / "cat" / ".." / "x") is None


def test_rule_path_parts_branches(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.rule_path_parts("cat/sub") == ("cat", "sub")
    assert helper.rule_path_parts("cat") == ("cat", FeederHelper.ROOT_SUBCATEGORY)
    with pytest.raises(HTTPException) as e1:
        helper.rule_path_parts(None)
    assert e1.value.status_code == 400
    with pytest.raises(HTTPException):
        helper.rule_path_parts("/abs/path")
    with pytest.raises(HTTPException):
        helper.rule_path_parts("cat/../bad")


def test_extract_seed_url(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.extract_seed_url(SEED_SCRIPT) == "https://seed.example/path"
    with pytest.raises(HTTPException) as exc:
        helper.extract_seed_url("no seed here")
    assert exc.value.status_code == 400


def test_validate_rule_config_rule_type(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    helper.validate_rule_config_rule_type(RULE_CONFIG_SHARED, "shared")
    with pytest.raises(HTTPException):
        helper.validate_rule_config_rule_type(RULE_CONFIG_SHARED, "unique")
    with pytest.raises(HTTPException):
        helper.validate_rule_config_rule_type("no rule_config", "shared")


def test_normalize_value_lines(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    result = helper.normalize_value_lines("example.com\n\n   \nhttps://ok.com\n")
    assert result == ["https://example.com", "https://ok.com"]
    with pytest.raises(HTTPException):
        helper.normalize_value_lines("https://bad url/space")


def test_validate_rule_value():
    FeederHelper.validate_rule_value("https://ok.com", None)
    FeederHelper.validate_rule_value("https://ok.com", {"value_regex": r"https://ok\.com"})
    with pytest.raises(HTTPException):
        FeederHelper.validate_rule_value("https://nope.com", {"value_regex": r"https://ok\.com"})


def test_current_rule_values(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    records = [
        _record(rule_key="shared", values=[{"url": "https://a.com"}, {"url": "https://a.com"}, {"url": None}]),
        _record(rule_key="other", values=[{"url": "https://b.com"}]),
    ]
    assert helper.current_rule_values(records, "shared", "shared") == ["https://a.com"]
    assert helper.current_rule_values(records, "shared", "unique") == []


def test_filter_records(tmp_path, monkeypatch):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    monkeypatch.setattr(constant, "url_rules", {
        "shared": {"rule_type": "shared"},
        "generic": {"rule_type": "generic"},
        "unique": {"rule_type": "unique"},
    })
    script = _record(rule_key="unique", entry_kind="script")
    value_rec = _record(rule_key="generic", entry_kind="values", values=[{"url": "https://x.com"}])
    shared_with_values = _record(rule_key="shared", entry_kind="script", values=[{"url": "https://y.com"}])
    generic_script = _record(rule_key="generic", entry_kind="script")
    records = [script, value_rec, shared_with_values, generic_script]

    values_only = helper.filter_records(records, "values")
    assert value_rec in values_only and shared_with_values in values_only and script not in values_only

    scripts_only = helper.filter_records(records, "scripts")
    assert script in scripts_only and value_rec not in scripts_only

    all_records = helper.filter_records(records, "all")
    assert value_rec in all_records
    assert generic_script not in all_records
    assert script in all_records


def test_normalize_urls():
    assert FeederHelper.normalize_urls(["a", "b", "a", "c"]) == ["a", "b", "c"]


def test_merge_and_replace_value_entries(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    existing = [
        {"url": "https://a.com", "status": "success", "last_error": None},
        {"url": "", "status": "x"},
    ]
    merged = helper.merge_value_entries(existing, ["https://a.com", "https://b.com"])
    urls = [entry["url"] for entry in merged]
    assert urls == ["https://a.com", "https://b.com"]
    assert merged[1]["status"] == "pending"

    replaced = helper.replace_value_entries(existing, ["https://b.com", "https://a.com"])
    assert [entry["url"] for entry in replaced] == ["https://b.com", "https://a.com"]
    assert replaced[1]["status"] == "success"


def test_value_record_name():
    assert FeederHelper.value_record_name("shared") == "_shared__values"


def test_replace_rule_values_shared(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    record = _record(rule_key="shared", entry_kind="script", values=[])
    engine = FeederFindEngine(find_one_results=[record])
    helper = _make_helper(tmp_path, engine)
    _run(helper.replace_rule_values("shared", ["https://a.com"], _user()))
    assert engine.saved == [record]
    assert record.values[0]["url"] == "https://a.com"


def test_replace_rule_values_shared_missing_script(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    engine = FeederFindEngine(find_one_results=[None])
    helper = _make_helper(tmp_path, engine)
    with pytest.raises(HTTPException) as exc:
        _run(helper.replace_rule_values("shared", ["https://a.com"], _user()))
    assert exc.value.status_code == 400


def test_replace_rule_values_generic_delete_and_replace(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"generic": {"rule_type": "generic"}})
    record = _record(rule_key="generic", entry_kind="values", values=[{"url": "https://old.com"}])
    engine = FeederFindEngine(find_one_results=[record])
    helper = _make_helper(tmp_path, engine)
    _run(helper.replace_rule_values("generic", [], _user()))
    assert engine.deleted == [record]

    record2 = _record(rule_key="generic", entry_kind="values", values=[{"url": "https://old.com"}])
    engine2 = FeederFindEngine(find_one_results=[record2])
    helper2 = _make_helper(tmp_path, engine2)
    _run(helper2.replace_rule_values("generic", ["https://new.com"], _user()))
    assert record2.values[0]["url"] == "https://new.com"
    assert engine2.saved == [record2]


def test_replace_rule_values_generic_empty_no_record(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"generic": {"rule_type": "generic"}})
    engine = FeederFindEngine(find_one_results=[None])
    helper = _make_helper(tmp_path, engine)
    _run(helper.replace_rule_values("generic", [], _user()))
    assert engine.saved == []


def test_replace_rule_values_create_new(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"tenant": {"rule_type": "tenant"}})
    engine = FeederFindEngine(find_one_results=[None])
    helper = _make_helper(tmp_path, engine)
    _run(helper.replace_rule_values("tenant", ["https://a.com"], _user()))
    assert len(engine.saved) == 1
    saved = engine.saved[0]
    assert saved.name == "_tenant__values"
    assert saved.values[0]["url"] == "https://a.com"


def test_replace_rule_values_existing_non_shared(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"tenant": {"rule_type": "tenant"}})
    record = _record(rule_key="tenant", entry_kind="script", url="https://x", values=[])
    engine = FeederFindEngine(find_one_results=[record])
    helper = _make_helper(tmp_path, engine)
    _run(helper.replace_rule_values("tenant", ["https://a.com"], _user()))
    assert record.url is None
    assert record.entry_kind == "values"


def test_encrypt_decrypt_roundtrip_and_error(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    token = helper.encrypt_script_content("secret = 1")
    assert helper.decrypt_script_content(token) == "secret = 1"
    with pytest.raises(HTTPException) as exc:
        helper.decrypt_script_content("not-a-token")
    assert exc.value.status_code == 500


def test_process_upload_new_record(tmp_path, monkeypatch):
    engine = FeederFindEngine(find_one_results=[None])
    helper = _make_helper(tmp_path, engine)
    item = _run(helper.process_upload(
        rule_key="shared",
        category_key="cat",
        subcategory_key=FeederHelper.ROOT_SUBCATEGORY,
        file_name="feed.py",
        content="print(1)",
        current_user=_user(),
        url="https://seed",
        session_file_name="s.zip",
        session_content=b"zip-bytes",
    ))
    assert isinstance(item, FeederScriptItem)
    assert len(engine.saved) == 1
    written = list((tmp_path / "cat").glob("*.py"))
    assert written


def test_process_upload_existing_owner_conflict(tmp_path):
    existing = _record(name="_feed.py", feeder=_feeder(author_id="other-owner"))
    engine = FeederFindEngine(find_one_results=[existing])
    helper = _make_helper(tmp_path, engine)
    with pytest.raises(HTTPException) as exc:
        _run(helper.process_upload(
            rule_key="shared",
            category_key="cat",
            subcategory_key=FeederHelper.ROOT_SUBCATEGORY,
            file_name="feed.py",
            content="print(1)",
            current_user=_user(role=user_role.MEMBER, user_id="507f1f77bcf86cd799439012"),
        ))
    assert exc.value.status_code == 409


def test_process_upload_existing_update(tmp_path):
    existing = _record(name="_feed.py", feeder=_feeder(author_id="507f1f77bcf86cd799439011"))
    engine = FeederFindEngine(find_one_results=[existing])
    helper = _make_helper(tmp_path, engine)
    item = _run(helper.process_upload(
        rule_key="shared",
        category_key="cat",
        subcategory_key=FeederHelper.ROOT_SUBCATEGORY,
        file_name="feed.py",
        content="print(1)",
        current_user=_user(),
    ))
    assert existing.entry_kind == "script"
    assert engine.saved == [existing]
    assert isinstance(item, FeederScriptItem)


def test_script_query_variants():
    admin = _user(role=user_role.ADMIN)
    assert FeederHelper.script_query(admin) == {}
    assert FeederHelper.script_query(admin, "shared") == {"rule_key": "shared"}

    member = _user(role=user_role.MEMBER, user_id="507f1f77bcf86cd799439011")
    q = FeederHelper.script_query(member)
    assert q["feeder.author_id"] == str(member.id)

    monitor = _user(role=user_role.MEMBER, permissions=[UserPermission.MONITORING], user_id="507f1f77bcf86cd799439011")
    assert FeederHelper.script_query(monitor) == {}


def test_resolve_record_file_path(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    (tmp_path / "cat").mkdir()
    target = tmp_path / "cat" / "_feed.py"
    target.write_text("x", encoding="utf-8")
    record = _record(name="_feed.py")
    assert helper.resolve_record_file_path(record) == target

    missing = _record(name="_nope.py")
    assert helper.resolve_record_file_path(missing) == tmp_path / "_nope.py"


def test_path_metadata_file_and_missing(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    nested = tmp_path / "cat" / "sub" / "_feed.py"
    nested.parent.mkdir(parents=True)
    nested.write_text("x", encoding="utf-8")
    record = _record(name="_feed.py")
    meta = helper.path_metadata(record, nested)
    assert meta["category_key"] == "cat"
    assert meta["subcategory_key"] == "sub"
    assert meta["created_at"] is not None

    missing = _record(name="_gone.py")
    meta2 = helper.path_metadata(missing, tmp_path / "_gone.py")
    assert meta2["relative_path"] == "_gone.py"
    assert meta2["created_at"] is None


def test_shared_rule_script_path(tmp_path, monkeypatch):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.shared_rule_script_path(None) is None
    monkeypatch.setattr(constant, "url_rules", {"norule": {}, "shared": {"path": "cat/sub"}})
    assert helper.shared_rule_script_path("norule") is None
    target_dir = tmp_path / "cat" / "sub"
    target_dir.mkdir(parents=True)
    script_name = FeederHelper.sanitize_file_name("shared.py")
    (target_dir / script_name).write_text("x", encoding="utf-8")
    assert helper.shared_rule_script_path("shared") == (target_dir / script_name).resolve()


def test_shared_content_path(tmp_path, monkeypatch):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.shared_content_path(_record(entry_kind="values")) is None
    assert helper.shared_content_path(_record(entry_kind="script", url=None)) is None
    monkeypatch.setattr(constant, "url_rules", {"shared": {"path": "cat"}})
    record = _record(entry_kind="script", url="https://x", rule_key="shared")
    assert helper.shared_content_path(record) is None


def test_item_content_has_file_and_shared_and_none(tmp_path, monkeypatch):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    (tmp_path / "cat").mkdir()
    target = tmp_path / "cat" / "_feed.py"
    token = helper.encrypt_script_content("body = 1")
    target.write_bytes(token.encode())
    record = _record(name="_feed.py")
    assert helper.item_content(record, True, target) == "body = 1"

    monkeypatch.setattr(constant, "url_rules", {"shared": {"path": "cat"}})
    shared_target = tmp_path / "cat" / FeederHelper.sanitize_file_name("shared.py")
    shared_target.write_bytes(helper.encrypt_script_content("shared = 2").encode())
    shared_record = _record(name="_other.py", entry_kind="script", url="https://x", rule_key="shared")
    assert helper.item_content(shared_record, False, tmp_path / "cat" / "_other.py") == "shared = 2"

    none_record = _record(entry_kind="values", url=None)
    assert helper.item_content(none_record, False, tmp_path / "none.py") is None


def test_session_file_name(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    assert helper.session_file_name(tmp_path / "missing.py") is None

    (tmp_path / "cat").mkdir()
    target = tmp_path / "cat" / "_feed.py"
    target.write_text("x", encoding="utf-8")
    (tmp_path / "cat" / "_feed_session.zip").write_text("s", encoding="utf-8")
    assert helper.session_file_name(target) == "_feed_session.zip"

    exact = tmp_path / "cat" / "_plain.py"
    exact.write_text("x", encoding="utf-8")
    (tmp_path / "cat" / "_plain_session").write_text("s", encoding="utf-8")
    assert helper.session_file_name(exact) == "_plain_session"

    legacy = tmp_path / "cat" / "_leg.py"
    legacy.write_text("x", encoding="utf-8")
    (tmp_path / "cat" / "leg_session.enc").write_text("s", encoding="utf-8")
    assert helper.session_file_name(legacy) == "leg_session.enc"


def test_to_script_item_with_file_and_values(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    nested = tmp_path / "cat" / "sub" / "_feed.py"
    nested.parent.mkdir(parents=True)
    nested.write_bytes(helper.encrypt_script_content("body = 1").encode())
    record = _record(
        name="_feed.py",
        rule_key="shared",
        entry_kind="script",
        url="https://x",
        values=[{"url": "https://v.com", "status": "success"}, {"url": ""}],
    )
    item = _run(helper.to_script_item(record))
    assert item.file_name == "_feed.py"
    assert item.category_key == "cat"
    assert item.content == "body = 1"
    assert [v.url for v in item.values] == ["https://v.com"]


def test_to_script_item_without_file(tmp_path):
    helper = _make_helper(tmp_path, FakeMongoEngine())
    record = _record(name="_ghost.py", entry_kind="values", feeder=None)
    record.feeder = _feeder(index_status=False)
    item = _run(helper.to_script_item(record))
    assert item.file_name == "_ghost.py"
    assert item.category_key == ""
    assert item.enabled is False


def test_get_script_record_branches(tmp_path):
    helper = _make_helper(tmp_path, FeederFindEngine())
    with pytest.raises(HTTPException) as bad_id:
        _run(helper.get_script_record("not-an-id", _user()))
    assert bad_id.value.status_code == 404

    helper2 = _make_helper(tmp_path, FeederFindEngine(find_one_results=[None]))
    with pytest.raises(HTTPException):
        _run(helper2.get_script_record(str(ObjectId()), _user()))

    no_feeder = _record()
    no_feeder.feeder = None
    helper3 = _make_helper(tmp_path, FeederFindEngine(find_one_results=[no_feeder]))
    with pytest.raises(HTTPException):
        _run(helper3.get_script_record(str(ObjectId()), _user()))

    other_owner = _record(feeder=_feeder(author_id="zzz"))
    helper4 = _make_helper(tmp_path, FeederFindEngine(find_one_results=[other_owner]))
    with pytest.raises(HTTPException):
        _run(helper4.get_script_record(str(ObjectId()), _user(role=user_role.MEMBER, user_id="507f1f77bcf86cd799439011")))

    owned = _record(feeder=_feeder(author_id="507f1f77bcf86cd799439011"))
    helper5 = _make_helper(tmp_path, FeederFindEngine(find_one_results=[owned]))
    result = _run(helper5.get_script_record(str(ObjectId()), _user()))
    assert result is owned
