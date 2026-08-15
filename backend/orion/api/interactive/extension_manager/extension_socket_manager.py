import threading

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

    def register(self, user_key: str, websocket: WebSocket) -> None:
        self._sockets.setdefault(user_key, set()).add(websocket)

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
