import json
import uuid

import redis.asyncio as redis

from orion.api.interactive.extension_manager.constants.constant import (
    ACK_KEY,
    BUS_CHANNEL,
    INFLIGHT_KEY,
    INFLIGHT_TTL_SECONDS,
    REQUEST_KEY,
    RESULT_KEY,
    RESULT_TTL_SECONDS,
    SCOPE_REQUEST_KEY,
    SOCKET_KEY,
    SOCKET_TTL_SECONDS,
)
from orion.services.redis_manager.redis_enums import REDIS_CONNECTIONS


class ExtensionSocketStore:
    def __init__(self) -> None:
        self._local_results: dict[str, dict] = {}
        self._local_inflight: set[str] = set()
        self._local_requests: dict[str, str] = {}
        self._local_scope_requests: dict[str, str] = {}
        self._local_acks: set[str] = set()
        self._worker_id = uuid.uuid4().hex
        self._redis: redis.Redis | None = None

    @property
    def redis(self) -> redis.Redis | None:
        return self._redis

    def connect(self) -> None:
        self._redis = redis.Redis(
            host=REDIS_CONNECTIONS.S_DATABASE_IP,
            port=REDIS_CONNECTIONS.S_DATABASE_PORT,
            password=REDIS_CONNECTIONS.S_DATABASE_PASSWORD,
            decode_responses=True,
        )

    def disable_redis(self) -> None:
        self._redis = None

    async def claim_inflight(self, result_key: str) -> bool:
        if self._redis is not None:
            try:
                claimed = await self._redis.set(
                    f"{INFLIGHT_KEY}:{result_key}",
                    "1",
                    nx=True,
                    ex=INFLIGHT_TTL_SECONDS,
                )
                return bool(claimed)
            except Exception:
                pass
        if result_key in self._local_inflight:
            return False
        self._local_inflight.add(result_key)
        return True

    async def release_inflight(self, result_key: str) -> None:
        if self._redis is not None:
            try:
                await self._redis.delete(f"{INFLIGHT_KEY}:{result_key}")
            except Exception:
                pass
        self._local_inflight.discard(result_key)

    async def clear_inflight_for_user(self, user_key: str) -> None:
        if self._redis is not None:
            try:
                async for key in self._redis.scan_iter(
                    match=f"{INFLIGHT_KEY}:{user_key}:*",
                    count=200,
                ):
                    await self._redis.delete(key)
            except Exception:
                pass
        self._local_inflight = {
            key for key in self._local_inflight if not key.startswith(f"{user_key}:")
        }

    async def put_result(self, result_key: str, payload: dict) -> None:
        if self._redis is not None:
            try:
                await self._redis.set(
                    f"{RESULT_KEY}:{result_key}",
                    json.dumps(payload),
                    ex=RESULT_TTL_SECONDS,
                )
                return
            except Exception:
                pass
        self._local_results[result_key] = payload

    async def pop_result(self, result_key: str) -> dict | None:
        if self._redis is not None:
            try:
                raw = await self._redis.getdel(f"{RESULT_KEY}:{result_key}")
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        return self._local_results.pop(result_key, None)

    async def drop_result(self, result_key: str) -> None:
        if self._redis is not None:
            try:
                await self._redis.delete(f"{RESULT_KEY}:{result_key}")
            except Exception:
                pass
        self._local_results.pop(result_key, None)

    async def put_request(self, request_id: str, result_key: str) -> None:
        if self._redis is not None:
            try:
                await self._redis.set(
                    f"{REQUEST_KEY}:{request_id}",
                    result_key,
                    ex=INFLIGHT_TTL_SECONDS,
                )
                await self._redis.set(
                    f"{SCOPE_REQUEST_KEY}:{result_key}",
                    request_id,
                    ex=INFLIGHT_TTL_SECONDS,
                )
                return
            except Exception:
                pass
        self._local_requests[request_id] = result_key
        self._local_scope_requests[result_key] = request_id

    async def pop_request(self, request_id: str) -> str | None:
        result_key = None
        if self._redis is not None:
            try:
                result_key = await self._redis.getdel(f"{REQUEST_KEY}:{request_id}")
            except Exception:
                result_key = None
        if result_key is None:
            result_key = self._local_requests.pop(request_id, None)
        else:
            self._local_requests.pop(request_id, None)
        if result_key is not None:
            if self._redis is not None:
                try:
                    await self._redis.delete(f"{SCOPE_REQUEST_KEY}:{result_key}")
                except Exception:
                    pass
            self._local_scope_requests.pop(result_key, None)
        return result_key

    async def request_outstanding(self, request_id: str) -> bool:
        if self._redis is not None:
            try:
                return bool(await self._redis.exists(f"{REQUEST_KEY}:{request_id}"))
            except Exception:
                pass
        return request_id in self._local_requests

    async def invalidate_request_for_scope(self, result_key: str) -> None:
        request_id = None
        if self._redis is not None:
            try:
                request_id = await self._redis.getdel(
                    f"{SCOPE_REQUEST_KEY}:{result_key}"
                )
            except Exception:
                request_id = None
        request_id = request_id or self._local_scope_requests.pop(result_key, None)
        if not request_id:
            return
        if self._redis is not None:
            try:
                await self._redis.delete(
                    f"{REQUEST_KEY}:{request_id}",
                    f"{ACK_KEY}:{request_id}",
                )
            except Exception:
                pass
        self._local_requests.pop(request_id, None)
        self._local_acks.discard(request_id)

    async def acknowledge(self, request_id: str) -> None:
        if self._redis is not None:
            try:
                await self._redis.set(
                    f"{ACK_KEY}:{request_id}",
                    "1",
                    ex=INFLIGHT_TTL_SECONDS,
                )
                result_key = await self._redis.get(f"{REQUEST_KEY}:{request_id}")
                if result_key:
                    await self._redis.expire(f"{REQUEST_KEY}:{request_id}", INFLIGHT_TTL_SECONDS)
                    await self._redis.expire(f"{SCOPE_REQUEST_KEY}:{result_key}", INFLIGHT_TTL_SECONDS)
                    await self._redis.expire(f"{INFLIGHT_KEY}:{result_key}", INFLIGHT_TTL_SECONDS)
                return
            except Exception:
                pass
        self._local_acks.add(request_id)

    async def take_ack(self, request_id: str) -> bool:
        if self._redis is not None:
            try:
                return bool(await self._redis.getdel(f"{ACK_KEY}:{request_id}"))
            except Exception:
                pass
        if request_id not in self._local_acks:
            return False
        self._local_acks.discard(request_id)
        return True

    async def touch_socket(self, user_key: str, socket_id: str) -> None:
        if self._redis is None:
            return
        try:
            await self._redis.set(
                f"{SOCKET_KEY}:{user_key}:{socket_id}",
                self._worker_id,
                ex=SOCKET_TTL_SECONDS,
            )
        except Exception:
            pass

    async def drop_socket(self, user_key: str, socket_id: str) -> None:
        if self._redis is None:
            return
        try:
            await self._redis.delete(f"{SOCKET_KEY}:{user_key}:{socket_id}")
        except Exception:
            pass

    async def has_socket(self, user_key: str) -> bool:
        if self._redis is None:
            return False
        try:
            async for _ in self._redis.scan_iter(
                match=f"{SOCKET_KEY}:{user_key}:*",
                count=50,
            ):
                return True
        except Exception:
            pass
        return False

    async def reset_sockets(self, user_key: str) -> None:
        if self._redis is None:
            return
        try:
            async for key in self._redis.scan_iter(
                match=f"{SOCKET_KEY}:{user_key}:*",
                count=50,
            ):
                await self._redis.delete(key)
            await self._redis.publish(
                BUS_CHANNEL,
                json.dumps({"kind": "reset", "user_key": user_key}),
            )
        except Exception:
            pass

    async def is_inflight(self, result_key: str) -> bool:
        if self._redis is not None:
            try:
                return bool(await self._redis.exists(f"{INFLIGHT_KEY}:{result_key}"))
            except Exception:
                pass
        return result_key in self._local_inflight
