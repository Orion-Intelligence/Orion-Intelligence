from __future__ import annotations

from typing import Any, Dict

from orion.api.interactive.search_manager.search_data_model.leak.search_leak_callback_model import result_item as LeakResultItem
from orion.services.stix_manager.converters.stix_minimal import convert_to_stix


class leak_converter:
    def convert(self, raw: LeakResultItem) -> Dict[str, Any]:
        return convert_to_stix("leak", raw)
