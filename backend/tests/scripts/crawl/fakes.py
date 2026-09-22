from __future__ import annotations

import json

from tests.model.fakes import FakeDoc


class _FakeRoutingEngine:
    def __init__(self, mapping: dict[tuple[str, str], list[FakeDoc]]):
        self.mapping = mapping

    async def find(self, _model, query):
        rule_key = query.get("rule_key", "")
        if "entry_kind" in query:
            return self.mapping.get(("disabled", ""), [])
        return list(self.mapping.get((rule_key, json.dumps(query, sort_keys=True)), []))
