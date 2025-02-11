import threading
import jwt
import time
from fastapi import Request, HTTPException, status
from starlette.responses import RedirectResponse
from starlette.status import HTTP_303_SEE_OTHER
from backend.services.mongo_manager.mongo_controller import mongo_controller
from backend.constants.constant import CONSTANTS
from backend.services.session_manager.shared_model.auth_models import user_role


class session_manager:
    __instance = None
    __lock = threading.Lock()
    __cache = {}

    @staticmethod
    def get_instance():
        if session_manager.__instance is None:
            with session_manager.__lock:
                if session_manager.__instance is None:
                    session_manager.__instance = session_manager()
        return session_manager.__instance

    def __init__(self):
        if session_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        session_manager.__instance = self

    @staticmethod
    async def get_current_user(request_or_token: Request | str):
        token = None
        login_redirect_url = CONSTANTS.S_TEMPLATE_LOGIN_PATH

        def redirect_to_login():
            response = RedirectResponse(url=login_redirect_url, status_code=HTTP_303_SEE_OTHER)
            response.delete_cookie("access_token")
            return response

        if isinstance(request_or_token, Request):
            token = request_or_token.cookies.get("access_token")
            if token:
                token = token.replace("Bearer ", "").strip()

            if not token:
                auth_header = request_or_token.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header[len("Bearer "):].strip()
        else:
            token = request_or_token.strip()
            if token.startswith("Bearer "):
                token = token[len("Bearer "):].strip()

        if not token:
            return redirect_to_login()

        current_time = time.time()
        if token in session_manager.__cache:
            cached_user, expiry = session_manager.__cache[token]
            if expiry > current_time:
                return cached_user
            else:
                del session_manager.__cache[token]

        try:
            payload = jwt.decode(token, CONSTANTS.S_AUTH_SECRET_KEY, algorithms=[CONSTANTS.S_AUTH_ALGORITHM])
            username: str = payload.get("sub")

            if not username:
                return redirect_to_login()

            user = await mongo_controller.getInstance().get_user(username)
            if not user:
                return redirect_to_login()

            session_manager.__cache[token] = (user, current_time + 300)  # Cache for 5 minutes
            return user

        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return redirect_to_login()
        except Exception:
            return redirect_to_login()

    async def get_current_role(self, request_or_token: Request | str) -> str:

        user = await self.get_current_user(request_or_token)
        if not user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

        if isinstance(user, RedirectResponse):  # Check if it's a redirect response
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

        role = user.get("role")
        try:
            _ = user_role(role)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Role")
        return role

    @staticmethod
    async def get_current_username(request_or_token: Request | str) -> str:
        user = await session_manager.get_instance().get_current_user(request_or_token)
        if not user or "username" not in user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
        return user["username"]

    @staticmethod
    async def logout_user():
        response = RedirectResponse(url="/login", status_code=HTTP_303_SEE_OTHER)
        response.set_cookie(key="access_token", value="", expires=0, path="/")
        return response
