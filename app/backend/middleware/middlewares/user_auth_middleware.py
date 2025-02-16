from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from backend.helper_manager.env_handler import env_handler
from backend.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role
from backend.services.session_manager.session_manager import session_manager


class user_auth_middleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth = env_handler.get_instance().env("AUTH")

        if auth == "1":
            if not request.url.path.startswith("/api/token"):
                token = self.get_token(request)

                if not token:
                    return JSONResponse(status_code=401, content={"detail": "Unauthorized - Missing Token"})

                user = await session_manager.get_instance().get_current_user(token)
                if not isinstance(user, db_user_account):
                    return JSONResponse(status_code=401, content={"detail": "Unauthorized - Invalid Token"})

                if request.url.path.startswith("/admin") and user.role != user_role.ADMIN:
                    return JSONResponse(status_code=403, content={"detail": "Forbidden - Admins Only"})

        return await call_next(request)

    @staticmethod
    def get_token(request: Request):
        token = request.cookies.get("access_token")
        if not token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split("Bearer ")[1].strip()
        return token
