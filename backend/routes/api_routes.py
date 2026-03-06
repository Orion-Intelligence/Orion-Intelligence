import asyncio
from typing import Optional
from fastapi import APIRouter, Body, Depends, Query, UploadFile, File
from configs.app_dependency import license_required, role_required, status_required, get_current_user
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import (directory_param_model, )
from orion.api.interactive.dump_manager.dump_model import dump_model
from orion.api.interactive.dump_manager.dump_shared_model.dump_param_model import dump_param_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import (search_consolidated_param_model, )
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import (search_credential_param_model, )
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import (search_dynamic_crack_model, search_dynamic_param_model, search_dynamic_social_model, search_dynamic_crypto_model, )
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.crawl_manager.class_model.domain_scan_request_model import (DomainScanRequest, )
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import (IPScanRequest)
from orion.api.server.crawl_manager.class_model.social_scrape_request_model import (SocialScrapeRequest, )
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.shared_model.db_auth_models import (UserStatus, user_role, )
from orion.services.stix_manager.stix_manager import stix_manager
from routes.docs.docs import (CRYPTO_DOCS, DYNAMIC_DOCS, REPORT_DOCS, SEARCH_DOCS, SUPPORT_METHOD_DOCS, SYSTEM_INFO_DOCS)

api_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])
SCAN_ROLE_DEPS = [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
SCAN_WITH_LIMITER_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(limiter_dependency), Depends(license_required("scanning"))]
STEALER_LOG_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(license_required("module:stealer_logs", bypass_roles=[], bypass_licenses=["maintainer"]))]
STIX_MEMBER_DEPS = [Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))]
GENERAL_MODULE_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(license_required("module:general"))]
SCANNING_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(license_required("scanning"))]


async def _scan_domain_with_type(payload: DomainScanRequest, user_id: str, scan_type: Optional[str] = None):
    if scan_type:
        payload.scanType = scan_type
    return await crawl_model.getInstance().scan_domain(payload, user_id=user_id)


@api_routes.post(
    "/api/search/strategic",
    summary="Search strategic reports",
    description=SEARCH_DOCS["strategic"]["description"],
    tags=["Search"],
    operation_id="searchStrategicReports",
    response_description=SEARCH_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=GENERAL_MODULE_DEPS, )
async def search_general(param: search_consolidated_param_model = Body(...)):
    base_index = [ELASTIC_INDEX.S_GENERIC_INDEX]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])


@api_routes.post(
    "/api/search/breach",
    summary="Search breach reports",
    description=SEARCH_DOCS["breach"]["description"],
    tags=["Search"],
    operation_id="searchBreachReports",
    response_description=SEARCH_DOCS["breach"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:breach"))])
async def search_leak(param: search_consolidated_param_model = Body(...)):
    if param.category in ["all"]:
        base_index = [ELASTIC_INDEX.S_LEAK_INDEX]
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, ["news"], ["leaks", "tracking"])
    else:
        if param.category == "databases":
            param.category = "leaks"
        base_index = [ELASTIC_INDEX.S_LEAK_INDEX]
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index,[], [param.category])


@api_routes.post(
    "/api/search/social",
    summary="Search social reports",
    description=SEARCH_DOCS["strategic"]["description"],
    tags=["Search"],
    operation_id="searchSocialReports",
    response_description=SEARCH_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=GENERAL_MODULE_DEPS, )
async def search_social(param: search_consolidated_param_model = Body(...)):
    if param.category == "all":
        base_index = [ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_INDEX.S_SOCIAL_INDEX]
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])
    else:
        param.platform = param.category
        param.category = ""
        if param.platform == "telegram":
            base_index = [ELASTIC_INDEX.S_CHATS_INDEX]
            return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [])
        else:
            base_index = [ELASTIC_INDEX.S_SOCIAL_INDEX]
            return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category])


@api_routes.post(
    "/api/search/exploit",
    summary="Search exploit reports",
    description=SEARCH_DOCS["strategic"]["description"],
    tags=["Search"],
    operation_id="searchExploitReports",
    response_description=SEARCH_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=GENERAL_MODULE_DEPS, )
async def search_exploit(param: search_consolidated_param_model = Body(...)):
    base_index = [ELASTIC_INDEX.S_EXPLOIT_INDEX]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category])


@api_routes.post(
    "/api/search/defacement",
    summary="Search defacement reports",
    description=SEARCH_DOCS["strategic"]["description"],
    tags=["Search"],
    operation_id="searchDefacementReports",
    response_description=SEARCH_DOCS["strategic"]["response_description"],
    status_code=200,
    dependencies=GENERAL_MODULE_DEPS, )
async def search_defacement(param: search_consolidated_param_model = Body(...)):
    param.content = param.category
    base_index = [ELASTIC_INDEX.S_DEFACEMENT_INDEX]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [], [param.category])


@api_routes.get(
    "/api/directory",
    summary="Get monitored source directory",
    description=SYSTEM_INFO_DOCS["directory"]["description"],
    tags=["System Info"],
    operation_id="getSystemDirectory",
    response_description=SYSTEM_INFO_DOCS["directory"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER]))])
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:dumps")), ], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.DEMO, user_role.ANALYST]))])
async def get_insight():
    insights_task = homepage_model.getInstance().invoke_analytics()
    latestDocument_task = homepage_model.getInstance().insight_consolidated_result()
    countryInsightsTask = homepage_model.getInstance().get_country_specific_insights()

    insights, latestDocument, country_insight = await asyncio.gather(insights_task, latestDocument_task, countryInsightsTask)
    return {"insights": insights, "latestDocument": latestDocument, "country_insight": country_insight}


@api_routes.post(
    "/api/search/stealerlogs",
    summary="Search stealer log reports",
    description=SEARCH_DOCS["stealerlogs"]["description"],
    tags=["Search"],
    operation_id="searchStealerLogReports",
    response_description=SEARCH_DOCS["stealerlogs"]["response_description"],
    include_in_schema=False,
    status_code=200,
    dependencies=STEALER_LOG_DEPS)
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
    dependencies=STEALER_LOG_DEPS)
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
async def search_consolidated_iocs( param: search_consolidated_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_INDEX.S_EXPLOIT_INDEX,
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX,
        ELASTIC_INDEX.S_DEFACEMENT_INDEX,
    ]
    return await search_model.getInstance().search_consolidated_iocs(param, base_index)

@api_routes.get(
    "/api/search/defacement/{doc_id}",
    summary="Get defacement report",
    description=REPORT_DOCS["defacement"]["description"],
    tags=["Reports"],
    operation_id="getDefacementReport",
    response_description=REPORT_DOCS["defacement"]["response_description"],
    status_code=200,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:defacement", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:breach", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:news", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:exploit", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:general", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:chat", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:social", bypass_licenses=["maintainer"]))], )
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
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("module:breach", bypass_licenses=["maintainer"])), ], )
async def get_screenshot(filename: str):
    return await crawl_model.getInstance().get_screenshot_file(f"{filename}.webp")


@api_routes.post(
    "/api/dynamic/user",
    summary="Dynamic user email exposure search",
    description=DYNAMIC_DOCS["dynamic_user_email"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicUserEmailExposureSearch",
    response_description=DYNAMIC_DOCS["dynamic_user_email"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS, )
async def search_dynamic_email(param: search_dynamic_param_model = Body(...), current_user=Depends(get_current_user)):
    return await search_model.getInstance().dynamic_search(param, "user", user_id=str(current_user.id))


@api_routes.post(
    "/api/dynamic/cracked",
    summary="Dynamic cracked credential search",
    description=DYNAMIC_DOCS["dynamic_cracked"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicCrackedCredentialSearch",
    response_description=DYNAMIC_DOCS["dynamic_cracked"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS, )
async def search_dynamic_cracked(param: search_dynamic_crack_model = Body(...), current_user=Depends(get_current_user)):
    return await search_model.getInstance().dynamic_search(param, "cracked", user_id=str(current_user.id))


@api_routes.post(
    "/api/dynamic/software",
    summary="Dynamic software credential search",
    description=DYNAMIC_DOCS["dynamic_software"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicSoftwareCredentialSearch",
    response_description=DYNAMIC_DOCS["dynamic_software"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS, )
async def search_dynamic_software(param: search_dynamic_crack_model = Body(...), current_user=Depends(get_current_user)):
    return await search_model.getInstance().dynamic_search(param, "software", user_id=str(current_user.id))


@api_routes.post(
    "/api/urlscan/domain",
    summary="Domain, SEO, and repository scan",
    description=DYNAMIC_DOCS["domain_scan"]["description"],
    tags=["Entity Scans"],
    operation_id="scanDomainBasicSeoRepo",
    response_description=DYNAMIC_DOCS["domain_scan"]["response_description"],
    status_code=200,
    dependencies=SCAN_WITH_LIMITER_DEPS, )
async def parse_domain_scan(payload: DomainScanRequest, current_user=Depends(get_current_user)):
    return await _scan_domain_with_type(payload, user_id=str(current_user.id))


@api_routes.post(
    "/api/urlscan/subdomains",
    summary="Returns the list of associated subdomains",
    description=SUPPORT_METHOD_DOCS["subdomain_scan"]["description"],
    tags=["Support Method"],
    operation_id="scanSubdomains",
    response_description=SUPPORT_METHOD_DOCS["subdomain_scan"]["response_description"],
    status_code=200,
    dependencies=SCAN_WITH_LIMITER_DEPS, )
async def parse_subdomain_scan(payload: DomainScanRequest, current_user=Depends(get_current_user)):
    return await _scan_domain_with_type(payload, user_id=str(current_user.id), scan_type='subdomains')


@api_routes.post(
    "/api/urlscan/dns",
    summary="Reverse DNS and ping check",
    description=SUPPORT_METHOD_DOCS["dns_scan"]["description"],
    tags=["Support Method"],
    operation_id="scanDns",
    response_description=SUPPORT_METHOD_DOCS["dns_scan"]["response_description"],
    status_code=200,
    dependencies=SCAN_WITH_LIMITER_DEPS, )
async def parse_dns_scan(payload: DomainScanRequest, current_user=Depends(get_current_user)):
    return await _scan_domain_with_type(payload, user_id=str(current_user.id), scan_type='dns')


@api_routes.post(
    "/api/urlscan/wayback",
    summary="Fetches archived snapshots and timestamps",
    description=SUPPORT_METHOD_DOCS["wayback_scan"]["description"],
    tags=["Support Method"],
    operation_id="scanWaybackDomain",
    response_description=SUPPORT_METHOD_DOCS["wayback_scan"]["response_description"],
    status_code=200,
    dependencies=SCAN_WITH_LIMITER_DEPS, )
async def parse_wayback_scan(payload: DomainScanRequest, current_user=Depends(get_current_user)):
    return await _scan_domain_with_type(payload, user_id=str(current_user.id), scan_type='wayback')


@api_routes.post(
    "/api/urlscan/ip",
    include_in_schema=False,
    dependencies=SCAN_WITH_LIMITER_DEPS,
)
async def parse_ip(payload: IPScanRequest, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().scan_ip(payload, user_id=str(current_user.id))


@api_routes.post(
    "/api/social/scrape",
    include_in_schema=False,
    dependencies=SCAN_WITH_LIMITER_DEPS, )
async def scrape_social(payload: SocialScrapeRequest, current_user=Depends(get_current_user)):
    return await crawl_model.getInstance().scrape_social(payload, user_id=str(current_user.id))


@api_routes.post(
    "/api/dynamic/social",
    summary="Dynamic social_models identifier exposure search",
    description=DYNAMIC_DOCS["dynamic_social"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicSocialIdentifierExposureSearch",
    response_description=DYNAMIC_DOCS["dynamic_social"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS, )
async def search_dynamic_social(param: search_dynamic_social_model = Body(...), current_user=Depends(get_current_user)):
    return await search_model.getInstance().dynamic_search(param, "social", user_id=str(current_user.id))

@api_routes.post(
    "/api/dynamic/wanted",
    summary="Searches wanted people around the Globe",
    description=DYNAMIC_DOCS["wanted_scanner"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicWantedPeopleSearch",
    response_description=DYNAMIC_DOCS["wanted_scanner"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS, )
async def search_dynamic_wanted(param: search_dynamic_social_model = Body(...)):
    return await search_model.getInstance().search_wanted_list(param)

@api_routes.post(
    "/api/dynamic/national-identity",
    summary="Dynamic national identity search",
    description=DYNAMIC_DOCS["dynamin_national_identity"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicNationalIdentitySearch",
    response_description=DYNAMIC_DOCS["dynamin_national_identity"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS, )
async def search_dynamic_national_identity(param: search_dynamic_crack_model = Body(...), current_user=Depends(get_current_user)):
    return await search_model.getInstance().dynamic_search(param, "pak_database", user_id=str(current_user.id))

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
    dependencies=STIX_MEMBER_DEPS, )
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
    dependencies=STIX_MEMBER_DEPS, )
async def get_chat_stix_document(doc_id: str, lang: Optional[str] = Query(
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
    tags=["Entity Scans"],
    operation_id="iocExtractFromFile",
    response_description=DYNAMIC_DOCS["ioc_extract"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST, Depends(license_required("scanning"))])),
    ],
)
async def extract_ioc(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    file_content = await file.read()
    result = await search_model.getInstance().extract_ioc_from_file(file_content, file.filename, user_id=str(current_user.id))
    return result


@api_routes.post(
    "/api/apk/scan",
    summary="Dynamic analysis scan to identify application metadata, cracking indicators, etc",
    description=DYNAMIC_DOCS["apk_scan"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicApkScan",
    response_description=DYNAMIC_DOCS["apk_scan"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])), Depends(license_required("scanning"))],
)
async def scan_apk(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    file_content = await file.read()
    result = await search_model.getInstance().scan_apk(file_content, file.filename, user_id=str(current_user.id))

    return result


@api_routes.post(
    "/api/crypto/scan",
    summary="Scan cryptocurrency wallet address or transaction hash",
    description=CRYPTO_DOCS["crypto_scan"]["description"],
    tags=["Entity Scans"],
    operation_id="dynamicCryptoScan",
    response_description=CRYPTO_DOCS["crypto_scan"]["response_description"],
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("scanning"))
    ],
)
async def crypto_scan(param: search_dynamic_crypto_model = Body(...), current_user=Depends(get_current_user)):
    return await search_model.getInstance().dynamic_search(param, "crypto", user_id=str(current_user.id))
