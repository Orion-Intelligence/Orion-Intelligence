from __future__ import annotations

from typing import Any, Dict

from orion.api.interactive.search_manager.search_data_model.general.search_general_callback_model import result_item as GeneralResultItem
from orion.services.stix_manager.converters.stix_minimal import convert_to_stix


class general_converter:
    def convert(self, raw: GeneralResultItem) -> Dict[str, Any]:
        return convert_to_stix("general", raw)
