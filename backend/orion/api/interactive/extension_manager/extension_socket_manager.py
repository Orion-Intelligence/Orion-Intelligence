import asyncio
import json
import threading
import uuid

import redis.asyncio as redis
from starlette.websockets import WebSocket, WebSocketState

from orion.services.redis_manager.redis_enums import REDIS_CONNECTIONS

BUS_CHANNEL = "orion_ext_socket_bus"


class extension_socket_manager:
    __instance = None
    __lock = threading.Lock()

    @staticmethod
    def get_instance():
        if extension_socket_manager.__instance is None:
            with extension_socket_manager.__lock:
                if extension_socket_manager.__instance is None:
                    extension_socket_manager.__instance = extension_socket_manager()
        return extension_socket_manager.__instance

    def __init__(self):
        if extension_socket_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        extension_socket_manager.__instance = self
        self._sockets: dict[str, set[WebSocket]] = {}
        self._routed: dict[str, str] = {}
        self._results: dict[str, dict] = {}
        self._inflight: set[str] = set()
        self._req_key: dict[str, str] = {}
        self._worker_id = uuid.uuid4().hex
        self._redis: redis.Redis | None = None
        self._listener: asyncio.Task | None = None
        self._started = False
        self._start_lock = asyncio.Lock()

    async def ensure_started(self) -> None:
        if self._started:
            return
        async with self._start_lock:
            if self._started:
                return
            try:
                self._redis = redis.Redis(
                    host=REDIS_CONNECTIONS.S_DATABASE_IP,
                    port=REDIS_CONNECTIONS.S_DATABASE_PORT,
                    password=REDIS_CONNECTIONS.S_DATABASE_PASSWORD,
                    decode_responses=True)
                self._listener = asyncio.create_task(self._listen())
                self._started = True
            except Exception as exc:
                print(f"[EXT-BUS] start failed: {exc}", flush=True)
                self._redis = None

    def register(self, user_key: str, websocket: WebSocket) -> None:
        self._sockets.setdefault(user_key, set()).add(websocket)
        self._inflight = {key for key in self._inflight if not key.startswith(f"{user_key}:")}
        try:
            asyncio.create_task(self.ensure_started())
        except RuntimeError:
            pass

    def take_result(self, user_key: str, crawl_type: str) -> dict | None:
        return self._results.pop(f"{user_key}:{crawl_type}", None)

    def is_inflight(self, user_key: str, crawl_type: str) -> bool:
        return f"{user_key}:{crawl_type}" in self._inflight

    async def fire(self, user_key: str, payload: dict) -> None:
        """Send a crawl to the user's live sockets and return immediately; the reply is stored for polling."""
        await self.ensure_started()
        result_key = f"{user_key}:{payload.get('type')}"
        if result_key in self._inflight:
            return
        request_id = uuid.uuid4().hex
        self._req_key[request_id] = result_key
        sockets = self._live_sockets(user_key)
        if sockets:
            self._inflight.add(result_key)
            self._routed[request_id] = self._worker_id
            for websocket in sockets:
                try:
                    await websocket.send_json({**payload, "request_id": request_id})
                except Exception:
                    continue
        elif self._redis is not None:
            self._inflight.add(result_key)
            await self._redis.publish(BUS_CHANNEL, json.dumps(
                {"kind": "request", "user_key": user_key, "request_id": request_id, "origin": self._worker_id, "payload": payload}))
        else:
            self._req_key.pop(request_id, None)

    def _store_result(self, request_id: str, payload: dict) -> None:
        result_key = self._req_key.pop(request_id, None)
        if result_key is not None:
            self._results[result_key] = payload
            self._inflight.discard(result_key)

    def resolve(self, request_id: str, payload: dict) -> None:
        self._store_result(request_id, payload)
        origin = self._routed.pop(request_id, None)
        if origin is not None and origin != self._worker_id and self._redis is not None:
            asyncio.create_task(self._redis.publish(BUS_CHANNEL, json.dumps(
                {"kind": "reply", "request_id": request_id, "origin": origin, "payload": payload})))
            return

    def unregister(self, user_key: str, websocket: WebSocket) -> None:
        sockets = self._sockets.get(user_key)
        if not sockets:
            return

        sockets.discard(websocket)
        if not sockets:
            self._sockets.pop(user_key, None)

    async def disconnect(self, user_key: str) -> None:
        for websocket in self._sockets.pop(user_key, set()):
            try:
                await websocket.close()
            except RuntimeError:
                continue

    def _live_sockets(self, user_key: str) -> list[WebSocket]:
        sockets = self._sockets.get(user_key)
        if not sockets:
            return []
        for websocket in list(sockets):
            if getattr(websocket, "application_state", None) != WebSocketState.CONNECTED:
                sockets.discard(websocket)
        if not sockets:
            self._sockets.pop(user_key, None)
            return []
        return list(sockets)

    async def _listen(self) -> None:
        try:
            pubsub = self._redis.pubsub()
            await pubsub.subscribe(BUS_CHANNEL)
            async for message in pubsub.listen():
                if message.get("type") != "message":
                    continue
                try:
                    data = json.loads(message.get("data") or "{}")
                except (json.JSONDecodeError, TypeError):
                    continue
                try:
                    await self._on_bus(data)
                except Exception as exc:
                    print(f"[EXT-BUS] on_bus error: {exc}", flush=True)
        except Exception as exc:
            print(f"[EXT-BUS] listener stopped: {exc}", flush=True)
            self._started = False

    async def _on_bus(self, data: dict) -> None:
        kind = data.get("kind")
        if kind == "request":
            sockets = self._live_sockets(data.get("user_key"))
            if not sockets:
                return
            request_id = data.get("request_id")
            self._routed[request_id] = data.get("origin")
            for websocket in sockets:
                try:
                    await websocket.send_json({**(data.get("payload") or {}), "request_id": request_id})
                except Exception:
                    continue
        elif kind == "reply":
            if data.get("origin") != self._worker_id:
                return
            self._store_result(data.get("request_id"), data.get("payload"))
