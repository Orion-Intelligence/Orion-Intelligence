from fastapi import APIRouter, Body, Depends
from fastapi.responses import StreamingResponse
from configs.app_dependency import get_current_user, license_required, role_required, status_required
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.search_manager.search_data_model.map_entities.search_map_entities_param_model import search_map_entities_param_model
from orion.api.interactive.search_manager.search_model import search_model
from orion.api.server.crawl_manager.class_model.ip_scan_request_model import GeoCameraDetectRangesRequest, GeoCameraDetectRequest
from orion.api.server.geo_fencing_manager.class_model.satellite_request_models import (
    SatelliteAnomalyRequest,
    SatelliteCompareRequest,
    SatelliteFacilitiesRequest,
    SatelliteGeocodeRequest,
    SatelliteImageRequest,
    SatelliteLiveTrackerAircraftIcaoRequest,
    SatelliteLiveTrackerAircraftTrackRequest,
    SatelliteLiveTrackerBBoxRequest,
    SatelliteLiveTrackerShipMmsiRequest,
    SatelliteLiveTrackerStatusRequest,
)
from orion.api.server.geo_fencing_manager.geo_fencing_manager import geo_fencing_manager
from orion.services.mongo_manager.shared_model.db_auth_models import UserStatus, user_role
from routes.docs.docs import DYNAMIC_DOCS

geo_fencing_routes = APIRouter(dependencies=[Depends(status_required([UserStatus.ACTIVE]))])
SCAN_ROLE_DEPS = [user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST]
GENERAL_MODULE_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(license_required("module:general"))]
SCANNING_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(license_required("scanning"))]
SATELLITE_INTEL_DEPS = [Depends(role_required(SCAN_ROLE_DEPS)), Depends(license_required("osint_advanced", bypass_roles=[user_role.ADMIN]))]
SATELLITE_INTEL_SHIPS_TEST_DEPS = [Depends(license_required("osint_advanced", bypass_roles=[user_role.ADMIN]))]


@geo_fencing_routes.post(
    "/api/search/map-entities/stream",
    summary="Stream map entity points",
    tags=["Search"],
    operation_id="streamMapEntities",
    status_code=200,
    dependencies=GENERAL_MODULE_DEPS,
)
async def stream_map_entities(param: search_map_entities_param_model = Body(...), current_user=Depends(get_current_user)):
    await AuditLogManager.get_instance().register(str(current_user.tenant_uuid), str(current_user.id), param.model_dump_json())
    stream = await geo_fencing_manager.get_instance().stream_map_entities_points(chunk_size=param.size)
    return StreamingResponse(
        stream,
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@geo_fencing_routes.post(
    "/api/search/map-entities/by-ids",
    summary="Get multiple map entities by IDs",
    tags=["Reports"],
    operation_id="getMapEntitiesByIds",
    status_code=200,
    dependencies=[
        Depends(role_required([user_role.ADMIN, user_role.DEMO, user_role.MEMBER, user_role.ANALYST])),
        Depends(license_required("module:general", bypass_licenses=["maintainer"])),
    ],
)
async def get_map_entities_by_ids(param: list[str] = Body(...)):
    return await geo_fencing_manager.get_instance().request_map_entities_by_ids(param)


@geo_fencing_routes.post(
    "/api/netintel/iot_detect",
    summary="Scan a geographic area for exposed cameras",
    description=DYNAMIC_DOCS["geo_camera"]["description"],
    tags=["Network Intelligence"],
    operation_id="geoIotDetect",
    response_description=DYNAMIC_DOCS["geo_camera"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS,
)
async def geo_camera_detect(param: GeoCameraDetectRequest = Body(...), current_user=Depends(get_current_user)):
    await AuditLogManager.get_instance().search_audit(current_user, "iot_detect", param.coordinates)
    return await search_model.getInstance().network_intel(param, "iot_detect", user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/netintel/camera_detect_ranges",
    summary="Scan IP ranges for exposed cameras",
    description=DYNAMIC_DOCS["geo_camera_ranges"]["description"],
    tags=["Network Intelligence"],
    operation_id="geoCameraDetectRanges",
    response_description=DYNAMIC_DOCS["geo_camera_ranges"]["response_description"],
    status_code=200,
    dependencies=SCANNING_DEPS,
)
async def geo_camera_detect_ranges(param: GeoCameraDetectRangesRequest = Body(...), current_user=Depends(get_current_user)):
    await AuditLogManager.get_instance().search_audit(current_user, "camera_detect_ranges", ",".join(param.ip_ranges))
    return await search_model.getInstance().network_intel(param, "camera_detect_ranges", user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/geocode",
    summary="Convert address to coordinates",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_geocode(payload: SatelliteGeocodeRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().geocode(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/facilities",
    summary="Detect facilities (ports, airports, military zones)",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_facilities(payload: SatelliteFacilitiesRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().facilities(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/sentinel/image",
    summary="Fetch Sentinel satellite image",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_sentinel_image(payload: SatelliteImageRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().sentinel_image(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/anomaly",
    summary="Detect anomalies in satellite imagery",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_anomaly(payload: SatelliteAnomalyRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().anomaly(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/compare",
    summary="Compare two satellite images",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_compare(payload: SatelliteCompareRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().compare(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/livetrack/aircraft",
    summary="Track aircraft in map bounds",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_livetrack_aircraft_bbox(payload: SatelliteLiveTrackerBBoxRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().livetrack_aircraft_bbox(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/livetrack/aircraft/icao",
    summary="Fetch aircraft by ICAO24",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_livetrack_aircraft_icao(payload: SatelliteLiveTrackerAircraftIcaoRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().livetrack_aircraft_icao(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/livetrack/aircraft/track",
    summary="Fetch aircraft track history",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_livetrack_aircraft_track(payload: SatelliteLiveTrackerAircraftTrackRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().livetrack_aircraft_track(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/livetrack/ships",
    summary="Track ships in map bounds",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_SHIPS_TEST_DEPS,
)
async def satellite_livetrack_ships_bbox(payload: SatelliteLiveTrackerBBoxRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().livetrack_ships_bbox(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/livetrack/ships/mmsi",
    summary="Fetch ship by MMSI",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_SHIPS_TEST_DEPS,
)
async def satellite_livetrack_ships_mmsi(payload: SatelliteLiveTrackerShipMmsiRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().livetrack_ships_mmsi(payload, user_id=str(current_user.id))


@geo_fencing_routes.post(
    "/api/satellite/livetrack/status",
    summary="Live tracker health status",
    tags=["Satellite Intelligence"],
    status_code=200,
    dependencies=SATELLITE_INTEL_DEPS,
)
async def satellite_livetrack_status(payload: SatelliteLiveTrackerStatusRequest = Body(...), current_user=Depends(get_current_user)):
    return await geo_fencing_manager.get_instance().livetrack_status(payload, user_id=str(current_user.id))
