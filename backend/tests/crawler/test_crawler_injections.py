import json
from pathlib import Path

INJECTIONS_DIR = Path(__file__).resolve().parent / "injections"

EXPECTED_FILES = {
    "feeder_index_type.json",
    "parser_no_payload.json",
    "index_leak.json",
    "index_news.json",
    "index_tracking.json",
    "index_exploit.json",
    "index_defacement.json",
    "screenshot_upload.json",
    "index_generic.json",
    "nlp_parse.json",
    "nlp_parse_ai.json",
    "nlp_summarize_ai.json",
    "index_chat.json",
    "index_social.json",
    "index_sanctions.json",
    "index_sanctions_chat.json",
    "index_sanctions_list.json",
    "index_sanctions_single.json",
    "index_entity.json",
    "index_dump.json",
    "index_stealerlog.json",
    "urlscan_ip.json",
    "urlscan_domain.json",
    "social_scrape.json",
    "cti_fetch.json",
    "nlp_chat_report.json",
}


def test_crawler_injection_files_exist():
    assert INJECTIONS_DIR.exists() and INJECTIONS_DIR.is_dir()

    present = {p.name for p in INJECTIONS_DIR.glob("*.json")}
    missing = EXPECTED_FILES - present
    assert not missing, f"Missing injection files: {sorted(missing)}"


def test_crawler_injection_files_are_valid_json():
    for file_name in sorted(EXPECTED_FILES):
        payload_path = INJECTIONS_DIR / file_name
        raw = payload_path.read_text(encoding="utf-8")
        assert raw.strip(), f"Empty payload file: {file_name}"

        payload = json.loads(raw)
        assert isinstance(payload, (dict, list)), f"Unexpected JSON root in {file_name}: {type(payload)}"
