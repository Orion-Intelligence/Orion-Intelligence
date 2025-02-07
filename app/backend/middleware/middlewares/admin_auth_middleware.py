from fastapi import Request
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.services.session_manager.session_manager import session_manager


class admin_auth_middleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next):
    if not request.url.path.startswith("/login"):
      token = request.cookies.get("access_token")
      if not token:
        return RedirectResponse(url="/login", status_code=303)

      user = await session_manager.getInstance().get_current_user(token)
      if not user or not user["is_admin"]:
        return RedirectResponse(url="/login", status_code=303)

    return await call_next(request)