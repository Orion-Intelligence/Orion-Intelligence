from typing import Any

from fastapi import HTTPException, status

from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (
    search_consolidated_param_model,
)
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import (
    DomainScanRequest,
    UrlVulnerabilityScanRequest,
)
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import (
    GeoCameraDetectRangesRequest,
    GeoCameraDetectRequest,
    NetIntelDeepScanRequest,
    ResolveIPRequest,
)
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class ToolRouter:
    NETWORK_ROUTES = {
        "/api/netintel/resolve_ip": (ResolveIPRequest, "resolve_ip"),
        "/api/netintel/ipscanner": (NetIntelDeepScanRequest, "netintel_scanner"),
        "/api/netintel/url_vulnerability_scan": (UrlVulnerabilityScanRequest, "url_vulnerability_scan"),
        "/api/netintel/iot_detect": (GeoCameraDetectRequest, "iot_detect"),
        "/api/netintel/camera_detect_ranges": (GeoCameraDetectRangesRequest, "camera_detect_ranges"),
    }

    DOMAIN_SCAN_ROUTES = {
        "/api/urlscan/domain": None,
        "/api/urlscan/subdomains": "subdomains",
        "/api/urlscan/dns": "dns",
        "/api/urlscan/wayback": "wayback",
    }

    async def request(self, api_name: str, payload: dict[str, Any], user_id: str = "system"):
        if api_name == "/api/search/strategic":
            model = search_consolidated_param_model.model_validate(payload or {})
            return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_GENERIC_INDEX], [], [])

        if api_name == "/api/search/breach":
            model = search_consolidated_param_model.model_validate(payload or {})
            if model.category == "all":
                return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_LEAK_INDEX], ["news"], ["leaks", "tracking"])
            if model.category == "databases":
                model.category = "leaks"
            return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_LEAK_INDEX], [], [model.category])

        if api_name == "/api/search/social":
            model = search_consolidated_param_model.model_validate(payload or {})
            if model.category == "all":
                return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX], [], [])
            if model.category == "telegram":
                model.category = "all"
                return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_CHATS_INDEX], [], [])
            model.platform = model.category
            model.category = "all"
            return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_SOCIAL_INDEX], [], [])

        if api_name == "/api/search/exploit":
            model = search_consolidated_param_model.model_validate(payload or {})
            return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_EXPLOIT_INDEX], [], [model.category])

        if api_name == "/api/search/defacement":
            model = search_consolidated_param_model.model_validate(payload or {})
            model.content = model.category
            return await search_model.getInstance().search_consolidated_ranked_result(model, [ELASTIC_INDEX.S_DEFACEMENT_INDEX], [], [model.category], "defacement")

        if api_name in self.NETWORK_ROUTES:
            model_class, route_name = self.NETWORK_ROUTES[api_name]
            return await search_model.getInstance().network_intel(model_class.model_validate(payload or {}), route_name, user_id=user_id)

        if api_name in self.DOMAIN_SCAN_ROUTES:
            model = DomainScanRequest.model_validate(payload or {})
            scan_type = self.DOMAIN_SCAN_ROUTES[api_name]
            if scan_type:
                model.scanType = scan_type
            return await crawl_model.getInstance().scan_domain(model, user_id=user_id)

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tool route not found")
