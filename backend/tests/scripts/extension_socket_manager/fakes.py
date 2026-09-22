from __future__ import annotations

from starlette.websockets import WebSocketState


class FakeWebSocket:
    def __init__(self, state=WebSocketState.CONNECTED, send_error=False, close_error=None):
        self.application_state = state
        self.sent: list[dict] = []
        self.closed = False
        self.send_error = send_error
        self.close_error = close_error

    async def send_json(self, payload):
        if self.send_error:
            raise RuntimeError("send failed")
        self.sent.append(payload)

    async def close(self):
        if self.close_error is not None:
            raise self.close_error
        self.closed = True


class FakeStore:
    def __init__(self, **overrides):
        self.calls: list[tuple] = []
        self.redis = overrides.get("redis")
        self._has_socket = overrides.get("has_socket", False)
        self._outstanding = overrides.get("outstanding", [])
        self._claim = overrides.get("claim", True)
        self._request_outstanding = overrides.get("request_outstanding", True)
        self._take_ack = overrides.get("take_ack", False)
        self._pop_request = overrides.get("pop_request", "u:s")
        self._pop_result = overrides.get("pop_result", {"items": []})
        self._is_inflight = overrides.get("is_inflight", False)
        self.connect_error = overrides.get("connect_error", False)
        self.results: dict = {}
        self.released: list = []

    def connect(self):
        self.calls.append(("connect",))
        if self.connect_error:
            raise RuntimeError("connect failed")

    def disable_redis(self):
        self.calls.append(("disable_redis",))
        self.redis = None

    async def acknowledge(self, request_id):
        self.calls.append(("acknowledge", request_id))

    async def touch_socket(self, user_key, socket_id):
        self.calls.append(("touch_socket", user_key, socket_id))

    async def has_socket(self, user_key):
        return self._has_socket

    async def outstanding_requests_for_user(self, user_key):
        return list(self._outstanding)

    async def drop_socket(self, user_key, socket_id):
        self.calls.append(("drop_socket", user_key, socket_id))

    async def claim_inflight(self, result_key):
        return self._claim

    async def release_inflight(self, result_key):
        self.released.append(result_key)

    async def put_request(self, request_id, result_key, payload=None):
        self.calls.append(("put_request", request_id, result_key, payload))

    async def pop_request(self, request_id):
        return self._pop_request

    async def request_outstanding(self, request_id):
        return self._request_outstanding

    async def take_ack(self, request_id):
        return self._take_ack

    async def put_result(self, result_key, payload):
        self.results[result_key] = payload

    async def pop_result(self, result_key):
        return self._pop_result

    async def drop_result(self, result_key):
        self.calls.append(("drop_result", result_key))

    async def is_inflight(self, result_key):
        return self._is_inflight

    async def invalidate_request_for_scope(self, result_key):
        self.calls.append(("invalidate_request_for_scope", result_key))

    async def reset_sockets(self, user_key):
        self.calls.append(("reset_sockets", user_key))


class FakeBusRedis:
    def __init__(self):
        self.published: list = []

    async def publish(self, channel, message):
        self.published.append((channel, message))


class FakeListenPubSub:
    def __init__(self, messages):
        self._messages = list(messages)
        self.subscribed: list = []

    async def subscribe(self, channel):
        self.subscribed.append(channel)

    async def listen(self):
        for message in self._messages:
            yield message


class FakeListenRedis:
    def __init__(self, messages):
        self._pubsub = FakeListenPubSub(messages)

    def pubsub(self):
        return self._pubsub
