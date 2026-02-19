from __future__ import annotations

from typing import Any, Dict

from orion.api.interactive.search_manager.search_data_model.chat.search_chat_callback_model import result_item as ChatResultItem
from orion.services.stix_manager.converters.stix_minimal import convert_to_stix


class chat_converter:
    def convert(self, raw: ChatResultItem) -> Dict[str, Any]:
        return convert_to_stix("chat", raw)
