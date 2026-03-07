from __future__ import annotations

from pathlib import Path

import pytest
from pydantic import ValidationError

from orion.api.server.crawl_manager.class_model.CTITextRequest import CTITextRequest
from orion.api.server.crawl_manager.class_model.__init__ import (
    DefacementDataModel,
    DumpModel,
    ExploitDataModel,
    GeneralDataModel,
    LeakDataModel,
    LogBatchModel,
    ReportChatRequest,
    ScreenshotPayload,
    chat_data_model,
    nlp_data_model,
    open_sanctions_data_model,
    social_data_model,
)
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import IPScanRequest
from orion.api.server.crawl_manager.class_model.social_scrape_request_model import SocialScrapeRequest

INJECTIONS_DIR = Path(__file__).resolve().parent / "injections"


@pytest.mark.parametrize(
    "filename,model",
    [
        ("cti_fetch.json", CTITextRequest),
        ("index_leak.json", LeakDataModel),
        ("index_news.json", LeakDataModel),
        ("index_tracking.json", LeakDataModel),
        ("index_exploit.json", ExploitDataModel),
        ("index_defacement.json", DefacementDataModel),
        ("screenshot_upload.json", ScreenshotPayload),
        ("index_generic.json", GeneralDataModel),
        ("nlp_parse.json", nlp_data_model),
        ("nlp_parse_ai.json", nlp_data_model),
        ("nlp_summarize_ai.json", nlp_data_model),
        ("index_chat.json", chat_data_model),
        ("index_social.json", social_data_model),
        ("index_dump.json", DumpModel),
        ("index_stealerlog.json", LogBatchModel),
        ("urlscan_ip.json", IPScanRequest),
        ("urlscan_domain.json", DomainScanRequest),
        ("social_scrape.json", SocialScrapeRequest),
        ("nlp_chat_report.json", ReportChatRequest),
    ],
)
def test_injection_binds_to_expected_model(load_injection, filename, model):
    payload = load_injection(filename)
    parsed = model.model_validate(payload)
    assert parsed is not None


def test_index_entity_injection_is_list_of_dicts(load_injection):
    payload = load_injection("index_entity.json")
    assert isinstance(payload, list)
    assert payload
    assert isinstance(payload[0], dict)


def test_index_sanctions_injection_binds_records(load_injection):
    data_payload = load_injection("index_sanctions.json")
    chat_payload = load_injection("index_sanctions_chat.json")
    list_payload = load_injection("index_sanctions_list.json")
    single_payload = load_injection("index_sanctions_single.json")

    data_records = [open_sanctions_data_model.model_validate(item).model_dump(by_alias=True) for item in data_payload["m_data"]]
    chat_records = [open_sanctions_data_model.model_validate(item).model_dump(by_alias=True) for item in chat_payload["m_chat_data"]]
    list_records = [open_sanctions_data_model.model_validate(item).model_dump(by_alias=True) for item in list_payload]
    single_record = open_sanctions_data_model.model_validate(single_payload).model_dump(by_alias=True)

    assert data_records and chat_records and list_records and single_record


def test_invalid_injection_variant_raises_validation_error(load_injection):
    payload = load_injection("urlscan_ip.json")
    payload["ip"] = 123

    with pytest.raises(ValidationError) as ex:
        IPScanRequest.model_validate(payload)
    assert "ip" in str(ex.value).lower()
