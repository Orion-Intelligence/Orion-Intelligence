import asyncio
import threading
import uuid

from starlette.websockets import WebSocket


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
        self._pending: dict[str, asyncio.Future] = {}

    def register(self, user_key: str, websocket: WebSocket) -> None:
        self._sockets.setdefault(user_key, set()).add(websocket)

    async def request(self, user_key: str, payload: dict, timeout: float = 25) -> dict | None:
        sockets = self._sockets.get(user_key)
        if not sockets:
            return None

        websocket = next(iter(sockets))
        request_id = uuid.uuid4().hex
        future: asyncio.Future = asyncio.get_event_loop().create_future()
        self._pending[request_id] = future
        try:
            await websocket.send_json({**payload, "request_id": request_id})
            return await asyncio.wait_for(future, timeout)
        except (TimeoutError, asyncio.TimeoutError, RuntimeError):
            return None
        finally:
            self._pending.pop(request_id, None)

    def resolve(self, request_id: str, payload: dict) -> None:
        future = self._pending.pop(request_id, None)
        if future and not future.done():
            future.set_result(payload)

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
