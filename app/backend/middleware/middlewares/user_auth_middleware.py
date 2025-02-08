from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse

from backend.services.session_manager.session_manager import session_manager


class user_auth_middleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    if not request.url.path.startswith("/token"):
      if not request.url.path.startswith("/login"):
        request.state.admin_vars = {"username": None}

        token = request.cookies.get("access_token")
        if not token:
          auth_header = request.headers.get("Authorization")
          if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1]

        if not token:
          return RedirectResponse(url="/login", status_code=303)

        user = await session_manager.get_instance().get_current_user(token)
        if not user:
          return RedirectResponse(url="/login", status_code=303)

        request.state.admin_vars["username"] = user["username"]

        if request.url.path.startswith("/admin") and user.get("role") != "admin":
          return RedirectResponse(url="/login", status_code=303)

      elif request.url.path == "/login":
        token = request.cookies.get("access_token")
        if not token:
          auth_header = request.headers.get("Authorization")
          if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1]

        if token:
          user = await session_manager.get_instance().get_current_user(token)
          if user:
            return RedirectResponse(url="/", status_code=303)

    return await call_next(request)
