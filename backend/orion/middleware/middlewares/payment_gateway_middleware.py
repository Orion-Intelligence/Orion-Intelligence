from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse
from datetime import datetime, timedelta, timezone
from orion.services.session_manager.session_manager import session_manager

TRIAL_DAYS = 14
TRIAL_END_URL = "/paymentGateway"


class payment_gateway_middleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path.startswith("/api/") or path.startswith("/login"):
            return await call_next(request)

        if not (path == "/dashboard" or path.startswith("/dashboard/")):
            return await call_next(request)
        auth_header = request.headers.get("Authorization", "")
        parts = auth_header.split(" ", 1)
        bearer = parts[1] if len(parts) == 2 and parts[0] == "Bearer" else None
        token = bearer or request.cookies.get("access_token")

        if not token:
            return RedirectResponse(url="/login", status_code=302)

        try:
            user = await session_manager.get_instance().get_current_user(token)
            if not user:
                return RedirectResponse(url="/login", status_code=302)

            subscription_status = user.subscription
            verify_date_str = user.account_verify_at

            if not verify_date_str:
                return RedirectResponse(url=TRIAL_END_URL, status_code=302)

            account_verify_at = datetime.fromisoformat(str(verify_date_str))
            if account_verify_at.tzinfo is None:
                account_verify_at = account_verify_at.replace(tzinfo=timezone.utc)

            expire_date = account_verify_at + timedelta(days=TRIAL_DAYS)
            now = datetime.now(timezone.utc)

            if not subscription_status:
                if now > expire_date:
                    return RedirectResponse(url=f"{TRIAL_END_URL}?expired=1", status_code=302)

        except Exception as e:
            return RedirectResponse(url="/login", status_code=302)

        response = await call_next(request)
        return response
