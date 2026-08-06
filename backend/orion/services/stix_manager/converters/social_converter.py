from __future__ import annotations

from typing import Any, Dict

from orion.api.interactive.social_manager.social_models.search_social_callback_model import result_item as SocialResultItem
from orion.services.stix_manager.converters.stix_minimal import convert_to_stix


class social_converter:
    def convert(self, raw: SocialResultItem, tenant_name: str = "Tenant") -> Dict[str, Any]:
        return convert_to_stix("social", raw, tenant_name)
