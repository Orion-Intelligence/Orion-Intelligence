from __future__ import annotations

from typing import Any

import httpx


class FakePostResponse:
    def __init__(self, headers=None, status_code=200, raise_exc=None, read_bytes=b"", json_data=None):
        self.headers = headers or {}
        self.status_code = status_code
        self._raise = raise_exc
        self._read = read_bytes
        self._json_data = json_data if json_data is not None else {}

    def raise_for_status(self):
        if self._raise is not None:
            raise self._raise

    def json(self):
        return self._json_data

    async def aread(self):
        return self._read


class FakeStreamResponse:
    def __init__(self, status_code=200, lines=None, read_bytes=b"error-body"):
        self.status_code = status_code
        self._lines = list(lines or [])
        self._read = read_bytes
        self.close_count = 0

    async def aiter_lines(self):
        for line in self._lines:
            yield line

    async def aread(self):
        return self._read

    async def aclose(self):
        self.close_count += 1


class FakeStreamClient:
    def __init__(self, post_responses=None, stream_response=None, delete_exc=None):
        self._post_responses = list(post_responses or [])
        self._stream_response = stream_response or FakeStreamResponse()
        self._delete_exc = delete_exc
        self.posts: list[dict[str, Any]] = []
        self.deletes: list[dict[str, Any]] = []
        self.built_requests: list[dict[str, Any]] = []
        self.close_count = 0

    async def post(self, url, headers=None, json=None):
        self.posts.append({"url": url, "headers": headers, "json": json})
        if self._post_responses:
            return self._post_responses.pop(0)
        return FakePostResponse()

    def build_request(self, method, url, json=None, headers=None):
        request = {"method": method, "url": url, "json": json, "headers": headers}
        self.built_requests.append(request)
        return request

    async def send(self, request, stream=False):
        return self._stream_response

    async def delete(self, url, headers=None):
        self.deletes.append({"url": url, "headers": headers})
        if self._delete_exc is not None:
            raise self._delete_exc

    async def aclose(self):
        self.close_count += 1


class FakeRunClient:
    instances: list["FakeRunClient"] = []

    def __init__(self, timeout=None):
        self.timeout = timeout
        self.close_count = 0
        FakeRunClient.instances.append(self)

    async def aclose(self):
        self.close_count += 1


class FakeHTTPError(httpx.HTTPError):
    def __init__(self):
        super().__init__("boom")


class FakeGatewayResponse:
    def __init__(self, status_code=200, json_data=None, text="", json_exc=None, content=b"", headers=None):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text
        self._json_exc = json_exc
        self.content = content
        self.headers = headers or {}

    def json(self):
        if self._json_exc is not None:
            raise self._json_exc
        return self._json_data


class FakeGatewayClient:
    def __init__(self, factory):
        self._factory = factory

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def request(self, method, url, headers=None, json=None, timeout=None):
        self._factory.calls.append({"method": method, "url": url, "headers": headers, "json": json})
        if self._factory.exc is not None:
            raise self._factory.exc
        return self._factory.responses.pop(0)

    async def get(self, url, headers=None, timeout=None):
        self._factory.calls.append({"method": "GET", "url": url, "headers": headers, "json": None})
        if self._factory.exc is not None:
            raise self._factory.exc
        return self._factory.responses.pop(0)


class FakeGatewayClientFactory:
    def __init__(self, responses, exc=None):
        self.responses = list(responses)
        self.exc = exc
        self.calls = []

    def __call__(self, *args, **kwargs):
        return FakeGatewayClient(self)
