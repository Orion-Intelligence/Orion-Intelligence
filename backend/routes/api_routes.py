import asyncio

from typing import Optional
from fastapi import APIRouter, Body
from fastapi import Depends, Query
from configs.app_dependency import license_required, role_required, status_required
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.dump_manager.dump_model import dump_model
from orion.api.interactive.dump_manager.dump_shared_model.dump_param_model import dump_param_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_param_model import search_chat_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import search_general_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_param_model import search_social_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import DomainScanRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, UserStatus
from routes.docs.docs import SYSTEM_INFO_DOCS

api_routes = APIRouter(
    dependencies=[Depends(status_required([UserStatus.ACTIVE]))]
)
public_routes = APIRouter(tags=["Public"])

@api_routes.get(
    "/api/directory",
    summary="Get monitored source directory",
    description=SYSTEM_INFO_DOCS["directory"]["description"],
    tags=["System Info"],
    operation_id="getSystemDirectory",
    response_description=SYSTEM_INFO_DOCS["directory"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([
        user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST
    ]))],
)
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
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:dumps")),
    ],
)
async def get_directory(param: dump_param_model = Depends()):
    return await dump_model.getInstance().invoke_dump(param)


@api_routes.get(
    "/api/insight",
    summary="Get system insights",
    description=SYSTEM_INFO_DOCS["insight"]["description"],
    tags=["System Info"],
    operation_id="getSystemInsights",
    response_description=SYSTEM_INFO_DOCS["insight"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([
        user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST
    ]))],
)
async def get_insight():
    insights_task = homepage_model.getInstance().invoke_analytics()
    latestDocument_task = homepage_model.getInstance().insight_consolidated_result()
    graph_insight_task = homepage_model.getInstance().invoke_graphs()

    insights, latestDocument, graph_insight = await asyncio.gather(
        insights_task,
        latestDocument_task,
        graph_insight_task,
    )

    return {
        "insights": insights,
        "latestDocument": latestDocument,
        "graph_insight": graph_insight,
    }

@api_routes.post(
    "/api/search/strategic",
    summary="Search strategic reports",
    description="Search strategic intelligence reports using filters such as category, title, date, or hash; returns metadata for matching reports that can be opened via the report APIs.",
    tags=["Search"],
    operation_id="searchStrategicReports",
    response_description="Strategic intelligence search results containing metadata for each matching report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:general")),
    ],
)
async def search_general(param: search_general_param_model = Body(...)):
    if param.category in ["all"]:
        base_index = [
            ELASTIC_INDEX.S_GENERIC_INDEX,
        ]
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])
    else:
        return await search_model.getInstance().search_general_result(param)


@api_routes.post(
    "/api/search/stealerlogs",
    summary="Search stealer log reports",
    description="Search credential stealer log reports using supplied filters; returns metadata for each matching stealer log report.",
    tags=["Search"],
    operation_id="searchStealerLogReports",
    response_description="Stealer log search results with metadata for each matching stealer log report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.PROFILE, user_role.DEMO, user_role.ANALYST])),
        Depends(license_required("module:stealer_logs")),
    ],
)
async def search_consolidated(param: search_credential_param_model = Body(...)):
    return await search_model.getInstance().search_stealerlogs_result(param)


@api_routes.post(
    "/api/search/consolidated",
    summary="Search consolidated reports (grouped)",
    description="Search across all report types (breach, exploit, chats, social, etc.) and return a consolidated, grouped set of report metadata from each section.",
    tags=["Search"],
    operation_id="searchConsolidatedReports",
    response_description="Consolidated search results with grouped metadata from each report section, suitable for drill-down via report APIs.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("maintainer", [user_role.ADMIN, user_role.ANALYST])),
    ],
)
async def search_consolidated(param: search_consolidated_param_model = Body(...)):
    return await search_model.getInstance().search_consolidated_result(param)


@api_routes.post(
    "/api/search/consolidated/ranked",
    summary="Search consolidated reports (ranked)",
    description="Search the entire database across all report types and return a single relevance-ranked list of report metadata without per-section grouping.",
    tags=["Search"],
    operation_id="searchConsolidatedReportsRanked",
    response_description="Globally ranked consolidated search results with report metadata ordered by relevance.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("maintainer", [user_role.ADMIN, user_role.ANALYST])),
    ],
)
async def search_consolidated(param: search_consolidated_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_INDEX.S_EXPLOIT_INDEX,
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX,
    ]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])


@api_routes.post(
    "/api/chat/telegram",
    summary="Search Telegram chat reports",
    description="Search Telegram-based chat intelligence and return metadata for matching chat reports.",
    tags=["Search"],
    operation_id="searchTelegramChatReports",
    response_description="Telegram chat search results containing metadata for matching chat intelligence reports.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:social")),
    ],
)
async def search_telegram(param: search_chat_param_model = Body(...)):
    return await search_model.getInstance().search_telegram_result(param)


@api_routes.post(
    "/api/search/discussion",
    summary="Search threat discussion reports",
    description="Search threat actor discussion reports from chat and social sources using parameters such as company, country, or hash.",
    tags=["Search"],
    operation_id="searchThreatDiscussionReports",
    response_description="Threat actor discussion search results with metadata for matching discussion reports.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:discussion")),
    ],
)
async def search_leak(param: search_leak_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX,
    ]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])


@api_routes.post(
    "/api/exploit/discussion",
    summary="Search exploit discussion reports",
    description="Search exploit-related discussion reports using generic filters or category-specific filters such as CVE, tools, or zero-day topics.",
    tags=["Search"],
    operation_id="searchExploitDiscussionReports",
    response_description="Exploit discussion search results with metadata for matching exploit discussion reports.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:exploit")),
    ],
)
async def search_discussion(param: search_general_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_CHATS_INDEX,
    ]
    if param.category in ["all"]:
        return await search_model.getInstance().search_consolidated_ranked_result(
            param, base_index, [], ["cve", "tools", "zeroday"]
        )
    else:
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category])


@api_routes.post(
    "/api/social/all",
    summary="Search all social and chat reports",
    description="Search across all chat and social indices combined and return metadata for matching social/chat reports.",
    tags=["Search"],
    operation_id="searchAllSocialChatReports",
    response_description="Combined social and chat search results with metadata for matching reports from both sources.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:social")),
    ],
)
async def search_discussion(param: search_general_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX,
    ]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])


@api_routes.post(
    "/api/social",
    summary="Search social media reports",
    description="Search social media intelligence and return metadata for reports generated from monitored social platforms.",
    tags=["Search"],
    operation_id="searchSocialMediaReports",
    response_description="Social media intelligence search results with metadata for each matching social report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:social")),
    ],
)
async def search_twitter(param: search_social_param_model = Body(...)):
    return await search_model.getInstance().search_social_result(param)


@api_routes.post(
    "/api/search/breach",
    summary="Search breach reports",
    description="Search breach (leak) intelligence reports using parameters such as company, domain, country, or hash; returns metadata for matching breach reports.",
    tags=["Search"],
    operation_id="searchBreachReports",
    response_description="Breach intelligence search results containing metadata for each matching breach report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:breach")),
    ],
)
async def search_leak(param: search_leak_param_model = Body(...)):
    if param.category in ["all"]:
        base_index = [
            ELASTIC_INDEX.S_LEAK_INDEX,
        ]
        return await search_model.getInstance().search_consolidated_ranked_result(
            param, base_index, ["news"], ["leaks", "tracking"]
        )
    else:
        return await search_model.getInstance().search_leak_result(param)


@api_routes.post(
    "/api/search/news",
    summary="Search breach news reports",
    description="Search breach-related news intelligence using parameters such as company, domain, country, or hash; returns metadata for news-based reports.",
    tags=["Search"],
    operation_id="searchBreachNewsReports",
    response_description="Breach-related news search results with metadata for matching news intelligence reports.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def search_news(param: search_leak_param_model = Body(...)):
    param.mContentType = "news"
    return await search_model.getInstance().search_leak_result(param)


@api_routes.post(
    "/api/search/exploit",
    summary="Search exploit reports",
    description="Search exploit and vulnerability intelligence reports using parameters such as CVE, vendor, product, or keyword.",
    tags=["Search"],
    operation_id="searchExploitReports",
    response_description="Exploit intelligence search results containing metadata for each matching exploit report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:exploit")),
    ],
)
async def search_leak(param: search_leak_param_model = Body(...)):
    return await search_model.getInstance().search_exploit_result(param)


@api_routes.post(
    "/api/search/defacement",
    summary="Search defacement reports",
    description="Search defacement intelligence reports by keyword, threat group, or affected domain; returns metadata for matching defacement reports.",
    tags=["Search"],
    operation_id="searchDefacementReports",
    response_description="Defacement intelligence search results with metadata for each matching defacement report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:defacement")),
    ],
)
async def search_defacement(param: search_defacement_param_model = Body(...)):
    return await search_model.getInstance().search_defacement_result(param)


@api_routes.get(
    "/api/search/defacement/{doc_id}",
    summary="Get defacement report",
    description="Get a specific defacement intelligence report targeting phishing or hacked websites by its report ID.",
    tags=["Reports"],
    operation_id="getDefacementReport",
    response_description="Full defacement intelligence report, including details on the targeted website and defacement indicators.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_defacement_document(doc_id: str):
    return await search_model.getInstance().request_defacement_doc(doc_id)


@api_routes.get(
    "/api/search/breach/{doc_id}",
    summary="Get breach monitoring report",
    description="Get a specific breach monitoring report for a tracked website or asset by its report ID and optional language.",
    tags=["Reports"],
    operation_id="getBreachReport",
    response_description="Full breach intelligence report with details about the monitored website and associated breach data.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_leak_document(
    doc_id: str,
    lang: Optional[str] = Query(None, alias="lang", description="Optional language code for localized report content."),
):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get(
    "/api/search/news/{doc_id}",
    summary="Get breach-related news report",
    description="Get a specific breach-related news intelligence report, generated from external news feeds, by its report ID and optional language.",
    tags=["Reports"],
    operation_id="getNewsReport",
    response_description="News intelligence report describing breach-related events from external news sources.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_leak_document(
    doc_id: str,
    lang: Optional[str] = Query(None, alias="lang", description="Optional language code for localized report content."),
):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get(
    "/api/search/exploit/{doc_id}",
    summary="Get exploit intelligence report",
    description="Get a specific exploit intelligence report (CVE, exploit kit, zero-day activity, etc.) by its report ID and optional language.",
    tags=["Reports"],
    operation_id="getExploitReport",
    response_description="Exploit intelligence report containing details about vulnerabilities, CVEs, and exploitation activity.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_leak_document(
    doc_id: str,
    lang: Optional[str] = Query(None, alias="lang", description="Optional language code for localized report content."),
):
    return await search_model.getInstance().request_exploit_doc(doc_id, lang)


@api_routes.get(
    "/api/search/strategic/{doc_id}",
    summary="Get darkweb strategic report",
    description="Get a specific strategic intelligence report aggregating crawled content from onion, I2P, and Freenet pages by its report ID and optional language.",
    tags=["Reports"],
    operation_id="getStrategicReport",
    response_description="Strategic intelligence report built from darkweb and hidden-service crawled content.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_general_document(
    doc_id: str,
    lang: Optional[str] = Query(None, alias="lang", description="Optional language code for localized report content."),
):
    return await search_model.getInstance().request_general_doc(doc_id, lang)


@api_routes.get(
    "/api/search/chat/{doc_id}",
    summary="Get chat intelligence report",
    description="Get a specific chat intelligence report focused on messaging platforms such as Telegram by its report ID and optional language.",
    tags=["Reports"],
    operation_id="getChatReport",
    response_description="Chat intelligence report summarizing relevant conversations and messages (for example from Telegram).",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_general_document(
    doc_id: str,
    lang: Optional[str] = Query(None, alias="lang", description="Optional language code for localized report content."),
):
    return await search_model.getInstance().request_chat_doc(doc_id, lang)


@api_routes.get(
    "/api/search/social/{doc_id}",
    summary="Get social media intelligence report",
    description="Get a specific social media intelligence report (for example posts by ransomware groups on platforms like Facebook or similar) by its report ID and optional language.",
    tags=["Reports"],
    operation_id="getSocialReport",
    response_description="Social media intelligence report containing posts and activity from monitored social platforms.",
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def get_social_document(
    doc_id: str,
    lang: Optional[str] = Query(None, alias="lang", description="Optional language code for localized report content."),
):
    return await search_model.getInstance().request_social_doc(doc_id, lang)


@api_routes.get(
    "/api/search/breach/screenshot/{filename}",
    summary="Get breach report screenshot",
    description="Retrieve the screenshot image associated with a specific breach report, stored in WebP format.",
    tags=["Reports"],
    operation_id="getBreachReportScreenshot",
    response_description="WebP screenshot image that visually represents the breached website or resource described in the breach report.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("module:breach")),
    ],
)
async def get_screenshot(filename: str):
    return await crawl_model.getInstance().get_screenshot_file(f"{filename}.webp")


@api_routes.post(
    "/api/dynamic/user",
    summary="Dynamic user email exposure search",
    description=(
        "Perform a dynamic search for user email addresses discovered in monitored breach and defacement data, "
        "returning exposed account metadata for further investigation and remediation."
    ),
    tags=["Live Dynamic Scan"],
    operation_id="dynamicUserEmailExposureSearch",
    response_description="Dynamic search results listing exposed user email addresses and associated intelligence metadata.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "user")


@api_routes.post(
    "/api/dynamic/cracked",
    summary="Dynamic cracked credential search",
    description=(
        "Perform a dynamic search for cracked credentials identified in breach and defacement datasets, "
        "highlighting high-risk compromised accounts and password reuse exposure."
    ),
    tags=["Live Dynamic Scan"],
    operation_id="dynamicCrackedCredentialSearch",
    response_description="Dynamic search results listing cracked credentials with related breach context and metadata.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "cracked")


@api_routes.post(
    "/api/urlscan/domain",
    summary="Domain, SEO, and repository scan",
    description=(
        "Scan a target domain using the configured scanning engine. Supports scan modes via `scanType`:\n"
        "- `basic` → infrastructure & HTTP intelligence\n"
        "- `seo`   → SEO metadata, indexing, ranking signals\n"
        "- `repo`  → linked repository scan (GitHub/GitLab, exposed files, commit metadata)"
    ),
    tags=["Live Dynamic Scan"],
    operation_id="scanDomainBasicSeoRepo",
    response_description=(
        "Scan results for the selected `scanType`, containing domain intelligence, SEO metrics, or repository analysis artifacts."
    ),
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(limiter_dependency),
        Depends(license_required("scanning")),
    ],
)
async def parse_text(payload: DomainScanRequest):
    return await crawl_model.getInstance().scan_domain(payload)


@api_routes.post(
    "/api/dynamic/social",
    summary="Dynamic social identifier exposure search",
    description=(
        "Perform a dynamic search for social media identifiers and related email addresses found in breach and "
        "defacement data, helping uncover exposed or impersonated social accounts."
    ),
    tags=["Live Dynamic Scan"],
    operation_id="dynamicSocialIdentifierExposureSearch",
    response_description="Dynamic search results listing exposed social media identifiers and related contact details.",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "social")
