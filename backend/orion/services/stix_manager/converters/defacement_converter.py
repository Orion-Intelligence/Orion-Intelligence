from __future__ import annotations

from typing import Any, Dict

from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_callback_model import result_item as DefacementResultItem
from orion.services.stix_manager.converters.stix_minimal import convert_to_stix


class defacement_converter:
    def convert(self, raw: DefacementResultItem) -> Dict[str, Any]:
        return convert_to_stix("defacement", raw)
