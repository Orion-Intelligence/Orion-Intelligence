from datetime import timedelta

from fastapi import HTTPException, status, Form
from odmantic import AIOEngine
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from starlette.status import HTTP_303_SEE_OTHER
from starlette_admin.auth import AdminConfig, AdminUser, AuthProvider
from starlette_admin.contrib.odmantic import Admin, ModelView

from orion.helper_manager.env_handler import env_handler
from orion.services.auth_manager.auth_manager import auth_manager
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, user_role
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model
from orion.services.mongo_manager.shared_model.db_url_data_model import db_url_data_model
from orion.services.session_manager.session_manager import session_manager


class TokenAuthProvider(AuthProvider):
    async def login(
            self,
            username: str = Form(...),
            password: str = Form(...),
            remember_me: bool = Form(False),
            request: Request = None,
            response: Response = None,
    ) -> Response:
        try:
            IS_DEBUG = env_handler.get_instance().env("PRODUCTION", "0") != "1"
            user = await auth_manager.get_instance().authenticate_user(username, password)
            if not user:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            if user.role != user_role.ADMIN:
                raise HTTPException(status_code=403, detail="Not authorized")

            access_token_expires = timedelta(minutes=30)
            access_token, role = await session_manager.get_instance().create_access_token(
                data={"sub": user.username}, expires_delta=access_token_expires
            )

            redirect = RedirectResponse(url="/admin/", status_code=HTTP_303_SEE_OTHER)
            redirect.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=not IS_DEBUG,
                samesite="lax" if IS_DEBUG else "strict",
                max_age=1800,
                path="/",
            )
            return redirect
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    async def is_authenticated(self, request: Request) -> bool:
        if request.url.path == "/admin/login":
            return True

        token = request.cookies.get("access_token")
        if not token:
            return False

        try:
            session_mgr = session_manager.get_instance()
            user = await session_mgr.get_current_user(token)
            if not user:
                return False
            role = await session_mgr.get_current_role(token)
            if role != user_role.ADMIN.value:
                return False
            request.state.user = user
            return True
        except HTTPException:
            return False

    def get_admin_config(self, request: Request) -> AdminConfig:
        return AdminConfig(
            app_title="Admin Panel",
            logo_url="https://try.orionintelligence.org/assets/images/sidebar/search_nav_logo.png"
        )

    def get_admin_user(self, request: Request) -> AdminUser:
        user = getattr(request.state, 'user', None)
        return AdminUser(
            username=user.username if user else "anonymous",
            photo_url=user.profile_picture if user and hasattr(user, "profile_picture") else None
        )

    async def logout(self, request: Request, response: Response) -> Response:
        redirect = RedirectResponse(url="/admin/login", status_code=HTTP_303_SEE_OTHER)
        redirect.delete_cookie("access_token", path="/")
        return redirect


def setup_admin(engine: AIOEngine) -> Admin:
    admin = Admin(
        engine=engine,
        title="Admin Panel",
        auth_provider=TokenAuthProvider(),
        base_url="/admin/"
    )

    admin.add_view(ModelView(db_user_account, icon="fa fa-users", label="User Accounts", name="user_account"))
    admin.add_view(ModelView(db_system_model, icon="fa fa-cog", label="System Settings", name="system_settings"))
    admin.add_view(ModelView(db_url_data_model, icon="fa fa-link", label="URL Data", name="url_data"))

    return admin
