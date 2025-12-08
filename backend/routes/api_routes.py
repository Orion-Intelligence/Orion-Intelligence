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
from orion.api.interactive.system_settings_manager.system_settings_manager import SystemSettingsManager
from orion.services.mongo_manager.shared_model.db_system_settings import AllowedKeys
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, UserStatus
from routes.docs.docs import SYSTEM_INFO_DOCS, REPORT_DOCS, DYNAMIC_DOCS, SEARCH_DOCS

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
    description=SEARCH_DOCS["strategic"]["description"],
    tags=["Search"],
    operation_id="searchStrategicReports",
    response_description=SEARCH_DOCS["strategic"]["response_description"],
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
    description=SEARCH_DOCS["stealerlogs"]["description"],
    tags=["Search"],
    operation_id="searchStealerLogReports",
    response_description=SEARCH_DOCS["stealerlogs"]["response_description"],
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
    description=SEARCH_DOCS["consolidated"]["description"],
    tags=["Search"],
    operation_id="searchConsolidatedReports",
    response_description=SEARCH_DOCS["consolidated"]["response_description"],
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
    description=SEARCH_DOCS["consolidated_ranked"]["description"],
    tags=["Search"],
    operation_id="searchConsolidatedReportsRanked",
    response_description=SEARCH_DOCS["consolidated_ranked"]["response_description"],
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
    description=SEARCH_DOCS["telegram"]["description"],
    tags=["Search"],
    operation_id="searchTelegramChatReports",
    response_description=SEARCH_DOCS["telegram"]["response_description"],
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
    include_in_schema=False,
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
    include_in_schema=False,
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
    description=SEARCH_DOCS["social"]["description"],
    tags=["Search"],
    operation_id="searchAllSocialChatReports",
    response_description=SEARCH_DOCS["social"]["response_description"],
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
    description=SEARCH_DOCS["social"]["description"],
    tags=["Search"],
    operation_id="searchSocialMediaReports",
    response_description=SEARCH_DOCS["social"]["response_description"],
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
    description=SEARCH_DOCS["breach"]["description"],
    tags=["Search"],
    operation_id="searchBreachReports",
    response_description=SEARCH_DOCS["breach"]["response_description"],
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
    description=SEARCH_DOCS["news"]["description"],
    tags=["Search"],
    operation_id="searchBreachNewsReports",
    response_description=SEARCH_DOCS["news"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.PROFILE, user_role.ANALYST]))],
)
async def search_news(param: search_leak_param_model = Body(...)):
    param.mContentType = "news"
    return await search_model.getInstance().search_leak_result(param)


@api_routes.post(
    "/api/search/exploit",
    summary="Search exploit reports",
    description=SEARCH_DOCS["exploit"]["description"],
    tags=["Search"],
    operation_id="searchExploitReports",
    response_description=SEARCH_DOCS["exploit"]["response_description"],
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
    description=SEARCH_DOCS["defacement"]["description"],
    tags=["Search"],
    operation_id="searchDefacementReports",
    response_description=SEARCH_DOCS["defacement"]["response_description"],
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
    description=REPORT_DOCS["defacement"]["description"],
    tags=["Reports"],
    operation_id="getDefacementReport",
    response_description=REPORT_DOCS["defacement"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
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
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
async def get_leak_document(
    doc_id: str,
    lang: Optional[str] = Query(
        None,
        alias="lang",
        description="Optional language code for localized report content.",
    ),
):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get(
    "/api/search/news/{doc_id}",
    summary="Get breach-related news report",
    description=REPORT_DOCS["news"]["description"],
    tags=["Reports"],
    operation_id="getNewsReport",
    response_description=REPORT_DOCS["news"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
async def get_leak_document(
    doc_id: str,
    lang: Optional[str] = Query(
        None,
        alias="lang",
        description="Optional language code for localized report content.",
    ),
):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get(
    "/api/search/exploit/{doc_id}",
    summary="Get exploit intelligence report",
    description=REPORT_DOCS["exploit"]["description"],
    tags=["Reports"],
    operation_id="getExploitReport",
    response_description=REPORT_DOCS["exploit"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
async def get_leak_document(
    doc_id: str,
    lang: Optional[str] = Query(
        None,
        alias="lang",
        description="Optional language code for localized report content.",
    ),
):
    return await search_model.getInstance().request_exploit_doc(doc_id, lang)


@api_routes.get(
    "/api/search/strategic/{doc_id}",
    summary="Get darkweb strategic report",
    description=REPORT_DOCS["strategic"]["description"],
    tags=["Reports"],
    operation_id="getStrategicReport",
    response_description=REPORT_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
async def get_general_document(
    doc_id: str,
    lang: Optional[str] = Query(
        None,
        alias="lang",
        description="Optional language code for localized report content.",
    ),
):
    return await search_model.getInstance().request_general_doc(doc_id, lang)


@api_routes.get(
    "/api/search/chat/{doc_id}",
    summary="Get chat intelligence report",
    description=REPORT_DOCS["chat"]["description"],
    tags=["Reports"],
    operation_id="getChatReport",
    response_description=REPORT_DOCS["chat"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
async def get_general_document(
    doc_id: str,
    lang: Optional[str] = Query(
        None,
        alias="lang",
        description="Optional language code for localized report content.",
    ),
):
    return await search_model.getInstance().request_chat_doc(doc_id, lang)


@api_routes.get(
    "/api/search/social/{doc_id}",
    summary="Get social media intelligence report",
    description=REPORT_DOCS["social"]["description"],
    tags=["Reports"],
    operation_id="getSocialReport",
    response_description=REPORT_DOCS["social"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
    ],
)
async def get_social_document(
    doc_id: str,
    lang: Optional[str] = Query(
        None,
        alias="lang",
        description="Optional language code for localized report content.",
    ),
):
    return await search_model.getInstance().request_social_doc(doc_id, lang)


@api_routes.get(
    "/api/search/breach/screenshot/{filename}",
    summary="Get breach report screenshot",
    description=REPORT_DOCS["breach_screenshot"]["description"],
    tags=["Reports"],
    operation_id="getBreachReportScreenshot",
    response_description=REPORT_DOCS["breach_screenshot"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
        Depends(license_required("module:breach")),
    ],
)
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
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
        Depends(license_required("scanning")),
    ],
)
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
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "cracked")



@api_routes.post(
    "/api/urlscan/domain",
    summary="Domain, SEO, and repository scan",
    description=DYNAMIC_DOCS["domain_scan"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="scanDomainBasicSeoRepo",
    response_description=DYNAMIC_DOCS["domain_scan"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
        Depends(limiter_dependency),
        Depends(license_required("scanning")),
    ],
)
async def parse_text(payload: DomainScanRequest):
    return await crawl_model.getInstance().scan_domain(payload)


@api_routes.post(
    "/api/dynamic/social",
    summary="Dynamic social identifier exposure search",
    description=DYNAMIC_DOCS["dynamic_social"]["description"],
    tags=["Live Dynamic Scan"],
    operation_id="dynamicSocialIdentifierExposureSearch",
    response_description=DYNAMIC_DOCS["dynamic_social"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN,
            user_role.DEMO,
            user_role.PROFILE,
            user_role.ANALYST,
        ])),
        Depends(license_required("scanning")),
    ],
)
async def search_dynamic_email(param: search_dynamic_param_model = Body(...)):
    return await search_model.getInstance().dynamic_search(param, "social")

@api_routes.get(
        "/api/system-settings",
        summary="Dynamic social identifier exposure search",
    tags=["Get System Settings"],
    operation_id="getSystemSettings",
    status_code=200,
    dependencies=[
        Depends(role_required([
            user_role.ADMIN
        ])),
    ],)
async def get_system_settings():
    return {
        "language": await SystemSettingsManager.get_instance().get_value(AllowedKeys.LANGUAGE_ALLOWED),
        "version": await  SystemSettingsManager.get_instance().get_value(AllowedKeys.VERSION),
        "apiAllowed": await  SystemSettingsManager.get_instance().get_value(AllowedKeys.API_ALLOWED),
    }