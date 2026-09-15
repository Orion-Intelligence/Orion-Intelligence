from __future__ import annotations

import fnmatch
import json


class FakePubSub:
    def __init__(self, messages=None):
        self.subscribed = []
        self._messages = list(messages or [])

    async def subscribe(self, channel):
        self.subscribed.append(channel)

    async def listen(self):
        for message in self._messages:
            yield message


class FakeAsyncRedis:
    def __init__(self, fail=None):
        self.store: dict[str, str] = {}
        self.published: list[tuple[str, str]] = []
        self.expired: list[tuple[str, int]] = []
        self.fail = set(fail or [])
        self.pubsub_obj = FakePubSub()

    def _maybe_fail(self, name):
        if name in self.fail:
            raise RuntimeError(f"redis {name} failed")

    async def set(self, key, value, nx=False, ex=None):
        self._maybe_fail("set")
        if nx and key in self.store:
            return None
        self.store[key] = value
        return True

    async def get(self, key):
        self._maybe_fail("get")
        return self.store.get(key)

    async def getdel(self, key):
        self._maybe_fail("getdel")
        return self.store.pop(key, None)

    async def delete(self, *keys):
        self._maybe_fail("delete")
        removed = 0
        for key in keys:
            if key in self.store:
                del self.store[key]
                removed += 1
        return removed

    async def exists(self, key):
        self._maybe_fail("exists")
        return 1 if key in self.store else 0

    async def expire(self, key, ttl):
        self.expired.append((key, ttl))
        return True

    async def publish(self, channel, message):
        self.published.append((channel, message))
        return 1

    async def scan_iter(self, match=None, count=None):
        self._maybe_fail("scan_iter")
        for key in list(self.store.keys()):
            if match is None or fnmatch.fnmatch(key, match):
                yield key

    def pubsub(self):
        return self.pubsub_obj


def bus_message(kind, user_key, request_id="req-1", payload=None):
    return {
        "type": "message",
        "data": json.dumps({"kind": kind, "user_key": user_key, "request_id": request_id, "payload": payload or {}}),
    }
