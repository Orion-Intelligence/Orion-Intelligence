from cryptography.fernet import Fernet, InvalidToken
from fastapi import Request, Response

from orion.constants.constant import CONSTANTS
from orion.helper_manager.env_handler import env_handler

ACCESS_COOKIE = "access_token"
COOKIE_MAX_AGE = 30 * 60  # 30 minutes
COOKIE_CIPHER = Fernet(CONSTANTS.S_ENCRYPTION_KEY.encode())


def set_access_cookie(resp: Response, token: str) -> None:
    is_debug = env_handler.get_instance().env("PRODUCTION", "0") != "1"
    resp.set_cookie(
        key=ACCESS_COOKIE,
        value=COOKIE_CIPHER.encrypt(token.encode()).decode(),
        httponly=True,
        samesite="lax",
        secure=not is_debug,
        path="/",
        max_age=COOKIE_MAX_AGE,
    )
    resp.delete_cookie(ACCESS_COOKIE, path="/admin")


def token_from_request(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    parts = auth.split(" ", 1)
    bearer = parts[1] if len(parts) == 2 and parts[0] == "Bearer" else None
    cookie_token = request.cookies.get(ACCESS_COOKIE)
    if cookie_token:
        try:
            cookie_token = COOKIE_CIPHER.decrypt(cookie_token.encode()).decode()
        except InvalidToken:
            pass
    return cookie_token or bearer
