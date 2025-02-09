from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse

from backend.helper_manager.env_handler import env_handler
from backend.services.session_manager.session_manager import session_manager


class user_auth_middleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth = env_handler.get_instance().env("AUTH")
        if auth == "1":
            if not request.url.path.startswith("/token") and not request.url.path.startswith("/login"):
                request.state.admin_vars = {"username": None}
                token = self.get_token(request)

                if not token:
                    return RedirectResponse(url="/login", status_code=303)

                user = await session_manager.get_instance().get_current_user(token)

                if not isinstance(user, dict):  # Ensure 'user' is a dictionary
                    return RedirectResponse(url="/login", status_code=303)

                request.state.admin_vars["username"] = user.get("username")

                if request.url.path.startswith("/admin") and user.get("role") != "admin":
                    return RedirectResponse(url="/login", status_code=303)

            elif request.url.path == "/login":
                token = self.get_token(request)
                if token:
                    user = await session_manager.get_instance().get_current_user(token)
                    if isinstance(user, dict):
                        return RedirectResponse(url="/", status_code=303)

        else:
            request.state.admin_vars = {"domain": "public"}
            if request.url.path.startswith("/login"):
                return RedirectResponse(url="/", status_code=303)

        return await call_next(request)

    @staticmethod
    def get_token(request: Request):
        token = request.cookies.get("access_token")
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split("Bearer ")[1].strip()
        return token
