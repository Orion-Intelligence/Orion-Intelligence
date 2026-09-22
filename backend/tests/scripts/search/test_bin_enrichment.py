from types import SimpleNamespace

import pytest

from orion.api.interactive.search_manager.search_data_model.dump.search_stealerlog_callback_model import (
    search_stealerlog_callback_model,
)
from orion.api.interactive.search_manager.search_manager import search_manager


@pytest.mark.parametrize("record,prefixes,luhn", [
    ({"type": "bin", "bin": "411111"}, ["411111"], True),
    ({"type": "bin", "bin": ["411111", "555555"]}, ["411111"], True),
    ({"type": "fullbin", "credit_card": "4111 1111 1111 1111"}, ["41111111", "411111"], True),
    ({"type": "fullbin", "credit_card": ["4111111111111112", "5555555555554444"]}, ["41111111", "411111"], False),
    ({"type": "credit_card", "credit_card": "4111111111111111"}, ["41111111", "411111"], True),
    ({"type": "FULLBIN", "pan": ["4111-1111-1111-1111"]}, ["41111111", "411111"], True),
])
def test_bin_and_full_card_records_receive_same_metadata(monkeypatch, record, prefixes, luhn):
    calls = []

    def lookup(prefix):
        calls.append(prefix)
        if prefix != "411111":
            return {"status": "error"}
        return {
            "status": "SUCCESS", "Luhn": True,
            "data": [{"brand": "VISA", "Type": "DEBIT", "CardTier": "CLASSIC",
                      "issuer": "Example Bank", "Country": {"Name": "Example Country"},
                      "website": "https://bank.example"}],
        }

    monkeypatch.setattr(search_manager, "_search_manager__bin_db", SimpleNamespace(get_bin_info=lookup))
    response = search_stealerlog_callback_model(Result=[record])

    assert search_manager._enrich_bin_results(response) is response
    result = response.Result[0].model_dump()
    assert calls == prefixes
    assert {key: result[key] for key in record} == record
    assert {key: result[key] for key in ("Scheme", "Type", "Tier", "Issuer", "Country", "Website", "Luhn")} == {
        "Scheme": "VISA", "Type": "DEBIT", "Tier": "CLASSIC", "Issuer": "Example Bank",
        "Country": "Example Country", "Website": "https://bank.example", "Luhn": luhn,
    }


def test_full_card_prefers_eight_digit_bin_match(monkeypatch):
    calls = []

    def lookup(prefix):
        calls.append(prefix)
        return {"status": "SUCCESS", "Luhn": True, "data": [{"issuer": "Eight Digit Issuer"}]}

    monkeypatch.setattr(search_manager, "_search_manager__bin_db", SimpleNamespace(get_bin_info=lookup))
    response = search_stealerlog_callback_model(Result=[{
        "type": "fullbin", "bin": "411111", "credit_card": "4111111111111111",
    }])
    search_manager._enrich_bin_results(response)

    assert calls == ["41111111"]
    assert response.Result[0].Issuer == "Eight Digit Issuer"


@pytest.mark.parametrize("record,prefixes", [
    ({"type": "fullbin", "credit_card": "4111111111111111", "Issuer": "Original Issuer"}, ["41111111", "411111"]),
    ({"type": "fullbin", "credit_card": []}, []),
    ({"type": "fullbin", "credit_card": "123"}, []),
    ({"type": "credential", "email": ["user@example.com"]}, []),
])
def test_missing_bin_data_preserves_original_record(monkeypatch, record, prefixes):
    calls = []

    def lookup(prefix):
        calls.append(prefix)
        return {"status": "error"}

    monkeypatch.setattr(search_manager, "_search_manager__bin_db", SimpleNamespace(get_bin_info=lookup))
    response = search_stealerlog_callback_model(Result=[record])
    original = response.model_dump()
    search_manager._enrich_bin_results(response)

    assert calls == prefixes
    assert response.model_dump() == original
