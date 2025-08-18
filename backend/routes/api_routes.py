import asyncio
from typing import Optional

from fastapi import APIRouter, Body
from fastapi import Depends, Query

from configs.app_dependency import role_required
from configs.limiter_dependency import limiter_dependency
from orion.api.interactive.directory_manager.directory_model import directory_model
from orion.api.interactive.directory_manager.directory_shared_model.directory_param_model import directory_param_model
from orion.api.interactive.dump_manager.dump_model import dump_model
from orion.api.interactive.dump_manager.dump_shared_model.dump_param_model import dump_param_model
from orion.api.interactive.hompage_manager.homepage_model import homepage_model
from orion.api.interactive.search_manager.search_data_model.chat.search_chat_param_model import search_chat_param_model
from orion.api.interactive.search_manager.search_data_model.consolidated.search_consolidated_param_model import \
    search_consolidated_param_model
from orion.api.interactive.search_manager.search_data_model.defacement.search_defacement_param_model import \
    search_defacement_param_model
from orion.api.interactive.search_manager.search_data_model.dump.search_credential_param_model import \
    search_credential_param_model
from orion.api.interactive.search_manager.search_data_model.dynamic.search_dynamic_param_model import \
    search_dynamic_param_model
from orion.api.interactive.search_manager.search_data_model.general.search_general_param_model import \
    search_general_param_model
from orion.api.interactive.search_manager.search_data_model.leak.search_leak_param_model import search_leak_param_model
from orion.api.interactive.search_manager.search_data_model.social.search_social_param_model import \
    search_social_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.config_manager.config_controller import config_controller
from orion.api.server.crawl_manager.class_model.report_chat_data_model import ReportChatRequest
from orion.api.server.crawl_manager.crawl_model import crawl_model
from orion.api.server.entity_manager.entity_manager import entity_manager
from orion.api.server.entity_manager.modal.EntityQueryModel import EntityQueryModel
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX
from orion.services.mongo_manager.shared_model.db_auth_models import user_role

api_routes = APIRouter()


@api_routes.get("/api/public", description="Get publicly exposed configuration values for frontend initialization.")
async def get_public_config():
    return await config_controller.getInstance().get_all()

@api_routes.get("/api/directory", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Fetch the directory listing with optional filters for categories, types, or tags.")
async def get_directory(param: directory_param_model = Depends()):
    return await directory_model.getInstance().invoke_directory(param)

@api_routes.get("/api/dumps", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Fetch the directory listing with optional filters for categories, types, or tags.")
async def get_directory(param: dump_param_model = Depends()):
    return await dump_model.getInstance().invoke_dump(param)

@api_routes.get("/api/insight", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Retrieve analytics and strategic insights for dashboard overview.")
async def get_insight():
    insights_task = homepage_model.getInstance().invoke_analytics()
    latestDocument_task = homepage_model.getInstance().insight_consolidated_result()
    graph_insight_task = homepage_model.getInstance().invoke_graphs()

    insights, latestDocument, graph_insight = await asyncio.gather(
        insights_task,
        latestDocument_task,
        graph_insight_task
    )

    return {
        "insights": insights,
        "latestDocument": latestDocument,
        "graph_insight": graph_insight
    }

@api_routes.get("/api/graph",
                description="Fetch the graph relationships for a given entity based on its model type and value.")
async def get_entity_relations(query: EntityQueryModel = Depends()):
    manager = entity_manager.get_instance()
    return await manager.get_entity_relations(query)

@api_routes.post("/api/nlp/chat/report",  dependencies=[Depends(role_required([user_role.ADMIN, user_role.CRAWLER])), Depends(limiter_dependency)])
async def chat_report(payload: ReportChatRequest):
    response = await crawl_model.getInstance().parse_chat_ai(payload)
    return response

@api_routes.post("/api/search/strategic", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Search strategic intelligence reports using filters like category, title, date, or hash.")
async def search_general(param: search_general_param_model = Body(...)):
    return await search_model.getInstance().search_general_result(param)

@api_routes.get("/api/search/stealerlogs", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_telegram(param: search_credential_param_model = Depends()):
    return await search_model.getInstance().search_stealerlogs_result(param)


@api_routes.post("/api/search/consolidated", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Search breach (leak) intelligence reports using parameters such as company, country, or hash.")
async def search_consolidated(param: search_consolidated_param_model = Body(...)):
    return await search_model.getInstance().search_consolidated_result(param)


@api_routes.post("/api/search/consolidated/ranked", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))], description="Search breach (leak) intelligence reports using parameters such as company, country, or hash.")
async def search_consolidated(param: search_consolidated_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_LEAK_INDEX,
        ELASTIC_INDEX.S_GENERIC_INDEX,
        ELASTIC_INDEX.S_EXPLOIT_INDEX,
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX
    ]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [])


@api_routes.post("/api/chat/telegram", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_telegram(param: search_chat_param_model = Body(...)):
    return await search_model.getInstance().search_telegram_result(param)


@api_routes.post("/api/exploit/discussion", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_discussion(param: search_general_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_CHATS_INDEX
    ]
    if param.category in ['all']:
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, ['cve', 'tools', 'zeroday'])
    else:
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [param.category])


@api_routes.post("/api/social/all", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_discussion(param: search_general_param_model = Body(...)):
    base_index = [
        ELASTIC_INDEX.S_CHATS_INDEX,
        ELASTIC_INDEX.S_SOCIAL_INDEX
    ]
    return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [])

@api_routes.post("/api/social", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))])
async def search_twitter(param: search_social_param_model = Body(...)):
    return await search_model.getInstance().search_social_result(param)


@api_routes.post("/api/search/breach", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Search breach (leak) intelligence reports using parameters such as company, country, or hash.")
async def search_leak(param: search_leak_param_model = Body(...)):
    if param.category in ['all']:
        base_index = [
            ELASTIC_INDEX.S_LEAK_INDEX,
            ELASTIC_INDEX.S_CHATS_INDEX
        ]
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, ["email", "logs", "warfare", "cloud"])
    elif param.category in ["email", "logs", "warfare", "cloud"]:
        base_index = [
            ELASTIC_INDEX.S_CHATS_INDEX
        ]
        return await search_model.getInstance().search_consolidated_ranked_result(param, base_index, [param.category])
    else:
        return await search_model.getInstance().search_leak_result(param)


@api_routes.post("/api/search/news", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Search breach news (leak) intelligence reports using parameters such as company, country, or hash.")
async def search_news(param: search_leak_param_model = Body(...)):
    param.mContentType = "news"
    return await search_model.getInstance().search_leak_result(param)


@api_routes.post("/api/search/exploit", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Search breach (leak) intelligence reports using parameters such as company, country, or hash.")
async def search_leak(param: search_leak_param_model = Body(...)):
    return await search_model.getInstance().search_exploit_result(param)


@api_routes.post("/api/search/defacement", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Search defacement intelligence reports by keywords, group names, or affected domains.")
async def search_defacement(param: search_defacement_param_model = Body(...)):
    return await search_model.getInstance().search_defacement_result(param)


@api_routes.get("/api/search/defacement/{doc_id}",
                dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Get a specific defacement document by its document ID.")
async def get_defacement_document(doc_id: str):
    return await search_model.getInstance().request_defacement_doc(doc_id)


@api_routes.get("/api/search/breach/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Get a specific breach (leak) document by its document ID and optional language.")
async def get_leak_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get("/api/search/news/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Get a specific breach (leak) document by its document ID and optional language.")
async def get_leak_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
    return await search_model.getInstance().request_leak_doc(doc_id, lang)


@api_routes.get("/api/search/exploit/{doc_id}",
                dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Get a specific breach (leak) document by its document ID and optional language.")
async def get_leak_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
    return await search_model.getInstance().request_exploit_doc(doc_id, lang)


@api_routes.get("/api/search/strategic/{doc_id}",
                dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Get a specific strategic report document by its document ID and optional language.")
async def get_general_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
    return await search_model.getInstance().request_general_doc(doc_id, lang)


@api_routes.get("/api/search/chat/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],description="Get a specific strategic report document by its document ID and optional language.")
async def get_general_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
    return await search_model.getInstance().request_chat_doc(doc_id, lang)


@api_routes.get("/api/search/social/{doc_id}", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Get a specific strategic report document by its document ID and optional language.")
async def get_social_document(doc_id: str, lang: Optional[str] = Query(None, alias="lang")):
    return await search_model.getInstance().request_social_doc(doc_id, lang)


@api_routes.get("/api/dynamic/email", dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Perform a dynamic search for emails found in breach and defacement data.")
async def search_dynamic_email(param: search_dynamic_param_model = Depends()):
    return await search_model.getInstance().dynamic_search_email(param)


@api_routes.get("/api/search/breach/screenshot/{filename}",
                dependencies=[Depends(role_required([user_role.ADMIN, user_role.DEMO]))],
                description="Retrieve the screenshot associated with a breach document (image is in .webp format).")
async def get_screenshot(filename: str):
    return await crawl_model.getInstance().get_screenshot_file(f"{filename}.webp")
