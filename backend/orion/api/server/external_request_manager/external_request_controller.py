import hashlib
import json

import aiohttp

from orion.services.redis_manager.redis_controller import redis_controller
from orion.services.redis_manager.redis_enums import REDIS_COMMANDS


class external_request_controller:
    __instance = None

    @staticmethod
    def getInstance():
        if external_request_controller.__instance is None:
            external_request_controller()
        return external_request_controller.__instance

    def __init__(self):
        if external_request_controller.__instance is not None:
            raise Exception("This class is a singleton!")
        else:
            external_request_controller.__instance = self
        self.redis = redis_controller.getInstance()

    @staticmethod
    def generate_cache_key(url: str, params: dict):
        hash_input = f"{url}{json.dumps(params, sort_keys=True)}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    async def fetch_email_leak(self, p_data):
        url = "http://trusted-micros-api:8010/runtime/parse"
        param = {"text": p_data.model_dump()}
        cache_key = self.generate_cache_key(url, param)

        cached_response = await self.redis.invoke_trigger(REDIS_COMMANDS.S_GET_STRING, [cache_key, None, None])
        if cached_response:
            data = json.loads(cached_response)
            if len(data) > 0:
                return data

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=param) as response:
                    result = await response.json()
                    if result:
                        await self.redis.invoke_trigger(REDIS_COMMANDS.S_SET_STRING, [cache_key, result, None])
                    cached_response = await self.redis.invoke_trigger(
                        REDIS_COMMANDS.S_GET_STRING,
                        [cache_key, None, None])
                    return json.loads(cached_response)
        except aiohttp.ClientError as e:
            return {"error": f"Request failed: {str(e)}"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}
