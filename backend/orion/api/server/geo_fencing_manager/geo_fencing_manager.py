import httpx
from starlette.responses import JSONResponse


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

    async def sentinel_search(self, model, user_id: str = "system"):
        return await self._post_to_micros("satellite/sentinel/search", model, "satellite/sentinel/search", user_id)

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
