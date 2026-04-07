from fastapi import APIRouter, Depends, Body, Response, Request, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from starlette.responses import JSONResponse

from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.api.interactive.payment_manager.model.payment_param_model import PaymentParamModel
from orion.api.interactive.payment_manager.payment_manager import PaymentManager
from orion.helper_manager.env_handler import env_handler
from orion.services.session_manager.session_manager import session_manager
from orion.api.interactive.signup_manager.model.signup_request_model import SignupRequest,SupportRequest
from orion.api.interactive.signup_manager.signup_manager import SignupManager
from orion.api.interactive.auth_manager.models.forgot_password_request import ForgotPasswordRequest, ResetPassword

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

ACCESS_COOKIE = "access_token"
COOKIE_MAX_AGE = 30 * 60  # 30 minutes
IS_PRODUCTION = env_handler.get_instance().env("PRODUCTION", "0") == "1"
PRODUCTION_DOMAIN = env_handler.get_instance().env("PRODUCTION_DOMAIN", "try.orionintelligence.org")
COOKIE_DOMAIN = ".localtest.me"

if IS_PRODUCTION:
    domain_parts = str(PRODUCTION_DOMAIN).split(".")
    if len(domain_parts) >= 2:
        COOKIE_DOMAIN = "." + ".".join(domain_parts[-2:])
    else:
        COOKIE_DOMAIN = PRODUCTION_DOMAIN


def set_access_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        key=ACCESS_COOKIE, value=token, httponly=True, samesite="lax", secure=False, path="/", max_age=COOKIE_MAX_AGE, domain=COOKIE_DOMAIN, )


def token_from_request(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    parts = auth.split(" ", 1)
    bearer = parts[1] if len(parts) == 2 and parts[0] == "Bearer" else None
    return bearer or request.cookies.get(ACCESS_COOKIE)


@auth_router.post("/api/token")
async def token(form_data: OAuth2PasswordRequestForm = Depends(), response: Response = None):
    result = await auth_manager.login(form_data.username, form_data.password)
    access_token = result.get("access_token")
    twofa_required = result.get("twofa_required")

    if access_token and not twofa_required:
        set_access_cookie(response, access_token)

    return result


@auth_router.post("/api/token/demo")
async def token_demo(response: Response = None):
    DEMO_USERNAME = env_handler.get_instance().env("DEMO_USERNAME")
    DEMO_PASSWORD = env_handler.get_instance().env("DEMO_PASSWORD")

    result = await auth_manager.login(DEMO_USERNAME, DEMO_PASSWORD, True)
    access_token = result.get("access_token")
    twofa_required = result.get("twofa_required")

    if access_token and not twofa_required:
        set_access_cookie(response, access_token)

    return result


@auth_router.post("/api/token/2fa/verify")
async def verify_2fa(code: str = Body(..., embed=True),
        ptoken: str = Depends(oauth2_scheme),
        response: Response = None):
    result = await session_manager.get_instance().verify_2fa_and_issue(ptoken, code)
    access_token = result.get("access_token")
    if access_token:
        set_access_cookie(response, access_token)
    return result


@auth_router.post("/api/token/refresh")
async def refresh_token(request: Request, response: Response = None):
    token = token_from_request(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    result = await session_manager.get_instance().refresh_token(token)
    access_token = result.get("access_token")
    if access_token:
        set_access_cookie(response, access_token)
    return result


@auth_router.post("/api/logout")
async def logout(request: Request):
    token = request.cookies.get(ACCESS_COOKIE)
    session_manager.logout_user(ptoken=token)
    resp = JSONResponse(content={"detail": "Logged out"})
    resp.delete_cookie(ACCESS_COOKIE, path="/", domain=COOKIE_DOMAIN)
    resp.delete_cookie(ACCESS_COOKIE, path="/", domain="localhost")
    resp.delete_cookie(ACCESS_COOKIE, path="/")
    return resp


@auth_router.post("/api/signup")
async def signup(data: SignupRequest):
    return await SignupManager.signup_user(data)


@auth_router.post("/api/signup/verificaion")
async def signup(data: SignupRequest):
    return await SignupManager.resend_verification_email(data)


@auth_router.post("/api/verify/{token}")
async def verifyUser(token: str):
    return await auth_manager.verify_user(token)


@auth_router.post("/api/forgot")
async def forgotPassword(request: ForgotPasswordRequest):
    return await auth_manager.forgot_password(request.email)


@auth_router.post("/api/subscription/request")
async def subscriptionRequest(request: PaymentParamModel):
    return await PaymentManager.get_instance().send_subscription_info(request)


@auth_router.post("/api/updatePassword")
async def updatePassword(data: ResetPassword):
    return await auth_manager.update_password(data.token, data.password)

@auth_router.post("/api/support")
async def support(data: SupportRequest):
    return await SignupManager.send_support_mail(data)
