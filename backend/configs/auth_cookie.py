from cryptography.fernet import Fernet, InvalidToken
from fastapi import Response
from starlette.requests import HTTPConnection

from orion.constants.constant import CONSTANTS
from orion.helper_manager.env_handler import env_handler

ACCESS_COOKIE = "access_token"
EXTENSION_COOKIE_PATH = "/api/extension"
COOKIE_MAX_AGE = 30 * 60  # 30 minutes
COOKIE_CIPHER = Fernet(CONSTANTS.S_ENCRYPTION_KEY.encode())

SESSION_MARKER_COOKIE = "session_present"
SESSION_MARKER_VALUE = "1"


def _is_debug() -> bool:
    return env_handler.get_instance().env("PRODUCTION", "0") != "1"


def set_session_marker(resp: Response) -> None:
    resp.set_cookie(
        key=SESSION_MARKER_COOKIE,
        value=SESSION_MARKER_VALUE,
        httponly=False,
        samesite="lax",
        secure=not _is_debug(),
        path="/",
        max_age=COOKIE_MAX_AGE,
    )


def clear_session_marker(resp: Response) -> None:
    resp.delete_cookie(SESSION_MARKER_COOKIE, path="/")


def sync_session_marker(request: HTTPConnection, resp: Response) -> None:
    if request.cookies.get(ACCESS_COOKIE):
        set_session_marker(resp)
    else:
        clear_session_marker(resp)


def set_access_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        key=ACCESS_COOKIE,
        value=COOKIE_CIPHER.encrypt(token.encode()).decode(),
        httponly=True,
        samesite="lax",
        secure=not _is_debug(),
        path="/",
        max_age=COOKIE_MAX_AGE,
    )
    set_session_marker(resp)
    resp.delete_cookie(ACCESS_COOKIE, path="/admin")


def set_extension_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        key=ACCESS_COOKIE,
        value=COOKIE_CIPHER.encrypt(token.encode()).decode(),
        httponly=True,
        samesite="none",
        secure=True,
        path=EXTENSION_COOKIE_PATH,
        max_age=COOKIE_MAX_AGE,
    )


def token_from_request(request: HTTPConnection) -> str | None:
    auth = request.headers.get("Authorization", "")
    parts = auth.split(" ", 1)
    bearer = parts[1] if len(parts) == 2 and parts[0] == "Bearer" else None
    cookie_token = request.cookies.get(ACCESS_COOKIE)
    if cookie_token:
        try:
            cookie_token = COOKIE_CIPHER.decrypt(cookie_token.encode()).decode()
        except InvalidToken:
            pass
    return bearer or cookie_token
