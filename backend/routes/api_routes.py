import asyncio
import base64
import re
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Body, Depends, Query, UploadFile, File
from configs.app_dependency import license_required, role_required, status_required, get_current_user
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import (directory_param_model, )
from orion.api.interactive.dump_manager.dump_model import dump_model
from orion.api.interactive.dump_manager.dump_shared_model.dump_param_model import dump_param_model
from orion.api.interactive.graph_manager.graph_models.search_social_param_model import search_social_param_model, SocialFollowersRequest, SocialFollowingRequest, SocialProfileRequest, SocialOnlineImages, SocialReconRequest
from orion.api.interactive.graph_manager.graphs_model import graphs_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_param_model import (search_chat_param_model, )
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (search_consolidated_param_model, )
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import (search_defacement_param_model, )
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (search_credential_param_model, )
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model, search_dynamic_crypto_model, )
from orion.api.interactive.search_manager.search_data_model.exploit.search_exploit_param_model import (search_exploit_param_model, )
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import (search_general_param_model, )
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import (search_leak_param_model, search_news_internal_param_model, search_news_param_model, )
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import (DomainScanRequest, )
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import (IPScanRequest)
from orion.api.server.crawl_manager.class_model.social_model import social_model
from orion.api.server.crawl_manager.class_model.social_scrape_request_model import (SocialScrapeRequest, )
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.shared_model.db_auth_models import (UserStatus, user_role, )
from orion.services.stix_manager.stix_manager import stix_manager

_DOCS_DIR = Path(__file__).resolve().parent / "docs" / "api_docs"


def _read_md(rel_path: str) -> str:
    p = _DOCS_DIR / rel_path
    try:
        return p.read_text(encoding="utf-8")
    except FileNotFoundError:
        return f"Documentation file not found: {p}"


def _doc(rel_path: str) -> dict:
    text = _read_md(f"/app/docs/api_docs/{rel_path.lstrip('/')}")
    m = re.search(
        r"^##\s*Response Description\s*\n(.*?)(?:\n##\s|\Z)", text, flags=re.MULTILINE | re.DOTALL, )
    resp = "Success"
    if m:
        block = m.group(1).strip()
        if block:
            resp = block.splitlines()[0].strip() or "Success"
    return {"description": text, "response_description": resp}


SYSTEM_INFO_DOCS = {"directory": _doc("system-info/directory.md"), "dumps": _doc(
    "system-info/dumps.md"), "insight": _doc("system-info/insight.md"), }

REPORT_DOCS = {"defacement": _doc("reports/defacement.md"), "breach": _doc("reports/breach.md"), "news": _doc(
    "reports/news.md"), "exploit": _doc("reports/exploit.md"), "strategic": _doc("reports/strategic.md"), "chat": _doc(
    "reports/chat.md"), "social_models": _doc("reports/social_models.md"), "breach_screenshot": _doc(
    "reports/breach_screenshot.md"), "stix": _doc("reports/stix.md"), }

DYNAMIC_DOCS = {"dynamic_user_email": _doc("dynamic/dynamic_user_email.md"), "dynamic_cracked": _doc(
    "dynamic/dynamic_cracked.md"), "dynamic_software": _doc("dynamic/dynamic_software.md"), "dynamic_social": _doc(
    "dynamic/dynamic_social.md"), "domain_scan": _doc("dynamic/domain_scan.md"), "ip_scan": _doc("dynamic/ip_scan.md"), 
    "ioc_extract": _doc("dynamic/ioc_extract.md"),"apk_scan": _doc("dynamic/apk_scan.md"),}

CRYPTO_DOCS = {"crypto_scan": _doc("dynamic/crypto_scan.md"),}

SEARCH_DOCS = {"strategic": _doc("search/strategic.md"), "stealerlogs": _doc(
    "search/stealerlogs.md"), "consolidated": _doc("search/consolidated.md"), "consolidated_ranked": _doc(
    "search/consolidated_ranked.md"), "telegram": _doc("search/telegram.md"), "social_models": _doc(
    "search/social_models.md"), "breach": _doc("search/breach.md"), "exploit": _doc("search/exploit.md"), "defacement": _doc(
    "search/defacement.md"), }

SUPPORT_METHOD_DOCS={"subdomain_scan": _doc("support/subdomain_scan.md"), "dns_scan": _doc(
    "support/dns_scan.md"), "wayback_scan": _doc("support/wayback_scan.md")}

api_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])


@api_routes.get(
    "/api/directory",
    summary="Get monitored source directory",
    description=SYSTEM_INFO_DOCS["directory"]["description"],
    tags=["System Info"],
    operation_id="getSystemDirectory",
    response_description=SYSTEM_INFO_DOCS["directory"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))], )
async def get_directory(param: directory_param_model = Depends()):
    return await directory_model.getInstance().invoke_directory(param)


@api_routes.get(
    "/api/dumps",
    summary="Get breach dump catalog",
    description=SYSTEM_INFO_DOCS["dumps"]["description"],
    tags=["System Info"],
    operation_id="getBreachDumpCatalog",
    response_description=SYSTEM_INFO_DOCS["dumps"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:dumps")), ], )
async def get_dumps(param: dump_param_model = Depends()):
    return await dump_model.getInstance().invoke_dump(param)


@api_routes.get(
    "/api/insight",
    summary="Get system insights",
    description=SYSTEM_INFO_DOCS["insight"]["description"],
    tags=["System Info"],
    operation_id="getSystemInsights",
    response_description=SYSTEM_INFO_DOCS["insight"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.DEMO, user_role.ANALYST]))], )
async def get_insight():
    insights_task = homepage_model.getInstance().invoke_analytics()
    latestDocument_task = homepage_model.getInstance().insight_consolidated_result()
    graph_insight_task = homepage_model.getInstance().invoke_graphs()
    countryInsightsTask=homepage_model.getInstance().get_country_specific_insights()

    insights, latestDocument, graph_insight,country_insight = await asyncio.gather(
        insights_task, latestDocument_task, graph_insight_task,countryInsightsTask )
    return {"insights": insights, "latestDocument": latestDocument, "graph_insight": graph_insight, "country_insight":country_insight}


@api_routes.post(
    "/api/search/strategic",
    summary="Search strategic reports",
    description=SEARCH_DOCS["strategic"]["description"],
    tags=["Search"],
    operation_id="searchStrategicReports",
    response_description=SEARCH_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:general")), ], )
async def search_general(param: search_general_param_model = Body(...)):
    if param.category in ["all"]:
        base_index = [ELASTIC_INDEX.S_GENERIC_INDEX, ]
        return await search_model.getInstance().search_consolidated_ranked_result(
            param, base_index, [], [])
    else:
        return await search_model.getInstance().search_general_result(param)


@api_routes.post(
    "/api/search/stealerlogs",
    summary="Search stealer log reports",
    description=SEARCH_DOCS["stealerlogs"]["description"],
    tags=["Search"],
    operation_id="searchStealerLogReports",
    response_description=SEARCH_DOCS["stealerlogs"]["response_description"],
    include_in_schema=False,
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("module:stealer_logs", bypass_roles=[], bypass_licenses=["maintainer"])), ], )
async def search_stealerlog(param: search_credential_param_model = Body(...)):
    param.q = ""
    return await search_model.getInstance().search_stealerlogs_result(param)


@api_routes.post(
    "/api/search/stealer/ioc",
    summary="Search stealer log reports",
    description=SEARCH_DOCS["stealerlogs"]["description"],
    tags=["Search"],
    operation_id="searchStealerLogAndConsolidatedReports",
    response_description=SEARCH_DOCS["stealerlogs"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("module:stealer_logs", bypass_roles=[], bypass_licenses=["maintainer"])), ], )
async def search_stealer_iocs(param: search_credential_param_model = Body(...)):
    return await search_model.getInstance().search_stealer_iocs(param)


@api_routes.post(
    "/api/search/consolidated",
    summary="Search consolidated reports (grouped)",
    description=SEARCH_DOCS["consolidated"]["description"],
    tags=["Search"],
    operation_id="searchConsolidatedReports",
    response_description=SEARCH_DOCS["consolidated"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), ], )
async def search_consolidated(param: search_consolidated_param_model = Body(...)):
    return await search_model.getInstance().search_consolidated_result(param)


@api_routes.post(
    "/api/search/consolidated/ranked",
    summary="Search consolidated reports (ranked)",
    description=SEARCH_DOCS["consolidated_ranked"]["description"],
    tags=["Search"],
    include_in_schema=False,
    operation_id="searchConsolidatedReportsRanked",
    response_description=SEARCH_DOCS["consolidated_ranked"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), ], )
async def search_consolidated_ranked(param: search_consolidated_param_model = Body(...)):
    base_index = [ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_INDEX.S_EXPLOIT_INDEX,
                  ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX, ELASTIC_INDEX.S_DEFACEMENT_INDEX, ]
    return await search_model.getInstance().search_consolidated_ranked_result(
        param, base_index, [], [])


@api_routes.post(
    "/api/search/consolidated/ioc",
    summary="Search consolidated reports (ranked with operators)",
    tags=["Search"],
    operation_id="searchConsolidatedRankedLogic",
    include_in_schema=False,
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
        )
    )],
)
async def search_consolidated_iocs(
        param: search_consolidated_param_model = Body(...)
):
    base_index = [
        ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_INDEX.S_EXPLOIT_INDEX,
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX,
        ELASTIC_INDEX.S_DEFACEMENT_INDEX,
    ]

    return await search_model.getInstance().search_consolidated_iocs(
        param, base_index, [], []
    )


@api_routes.post(
    "/api/chat/telegram",
    summary="Search Telegram chat reports",
    description=SEARCH_DOCS["telegram"]["description"],
    tags=["Search"],
    operation_id="searchTelegramChatReports",
    response_description=SEARCH_DOCS["telegram"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:social")), ], )
async def search_telegram(param: search_chat_param_model = Body(...)):
    return await search_model.getInstance().search_telegram_result(param)


@api_routes.post(
    "/api/search/discussion",
    summary="Search threat discussion reports",
    description="Search threat actor discussion reports from chat and social_models sources using parameters such as company, country, or hash.",
    tags=["Search"],
    operation_id="searchThreatDiscussionReports",
    response_description="Threat actor discussion search results with metadata for matching discussion reports.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("module:discussion")), ], )
async def search_discussion(param: search_leak_param_model = Body(...)):
    base_index = [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX, ]
    return await search_model.getInstance().search_consolidated_ranked_result(
        param, base_index, [], [])


@api_routes.post(
    "/api/exploit/discussion",
    summary="Search exploit discussion reports",
    description="Search exploit-related discussion reports using generic filters or category-specific filters such as CVE, tools, or zero-day topics.",
    tags=["Search"],
    operation_id="searchExploitDiscussionReports",
    response_description="Exploit discussion search results with metadata for matching exploit discussion reports.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:exploit")), ], )
async def search_discussion(param: search_general_param_model = Body(...)):
    base_index = [ELASTIC_INDEX.S_CHATS_INDEX, ]
    if param.category in ["all"]:
        return await search_model.getInstance().search_consolidated_ranked_result(
            param, base_index, [], ["cve", "tools", "zeroday"])
    else:
        return await search_model.getInstance().search_consolidated_ranked_result(
            param, base_index, [], [param.category])


@api_routes.post(
    "/api/social/all",
    include_in_schema=False,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:social")), ], )
async def search_social_all(param: search_general_param_model = Body(...)):
    base_index = [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX, ]
    return await search_model.getInstance().search_consolidated_ranked_result(
        param, base_index, [], [])


@api_routes.post(
    "/api/social",
    include_in_schema=False,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:social")), ], )
async def search_social(param: search_social_param_model = Body(...)):
    return await search_model.getInstance().search_social_result(param)


@api_routes.post(
    "/api/search/breach",
    summary="Search breach reports",
    description=SEARCH_DOCS["breach"]["description"],
    tags=["Search"],
    operation_id="searchBreachReports",
    response_description=SEARCH_DOCS["breach"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:breach")), ], )
async def search_leak(param: search_leak_param_model = Body(...)):
    if param.category in ["all"]:
        base_index = [ELASTIC_INDEX.S_LEAK_INDEX, ]
        return await search_model.getInstance().search_consolidated_ranked_result(
            param, base_index, ["news"], ["leaks", "tracking"])
    else:
        return await search_model.getInstance().search_leak_result(param)


@api_routes.post(
    "/api/search/news",
    summary="Search breach news reports",
    tags=["Search"],
    include_in_schema=False,
    operation_id="searchBreachNewsReports",
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))], )
async def search_news(param: search_news_param_model = Body(...)):
    internal_param = search_news_internal_param_model(**param.model_dump())
    return await search_model.getInstance().search_leak_result(internal_param)


@api_routes.post(
    "/api/search/exploit",
    summary="Search exploit reports",
    description=SEARCH_DOCS["exploit"]["description"],
    tags=["Search"],
    operation_id="searchExploitReports",
    response_description=SEARCH_DOCS["exploit"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:exploit")), ], )
async def search_exploit(param: search_exploit_param_model = Body(...)):
    return await search_model.getInstance().search_exploit_result(param)


@api_routes.post(
    "/api/search/defacement",
    summary="Search defacement reports",
    description=SEARCH_DOCS["defacement"]["description"],
    tags=["Search"],
    operation_id="searchDefacementReports",
    response_description=SEARCH_DOCS["defacement"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("module:defacement")), ], )
async def search_defacement(param: search_defacement_param_model = Body(...)):
    return await search_model.getInstance().search_defacement_result(param)


@api_routes.get(
    "/api/search/defacement/{doc_id}",
    summary="Get defacement report",
    description=REPORT_DOCS["defacement"]["description"],
    tags=["Reports"],
    operation_id="getDefacementReport",
    response_description=REPORT_DOCS["defacement"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:defacement", bypass_licenses=["maintainer"]))], )
async def get_defacement_document(doc_id: str):
    return await search_model.getInstance().request_defacement_doc(doc_id)


@api_routes.get(
    "/api/search/breach/{doc_id}",
    summary="Get breach monitoring report",
    description=REPORT_DOCS["breach"]["description"],
    tags=["Reports"],
    operation_id="getBreachReport",
    response_description=REPORT_DOCS["breach"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:breach", bypass_licenses=["maintainer"]))], )
async def get_leak_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get(
    "/api/search/news/{doc_id}",
    summary="Get breach-related news report",
    description=REPORT_DOCS["news"]["description"],
    tags=["Reports"],
    operation_id="getNewsReport",
    response_description=REPORT_DOCS["news"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:news", bypass_licenses=["maintainer"]))], )
async def get_news_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get(
    "/api/search/exploit/{doc_id}",
    summary="Get exploit intelligence report",
    description=REPORT_DOCS["exploit"]["description"],
    tags=["Reports"],
    operation_id="getExploitReport",
    response_description=REPORT_DOCS["exploit"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:exploit", bypass_licenses=["maintainer"]))], )
async def get_exploit_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await search_model.getInstance().request_exploit_doc(doc_id, lang)


@api_routes.get(
    "/api/search/strategic/{doc_id}",
    summary="Get darkweb strategic report",
    description=REPORT_DOCS["strategic"]["description"],
    tags=["Reports"],
    operation_id="getStrategicReport",
    response_description=REPORT_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:strategic", bypass_licenses=["maintainer"]))], )
async def get_general_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await search_model.getInstance().request_general_doc(doc_id, lang)


@api_routes.get(
    "/api/search/chat/{doc_id}",
    summary="Get chat intelligence report",
    description=REPORT_DOCS["chat"]["description"],
    tags=["Reports"],
    operation_id="getChatReport",
    response_description=REPORT_DOCS["chat"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:chat", bypass_licenses=["maintainer"]))], )
async def get_chat_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await search_model.getInstance().request_chat_doc(doc_id, lang)


@api_routes.get(
    "/api/search/social/{doc_id}",
    summary="Get social_models media intelligence report",
    description=REPORT_DOCS["social_models"]["description"],
    tags=["Reports"],
    operation_id="getSocialReport",
    response_description=REPORT_DOCS["social_models"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:social", bypass_licenses=["maintainer"]))], )
async def get_social_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await search_model.getInstance().request_social_doc(doc_id, lang)


@api_routes.get(
    "/api/search/breach/screenshot/{filename}",
    summary="Get breach report screenshot",
    description=REPORT_DOCS["breach_screenshot"]["description"],
    tags=["Reports"],
    operation_id="getBreachReportScreenshot",
    response_description=REPORT_DOCS["breach_screenshot"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:breach", bypass_licenses=["maintainer"])), ], )
async def get_screenshot(filename: str):
    return await crawl_model.getInstance().get_screenshot_file(f"{filename}.webp")


@api_routes.post(
    "/api/dynamic/user",
    summary="Dynamic user email exposure search",
    description=DYNAMIC_DOCS["dynamic_user_email"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="dynamicUserEmailExposureSearch",
    response_description=DYNAMIC_DOCS["dynamic_user_email"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "user")


@api_routes.post(
    "/api/dynamic/cracked",
    summary="Dynamic cracked credential search",
    description=DYNAMIC_DOCS["dynamic_cracked"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="dynamicCrackedCredentialSearch",
    response_description=DYNAMIC_DOCS["dynamic_cracked"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_cracked(param: search_dynamic_crack_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "cracked")


@api_routes.post(
    "/api/dynamic/software",
    summary="Dynamic software credential search",
    description=DYNAMIC_DOCS["dynamic_software"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="dynamicSoftwareCredentialSearch",
    response_description=DYNAMIC_DOCS["dynamic_software"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_software(param: search_dynamic_crack_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "software")


@api_routes.post(
    "/api/urlscan/domain",
    summary="Domain, SEO, and repository scan",
    description=DYNAMIC_DOCS["domain_scan"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="scanDomainBasicSeoRepo",
    response_description=DYNAMIC_DOCS["domain_scan"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def parse_text(payload: DomainScanRequest):
    return await crawl_model.getInstance().scan_domain(payload)

@api_routes.post(
    "/api/urlscan/subdomains",
    summary="Returns the list of associated subdomains",
    description=SUPPORT_METHOD_DOCS["subdomain_scan"]["description"],
    tags=["Support Method"],
    operation_id="scanSubdomains",
    response_description=SUPPORT_METHOD_DOCS["subdomain_scan"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def parse_text(payload: DomainScanRequest):
    payload.scanType='subdomains'
    return await crawl_model.getInstance().scan_domain(payload)

@api_routes.post(
    "/api/urlscan/dns",
    summary="Reverse DNS and ping check",
    description=SUPPORT_METHOD_DOCS["dns_scan"]["description"],
    tags=["Support Method"],
    operation_id="scanDns",
    response_description=SUPPORT_METHOD_DOCS["dns_scan"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def parse_text(payload: DomainScanRequest):
    payload.scanType='dns'
    return await crawl_model.getInstance().scan_domain(payload)

@api_routes.post(
    "/api/urlscan/wayback",
    summary="Fetches archived snapshots and timestamps",
    description=SUPPORT_METHOD_DOCS["wayback_scan"]["description"],
    tags=["Support Method"],
    operation_id="scanWaybackDomain",
    response_description=SUPPORT_METHOD_DOCS["wayback_scan"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def parse_text(payload: DomainScanRequest):
    payload.scanType='wayback'
    return await crawl_model.getInstance().scan_domain(payload)

@api_routes.post(
    "/api/urlscan/ip",
    include_in_schema=False,
    dependencies=[
        Depends(
            role_required(
                [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
            )
        ),
        Depends(limiter_dependency),
        Depends(license_required("scanning")),
    ],
)
async def parse_ip(payload: IPScanRequest):
    return await crawl_model.getInstance().scan_ip(payload)


@api_routes.post(
    "/api/social/scrape",
    include_in_schema=False,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(limiter_dependency),
        Depends(license_required("scanning")), ], )
async def scrape_social(payload: SocialScrapeRequest):
    return await crawl_model.getInstance().scrape_social(payload)


@api_routes.post(
    "/api/dynamic/social",
    summary="Dynamic social_models identifier exposure search",
    description=DYNAMIC_DOCS["dynamic_social"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="dynamicSocialIdentifierExposureSearch",
    response_description=DYNAMIC_DOCS["dynamic_social"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_social(param: search_dynamic_social_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "social_models")


@api_routes.get(
    "/api/search/breach/stix/{doc_id}",
    summary="Get breach media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getBreachStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_breach_stix_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await stix_manager.get_instance().get_leak_stix(doc_id, lang)


@api_routes.get(
    "/api/search/strategic/stix/{doc_id}",
    summary="Get strategic media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getStrategicStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_strategic_stix_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await stix_manager.get_instance().get_general_stix(doc_id, lang)


@api_routes.get(
    "/api/search/defacement/stix/{doc_id}",
    summary="Get defacement media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getDefacementStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_defacement_stix_document(doc_id: str, ):
    return await stix_manager.get_instance().get_defacement_stix(doc_id)


@api_routes.get(
    "/api/search/exploit/stix/{doc_id}",
    summary="Get exploit media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getExploitStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_exploit_stix_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await stix_manager.get_instance().get_exploit_stix(doc_id, lang)


@api_routes.get(
    "/api/search/social/stix/{doc_id}",
    summary="Get social_models media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getSocialStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_social_stix_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await stix_manager.get_instance().get_social_stix(doc_id, lang)


@api_routes.get(
    "/api/search/chat/stix/{doc_id}",
    summary="Get social_models media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getSocialStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_social_stix_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await stix_manager.get_instance().get_chat_stix(doc_id, lang)


@api_routes.get(
    "/api/graph",
    summary="Get entity graph relationships",
    description="Fetch graph relationships for a given entity based on its type and value.",
    tags=["Graph", "Entities"],
    operation_id="getEntityRelations",
    response_description="Graph structure representing relationships for the requested entity.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(license_required("cti_graph"))], )
async def get_entity_relations(query: EntityQueryModel = Depends()):
    manager = entity_manager.get_instance()
    return await manager.get_entity_relations(query)


@api_routes.get(
    "/api/search/news/stix/{doc_id}",
    summary="Get news media intelligence report in stix format",
    description=REPORT_DOCS["stix"]["description"],
    tags=["Stix"],
    operation_id="getNewsStixReport",
    response_description=REPORT_DOCS["stix"]["response_description"],
    status_code=200,
    dependencies=[Depends(
        role_required(
            [user_role.ADMIN, user_role.DEMO, user_role.MEMBER])), ], )
async def get_news_stix_document(doc_id: str, lang: Optional[str] = Query(
    None, alias="lang", description="Optional language code for localized report content.", ), ):
    return await stix_manager.get_instance().get_leak_stix(doc_id, lang)


@api_routes.post(
    "/api/ioc/extract",
    summary="Extract IOCs from file(.pdf or .txt) or image(.png, .jpg or .jpeg)",
    description=DYNAMIC_DOCS["ioc_extract"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="iocExtractFromFile",
    response_description=DYNAMIC_DOCS["ioc_extract"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST, Depends(license_required("scanning"))])),
    ],
)
async def extract_ioc(file: UploadFile = File(...)):
    file_content = await file.read()
    result = await search_model.getInstance().extract_ioc_from_file(file_content, file.filename)
    return result


@api_routes.post(
    "/api/apk/scan",
    summary="Dynamic analysis scan to identify application metadata, cracking indicators, etc",
    description=DYNAMIC_DOCS["apk_scan"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="dynamicApkScan",
    response_description=DYNAMIC_DOCS["apk_scan"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning"))],
)
async def scan_apk(file: UploadFile = File(...)):
    file_content = await file.read()
    result = await search_model.getInstance().scan_apk(file_content, file.filename)

    return result


@api_routes.post(
    "/api/crypto/scan",
    summary="Scan cryptocurrency wallet address or transaction hash",
    description=CRYPTO_DOCS["crypto_scan"]["description"],
    tags=["Crypto Analysis"],
    operation_id="dynamicCryptoScan",
    response_description=CRYPTO_DOCS["crypto_scan"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning"))
    ],
)
async def crypto_scan(param: search_dynamic_crypto_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "crypto")

@api_routes.post(
    "/api/social/recon",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialReconRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "recon")

@api_routes.post(
    "/api/social/profile",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialProfileRequest = Body(...)):
    return await search_model.getInstance().social_search(param, "profile")

@api_routes.post(
    "/api/social/online/images",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialOnlineImages = Body(...)):
    return await search_model.getInstance().social_search(param, "online/images")

@api_routes.post(
    "/api/social/recon/image",
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_image(payload: dict = Body(...)):
    image_base64 = payload.get("image_base64")
    if not image_base64:
        return {"status": "error", "message": "image_base64_required"}

    file_bytes = base64.b64decode(image_base64)

    return await search_model.getInstance().social_search(
        {"file_bytes": file_bytes, "filename": "upload.png"},
        "recon/image",
    )
@api_routes.post(
    "/api/social/followers",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialFollowersRequest = Body(...)):
    return await social_model.getInstance().social_search(param, "followers")

@api_routes.post(
    "/api/social/following",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialFollowingRequest = Body(...)):
    return await social_model.getInstance().social_search(param, "following")

@api_routes.post(
    "/api/social/posts",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialProfileRequest = Body(...)):
    return await social_model.getInstance().social_search(param, "posts")

@api_routes.post(
    "/api/social/entity",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def search_dynamic_email(param: SocialProfileRequest = Body(...)):
    return await social_model.getInstance().social_search(param, "entity")



@api_routes.post(
    "/api/social/session/upsert",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def upsert_social_session(data: dict = Body(...), graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    gt = (data or {}).get("graph_type") or graph_type or "social"
    return await graphs_model.getInstance().upsert_data(str(current_user.id), gt, data)


@api_routes.get(
    "/api/social/session/tabs",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def get_social_tabs(graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    return await graphs_model.getInstance().get_tabs_summary(str(current_user.id), graph_type)


@api_routes.post(
    "/api/social/session/tab/add",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO,user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning")), ], )
async def add_social_tab(tab: dict = Body(...), graph_type: str = Query("social"), current_user=Depends(get_current_user)):
    gt = (tab or {}).get("graph_type") or graph_type or "social"
    return await graphs_model.getInstance().add_tab(str(current_user.id), gt, tab)