from fastapi import APIRouter, Depends, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from starlette.responses import JSONResponse
from orion.api.interactive.auth_manager.auth_manager import auth_manager
from orion.services.session_manager.session_manager import session_manager
from orion.api.interactive.signup_manager.signup_request_model import SignupRequest
from orion.api.interactive.signup_manager.signup_manager import SignupManager
from orion.api.interactive.auth_manager.models.forgot_password_request import ForgotPasswordRequest,ResetPassword

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@auth_router.post("/api/token")
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    return await auth_manager.login(form_data.username,form_data.password)


@auth_router.post("/api/token/2fa/verify")
async def verify_2fa(code: str = Body(..., embed=True), ptoken: str = Depends(oauth2_scheme)):
    return await session_manager.get_instance().verify_2fa_and_issue(ptoken, code)


@auth_router.post("/api/token/refresh")
async def refresh_token(ptoken: str = Depends(oauth2_scheme)):
    return await session_manager.get_instance().refresh_token(ptoken)


@auth_router.post("/api/logout")
async def logout(ptoken: str = Depends(oauth2_scheme)):
    session_manager.logout_user(ptoken=ptoken)
    response = JSONResponse(content={"detail": "Logged out"})
    response.delete_cookie("access_token", path="/")
    return response

@auth_router.post("/api/signup")
async def signup(data: SignupRequest):
    return await SignupManager.signup_user(data)

@auth_router.post("/api/verify/{token}")
async def verifyUser(token: str):
    return await auth_manager.verify_user(token)

@auth_router.post("/api/forgot")
async def forgotPassword(request: ForgotPasswordRequest):
    return await auth_manager.forgot_password(request.email)

@auth_router.post("/api/updatePassword")
async def updatePassword(data:ResetPassword):
    return await auth_manager.update_password(data.token,data.password)