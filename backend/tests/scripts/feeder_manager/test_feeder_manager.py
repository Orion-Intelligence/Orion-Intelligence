from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from orion.api.interactive.feeder_manager.feeder_helper import FeederHelper
from orion.api.interactive.feeder_manager.models.feeder_models import (
    FeederOwnerTransferRequest,
    FeederScriptItem,
    FeederScriptStatusUpdateRequest,
    FeederValueDeleteRequest,
)
from orion.constants import constant
from orion.services.mongo_manager.shared_model.db_auth_models import (
    LicenseName,
    UserStatus,
    user_role,
)
from tests.model.fakes import FakeMongoEngine
from tests.scripts.feeder_manager.fakes import FeederFindEngine
from tests.scripts.feeder_manager.helpers import _feeder, _make_helper, _make_manager, _record, _run, _user


class FakeUpload:
    def __init__(self, filename=None, content=b"", size=None):
        self.filename = filename
        self._content = content
        self.size = size

    async def read(self, n=-1):
        if n is None or n < 0:
            return self._content
        return self._content[:n]


def _item(record):
    return FeederScriptItem(id=str(record.id), file_name=record.name, category_key="", subcategory_key=FeederHelper.ROOT_SUBCATEGORY)


def _build(tmp_path, engine=None, helper_engine=None):
    engine = engine if engine is not None else FakeMongoEngine()
    helper = _make_helper(tmp_path, helper_engine if helper_engine is not None else engine)
    return _make_manager(engine, helper), engine, helper


def test_read_limited_session_file(tmp_path):
    manager, _, _ = _build(tmp_path)
    big = FakeUpload(size=FeederHelper.MAX_FILE_SIZE + 1)
    with pytest.raises(HTTPException):
        _run(manager._read_limited_session_file(big))

    overflow = FakeUpload(content=b"x" * (FeederHelper.MAX_FILE_SIZE + 5))
    with pytest.raises(HTTPException):
        _run(manager._read_limited_session_file(overflow))

    ok = FakeUpload(content=b"small")
    assert _run(manager._read_limited_session_file(ok)) == b"small"


def test_get_catalog(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {
        "shared": {"rule_type": "shared", "path": "cat"},
        "unique": {"rule_type": "unique", "path": "cat2"},
    })
    record = _record(rule_key="shared", entry_kind="script", values=[{"url": "https://a.com"}])
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=[record]))
    catalog = _run(manager.get_catalog(_user()))
    keys = {rule.key for rule in catalog.rules}
    assert keys == {"shared", "unique"}
    shared_rule = next(r for r in catalog.rules if r.key == "shared")
    assert shared_rule.values == ["https://a.com"]


def test_list_scripts_paging(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    records = [_record(name=f"_s{i}.py", rule_key="shared", entry_kind="script") for i in range(3)]
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=records))
    resp = _run(manager.list_scripts(_user(), rule_key="shared", page=1, limit=2, entry_type="scripts"))
    assert resp.total == 3
    assert len(resp.scripts) == 2
    assert resp.has_more is True


def test_upload_script_invalid_rule(tmp_path):
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException) as exc:
        _run(manager.upload_script("nope", "values", None, "", None, _user()))
    assert exc.value.status_code == 400


def test_upload_script_values_wrong_rule_type(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"unique": {"rule_type": "unique"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("unique", "values", None, "https://a.com", None, _user()))


def test_upload_script_values_shared_requires_script(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=[]))
    with pytest.raises(HTTPException) as exc:
        _run(manager.upload_script("shared", "values", None, "https://a.com", None, _user()))
    assert exc.value.status_code == 400


def test_upload_script_values_success(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"generic": {"rule_type": "generic"}})
    manager, _, helper = _build(tmp_path)
    calls = []

    async def _replace(rule_key, urls, user):
        calls.append((rule_key, urls))

    helper.replace_rule_values = _replace
    resp = _run(manager.upload_script("generic", "values", None, "example.com\nhttps://b.com", None, _user()))
    assert resp.message == "Rule values updated successfully"
    assert calls[0][1] == ["https://example.com", "https://b.com"]


def test_upload_script_invalid_mode(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "weird", None, None, None, _user()))


def test_upload_script_generic_file_rejected(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"generic": {"rule_type": "generic"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("generic", "file", FakeUpload("x.py", b"a"), None, None, _user()))


def test_upload_script_session_not_zip(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "file", None, None, FakeUpload("s.txt", b"a"), _user()))


def test_upload_script_session_without_file_success(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared", "path": "cat"}})
    (tmp_path / "cat").mkdir()
    script_path = tmp_path / "cat" / "_feed.py"
    script_path.write_text("x", encoding="utf-8")
    record = _record(name="_feed.py", rule_key="shared", entry_kind="script")
    manager, _, helper = _build(tmp_path, FakeMongoEngine(records=[record]))

    async def _item_stub(rec):
        return _item(rec)

    helper.to_script_item = _item_stub
    session = FakeUpload("session.zip", b"zipdata")
    resp = _run(manager.upload_script("shared", "file", None, None, session, _user()))
    assert resp.message == "Session file uploaded successfully"
    assert list((tmp_path / "cat").glob("*_session.zip"))


def test_upload_script_session_without_file_no_scripts(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared", "path": "cat"}})
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=[]))
    session = FakeUpload("session.zip", b"zipdata")
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "file", None, None, session, _user()))


def test_upload_script_non_python(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared", "path": "cat"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "file", FakeUpload("x.txt", b"a"), None, None, _user()))


def test_upload_script_empty_file(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared", "path": "cat"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "file", FakeUpload("x.py", b""), None, None, _user()))


def test_upload_script_too_large(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared", "path": "cat"}})
    manager, _, _ = _build(tmp_path)
    big = FakeUpload("x.py", b"a" * (FeederHelper.MAX_FILE_SIZE + 1))
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "file", big, None, None, _user()))


def test_upload_script_non_utf8(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared", "path": "cat"}})
    manager, _, _ = _build(tmp_path)
    with pytest.raises(HTTPException):
        _run(manager.upload_script("shared", "file", FakeUpload("x.py", b"\xff\xfe"), None, None, _user()))


def test_upload_script_file_success_unique(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"unique": {"rule_type": "unique", "path": "cat"}})
    manager, _, helper = _build(tmp_path)

    helper.validate_rule_config_rule_type = lambda content, rule_key: None
    helper.extract_seed_url = lambda content: "https://seed.example"

    async def _process(**kwargs):
        assert kwargs["url"] == "https://seed.example"
        return _item(_record())

    helper.process_upload = _process
    resp = _run(manager.upload_script("unique", "file", FakeUpload("feed.py", b"print(1)"), None, None, _user()))
    assert resp.message == "Feeder script uploaded successfully"


def test_delete_script(tmp_path):
    record = _record(name="_gone.py")
    manager, engine, helper = _build(tmp_path)

    async def _get(script_id, user):
        return record

    helper.get_script_record = _get
    resp = _run(manager.delete_script(str(record.id), _user()))
    assert resp["message"] == "Feeder script deleted successfully"
    assert engine.deleted == [record]


def test_delete_value_branches(tmp_path):
    manager, engine, helper = _build(tmp_path)

    empty = _record(values=[])

    async def _get_empty(script_id, user):
        return empty

    helper.get_script_record = _get_empty
    with pytest.raises(HTTPException):
        _run(manager.delete_value("id", FeederValueDeleteRequest(value="https://a.com"), _user()))

    rec = _record(values=[{"url": "https://a.com"}, {"url": "https://b.com"}])

    async def _get(script_id, user):
        return rec

    helper.get_script_record = _get
    with pytest.raises(HTTPException):
        _run(manager.delete_value("id", FeederValueDeleteRequest(value="   "), _user()))
    with pytest.raises(HTTPException):
        _run(manager.delete_value("id", FeederValueDeleteRequest(value="https://missing.com"), _user()))

    resp = _run(manager.delete_value("id", FeederValueDeleteRequest(value="https://a.com"), _user()))
    assert resp["message"] == "Value deleted successfully"
    assert rec.values == [{"url": "https://b.com"}]
    assert engine.saved == [rec]


def test_delete_value_removes_last_deletes_record(tmp_path):
    rec = _record(values=[{"url": "https://a.com"}])
    manager, engine, helper = _build(tmp_path)

    async def _get(script_id, user):
        return rec

    helper.get_script_record = _get
    _run(manager.delete_value("id", FeederValueDeleteRequest(value="https://a.com"), _user()))
    assert engine.deleted == [rec]


def test_delete_all_values(tmp_path):
    manager, engine, helper = _build(tmp_path)
    empty = _record(values=[])

    async def _get_empty(script_id, user):
        return empty

    helper.get_script_record = _get_empty
    with pytest.raises(HTTPException):
        _run(manager.delete_all_values("id", _user()))

    values_rec = _record(entry_kind="values", values=[{"url": "https://a.com"}])

    async def _get_values(script_id, user):
        return values_rec

    helper.get_script_record = _get_values
    _run(manager.delete_all_values("id", _user()))
    assert engine.deleted == [values_rec]

    script_rec = _record(entry_kind="script", values=[{"url": "https://a.com"}])

    async def _get_script(script_id, user):
        return script_rec

    helper.get_script_record = _get_script
    _run(manager.delete_all_values("id", _user()))
    assert script_rec.values == []
    assert script_rec in engine.saved


def test_clear_scripts(tmp_path):
    manager, engine, _ = _build(tmp_path, FakeMongoEngine(records=[_record(name="_a.py"), _record(name="_b.py")]))
    with pytest.raises(HTTPException):
        _run(manager.clear_scripts("", _user()))

    resp = _run(manager.clear_scripts("shared", _user()))
    assert "deleted successfully" in resp["message"]
    assert len(engine.deleted) == 2


def test_set_rule_enabled(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"shared": {"rule_type": "shared"}})
    with_feeder = _record(rule_key="shared", entry_kind="script", feeder=_feeder(index_status=False))
    no_feeder = _record(rule_key="shared", entry_kind="script")
    no_feeder.feeder = None
    manager, engine, _ = _build(tmp_path, FakeMongoEngine(records=[with_feeder, no_feeder]))

    with pytest.raises(HTTPException):
        _run(manager.set_rule_enabled("", True, _user()))

    resp = _run(manager.set_rule_enabled("shared", True, _user()))
    assert "enabled" in resp["message"]
    assert with_feeder.feeder.index_status is True
    assert engine.saved == [with_feeder]


def test_toggle_script_enabled(tmp_path):
    manager, engine, helper = _build(tmp_path)

    no_feeder = _record()
    no_feeder.feeder = None

    async def _get_nf(script_id, user):
        return no_feeder

    helper.get_script_record = _get_nf
    with pytest.raises(HTTPException):
        _run(manager.toggle_script_enabled("id", _user()))

    value_rec = _record(entry_kind="values")

    async def _get_val(script_id, user):
        return value_rec

    helper.get_script_record = _get_val
    with pytest.raises(HTTPException):
        _run(manager.toggle_script_enabled("id", _user()))

    script_rec = _record(entry_kind="script", feeder=_feeder(index_status=True))

    async def _get_script(script_id, user):
        return script_rec

    helper.get_script_record = _get_script

    async def _item_stub(rec):
        return _item(rec)

    helper.to_script_item = _item_stub
    resp = _run(manager.toggle_script_enabled("id", _user()))
    assert script_rec.feeder.index_status is False
    assert "disabled" in resp["message"]


def test_list_owner_users(tmp_path):
    from types import SimpleNamespace
    users = [
        SimpleNamespace(id="u1", username="admin", email="a@x.com", role=user_role.ADMIN, status=UserStatus.ACTIVE, licenses=[LicenseName.FEEDER]),
        SimpleNamespace(id="u2", username="mem", email="m@x.com", role=user_role.MEMBER, status=None, licenses=None),
    ]
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=users))
    result = _run(manager.list_owner_users())
    assert [u.id for u in result] == ["u1", "u2"]
    assert result[1].status is None


def test_get_value_crawl_status(tmp_path):
    now = datetime.now(timezone.utc)
    record = _record(name="_vals", values=[
        {"url": "https://active.com/", "last_checked_at": now - timedelta(days=2)},
        {"url": "https://stale.com", "last_success_date": now - timedelta(days=20)},
        {"url": "https://old.com", "last_failure_date": now - timedelta(days=50)},
        {"url": "https://none.com", "last_checked_at": None},
    ])
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=[record], find_one_results=[record, record, record, record, record]))

    assert _run(manager.get_value_crawl_status("_vals", "https://active.com"))["status"] == "active"
    assert _run(manager.get_value_crawl_status("_vals", "https://stale.com"))["status"] == "stale"
    assert _run(manager.get_value_crawl_status("_vals", "https://old.com"))["status"] == "inactive"
    assert _run(manager.get_value_crawl_status("_vals", "https://none.com"))["status"] == "inactive"
    assert _run(manager.get_value_crawl_status("_vals", "https://absent.com"))["status"] == "inactive"


def test_get_value_crawl_status_no_record(tmp_path):
    manager, _, _ = _build(tmp_path, FakeMongoEngine(records=[], find_one_results=[None]))
    assert _run(manager.get_value_crawl_status("x", "https://a.com"))["status"] == "inactive"


def test_transfer_script_owner(tmp_path):
    from types import SimpleNamespace
    record = _record(feeder=_feeder())
    manager, _, helper = _build(tmp_path)

    async def _get(script_id, user):
        return record

    helper.get_script_record = _get

    async def _item_stub(rec):
        return _item(rec)

    helper.to_script_item = _item_stub

    with pytest.raises(HTTPException):
        _run(manager.transfer_script_owner("id", FeederOwnerTransferRequest(user_id="bad-id"), _user()))

    manager2, engine2, helper2 = _build(tmp_path, FakeMongoEngine(find_one_results=[None]))
    helper2.get_script_record = _get
    helper2.to_script_item = _item_stub
    with pytest.raises(HTTPException):
        _run(manager2.transfer_script_owner("id", FeederOwnerTransferRequest(user_id="507f1f77bcf86cd799439011"), _user()))

    bad_user = SimpleNamespace(id="u2", username="x", role=user_role.CRAWLER, status=UserStatus.ACTIVE, licenses=[])
    manager3, _, helper3 = _build(tmp_path, FakeMongoEngine(find_one_results=[bad_user]))
    helper3.get_script_record = _get
    helper3.to_script_item = _item_stub
    with pytest.raises(HTTPException):
        _run(manager3.transfer_script_owner("id", FeederOwnerTransferRequest(user_id="507f1f77bcf86cd799439011"), _user()))

    no_license = SimpleNamespace(id="u3", username="y", role=user_role.MEMBER, status=UserStatus.ACTIVE, licenses=[])
    manager4, _, helper4 = _build(tmp_path, FakeMongoEngine(find_one_results=[no_license]))
    helper4.get_script_record = _get
    helper4.to_script_item = _item_stub
    with pytest.raises(HTTPException):
        _run(manager4.transfer_script_owner("id", FeederOwnerTransferRequest(user_id="507f1f77bcf86cd799439011"), _user()))

    good_user = SimpleNamespace(id="u4", username="owner", role=user_role.MEMBER, status=UserStatus.ACTIVE, licenses=[LicenseName.FEEDER])
    manager5, engine5, helper5 = _build(tmp_path, FakeMongoEngine(find_one_results=[good_user]))
    helper5.get_script_record = _get
    helper5.to_script_item = _item_stub
    resp = _run(manager5.transfer_script_owner("id", FeederOwnerTransferRequest(user_id="507f1f77bcf86cd799439011"), _user()))
    assert resp["message"] == "Script owner updated successfully"
    assert record.feeder.author_name == "owner"


def test_strip_embedding_helpers(tmp_path):
    manager, _, _ = _build(tmp_path)
    assert manager._strip_embedding_from_message("") == ""
    assert manager._strip_embedding_from_message("plain text") == "plain text"
    stripped = manager._strip_embedding_from_message('{"m_embedding": [1, 2], "a": 3}')
    assert "m_embedding" not in stripped
    listed = manager._strip_embedding_field([{"m_embedding": 1, "b": 2}])
    assert listed == [{"b": 2}]


def test_update_script_status_success_script(tmp_path):
    record = _record(rule_key="shared", entry_kind="script", url="https://u.com", values=[], feeder=_feeder())
    engine = FeederFindEngine(find_one_results=[record], find_results=[[]])
    manager, _, _ = _build(tmp_path, engine)
    resp = _run(manager.update_script_status_by_name(FeederScriptStatusUpdateRequest(name="feed", url="https://u.com", status="success", message="ok")))
    assert resp["message"] == "Feeder script marked as success successfully"
    assert record.feeder.last_success_date is not None
    assert engine.saved == [record]


def test_update_script_status_failure_value(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"generic": {"rule_type": "generic"}})
    value_record = _record(rule_key="generic", entry_kind="values", url=None, values=[{"url": "https://v.com"}], feeder=_feeder())
    engine = FeederFindEngine(
        find_one_results=[None, None, None],
        find_results=[[value_record], []],
    )
    manager, _, _ = _build(tmp_path, engine)
    resp = _run(manager.update_script_status_by_name(FeederScriptStatusUpdateRequest(name="", url="https://v.com", status="failure", message="boom")))
    assert resp["message"] == "Feeder script marked as failure successfully"
    assert value_record.values[0]["status"] == "failure"
    assert value_record.feeder.last_failure_date is not None


def test_update_script_status_candidate_name(tmp_path, monkeypatch):
    monkeypatch.setattr(constant, "url_rules", {"unique": {"rule_type": "unique"}})
    candidate = _record(rule_key="unique", entry_kind="script", url=None, values=[], feeder=_feeder())
    engine = FeederFindEngine(
        find_one_results=[None, None, candidate],
        find_results=[[]],
    )
    manager, _, _ = _build(tmp_path, engine)
    resp = _run(manager.update_script_status_by_name(FeederScriptStatusUpdateRequest(name="feed", url="https://u.com", status="success")))
    assert resp["message"] == "Feeder script marked as success successfully"
    assert engine.saved == [candidate]


def test_update_script_status_not_found(tmp_path):
    engine = FeederFindEngine(find_one_results=[None, None], find_results=[[], []])
    manager, _, _ = _build(tmp_path, engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_script_status_by_name(FeederScriptStatusUpdateRequest(name="ghost", url="https://x.com", status="success")))
    assert exc.value.status_code == 404


def test_update_script_status_invalid_status(tmp_path):
    record = _record(rule_key="shared", entry_kind="script", url="https://u.com", values=[], feeder=_feeder())
    engine = FeederFindEngine(find_one_results=[record], find_results=[[]])
    manager, _, _ = _build(tmp_path, engine)
    with pytest.raises(HTTPException) as exc:
        _run(manager.update_script_status_by_name(FeederScriptStatusUpdateRequest(name="feed", url="https://u.com", status="weird")))
    assert exc.value.status_code == 400
