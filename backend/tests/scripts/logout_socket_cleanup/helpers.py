from __future__ import annotations

from starlette.requests import Request


def _logout_request(token: str, tenant: object) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/logout",
            "headers": [(b"authorization", f"Bearer {token}".encode())],
            "state": {"tenant": tenant},
        }
    )
