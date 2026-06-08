import asyncio
import json
from typing import Any

from fastapi import HTTPException
import httpx
from starlette import status
from starlette.responses import JSONResponse

from orion.services.elastic_manager.elastic_controller import elastic_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX


class geo_fencing_manager:
    __instance = None

    @staticmethod
    def get_instance():
        if geo_fencing_manager.__instance is None:
            geo_fencing_manager()
        return geo_fencing_manager.__instance

    def __init__(self):
        if geo_fencing_manager.__instance is not None:
            pass
        else:
            geo_fencing_manager.__instance = self

    @staticmethod
    async def _post_to_micros(path: str, model, detail_path: str, user_id: str = "system", fallback_path: str | None = None):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://trusted-micros-api:8010/{path}/{user_id}",
                    json=model.model_dump(),
                    timeout=120,
                )
                if fallback_path and response.status_code in (404, 405):
                    response = await client.post(
                        f"http://trusted-micros-api:8010/{fallback_path}",
                        json=model.model_dump(),
                        timeout=120,
                    )
                if response.status_code != 200:
                    return JSONResponse(
                        status_code=response.status_code,
                        content={"detail": f"Something happened while calling {detail_path}"},
                    )
                return response.json()
        except Exception:
            return JSONResponse(
                status_code=500,
                content={"detail": f"Something happened while calling {detail_path}"},
            )

    async def geocode(self, model, user_id: str = "system"):
        return await self._post_to_micros("satellite/geocode", model, "satellite/geocode", user_id)

    async def facilities(self, model, user_id: str = "system"):
        return await self._post_to_micros("satellite/facilities", model, "satellite/facilities", user_id)

    async def sentinel_image(self, model, user_id: str = "system"):
        return await self._post_to_micros("satellite/sentinel/image", model, "satellite/sentinel/image", user_id)

    async def anomaly(self, model, user_id: str = "system"):
        return await self._post_to_micros("satellite/anomaly", model, "satellite/anomaly", user_id)

    async def compare(self, model, user_id: str = "system"):
        return await self._post_to_micros("satellite/compare", model, "satellite/compare", user_id)

    async def livetrack_aircraft_bbox(self, model, user_id: str = "system"):
        return await self._post_to_micros(
            "livetrack/aircraft",
            model,
            "livetrack/aircraft",
            user_id,
            fallback_path="livetrack/aircraft",
        )

    async def livetrack_aircraft_icao(self, model, user_id: str = "system"):
        return await self._post_to_micros(
            "livetrack/aircraft/icao",
            model,
            "livetrack/aircraft/icao/",
            user_id,
            fallback_path="livetrack/aircraft/icao/",
        )

    async def livetrack_aircraft_track(self, model, user_id: str = "system"):
        return await self._post_to_micros(
            "livetrack/aircraft/track",
            model,
            "livetrack/aircraft/track/",
            user_id,
            fallback_path="livetrack/aircraft/track",
        )

    async def livetrack_ships_bbox(self, model, user_id: str = "system"):
        return await self._post_to_micros(
            "livetrack/ships",
            model,
            "livetrack/ships",
            user_id,
            fallback_path="livetrack/ships",
        )

    async def livetrack_ships_mmsi(self, model, user_id: str = "system"):
        return await self._post_to_micros(
            "livetrack/ships/mmsi",
            model,
            "livetrack/ships/mmsi/",
            user_id,
            fallback_path="livetrack/ships/mmsi/",
        )

    async def livetrack_status(self, model, user_id: str = "system"):
        return await self._post_to_micros(
            "livetrack/status",
            model,
            "livetrack/status/",
            user_id,
            fallback_path="livetrack/status/",
        )

    async def request_map_entities_by_ids(self, doc_ids: list[str]):
        body = {
            "ids": doc_ids
        }

        res = await elastic_controller.get_instance().mget_docs(ELASTIC_INDEX.S_MAP_ENTITIES_INDEX, body)

        if not res:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch documents"
            )

        docs = res.get("docs", [])

        results = []
        for d in docs:
            if not d.get("found"):
                continue

            src = d.get("_source", {}) or {}

            results.append({
                "id": d.get("_id"),
                "name": src.get("name"),
                "country": src.get("country"),
                "type": src.get("type"),
                "capacity": src.get("capacity_mw"),
                "source": src.get("source"),
                "location": src.get("location"),
                "location_point": src.get("location_point"),
            })

        return {
            "Result": results,
            "Count": len(results)
        }

    async def stream_map_entities_points(self, chunk_size: int = 1000):
        chunk_size = max(100, min(chunk_size, 5000))
        return self._stream_map_entities_points_generator(chunk_size)

    async def _stream_map_entities_points_generator(self, chunk_size: int):
        search_after: list[Any] | None = None

        while True:
            query: dict[str, Any] = {
                "size": chunk_size,
                "_source": [
                    "name",
                    "type",
                    "country",
                    "capacity_mw",
                    "source",
                    "aeroway",
                    "amenity",
                    "building",
                    "harbour",
                    "harbor",
                    "landuse",
                    "man_made",
                    "military",
                    "port",
                    "power",
                    "seamark:type",
                    "seamark_type",
                    "waterway",
                    "location.lat",
                    "location.lon",
                    "location_point.lat",
                    "location_point.lon",
                    "location",
                    "location_point"
                ],
                "sort": ["_shard_doc"],
                "track_total_hits": False,
                "query": {
                    "match_all": {}
                }
            }

            if search_after:
                query["search_after"] = search_after

            m_status, docs = await elastic_controller.get_instance().search_query(
                ELASTIC_INDEX.S_MAP_ENTITIES_INDEX,
                query
            )

            if not m_status:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to stream map entities"
                )

            body = docs.body if hasattr(docs, "body") else docs

            hits = body.get("hits", {}).get("hits", [])

            if not hits:
                break

            result = []

            for hit in hits:
                src = hit.get("_source", {}) or {}
                loc = src.get("location", {}) or {}
                loc_point = src.get("location_point", {}) or {}

                lat = loc.get("lat") if isinstance(loc, dict) else None
                lon = loc.get("lon") if isinstance(loc, dict) else None
                if lat is None or lon is None:
                    lat = loc_point.get("lat") if isinstance(loc_point, dict) else lat
                    lon = loc_point.get("lon") if isinstance(loc_point, dict) else lon
                result.append({
                    "id": hit.get("_id"),
                    "name": src.get("name"),
                    "type": src.get("type"),
                    "country": src.get("country"),
                    "capacity_mw": src.get("capacity_mw"),
                    "source": src.get("source"),
                    "aeroway": src.get("aeroway"),
                    "amenity": src.get("amenity"),
                    "building": src.get("building"),
                    "harbour": src.get("harbour"),
                    "harbor": src.get("harbor"),
                    "landuse": src.get("landuse"),
                    "man_made": src.get("man_made"),
                    "military": src.get("military"),
                    "port": src.get("port"),
                    "power": src.get("power"),
                    "seamark:type": src.get("seamark:type"),
                    "seamark_type": src.get("seamark_type"),
                    "waterway": src.get("waterway"),
                    "location": src.get("location"),
                    "location_point": src.get("location_point"),
                    "lat": lat,
                    "lon": lon,
                })
            yield json.dumps(result) + "\n"
            await asyncio.sleep(0.01)
            last_sort = hits[-1].get("sort")
            if not last_sort:
                break
            next_search_after = last_sort if isinstance(last_sort, list) else [last_sort]
            if next_search_after == search_after:
                break
            search_after = next_search_after
