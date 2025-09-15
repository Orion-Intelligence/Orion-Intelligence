from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, Body
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from starlette.responses import JSONResponse
from orion.services.auth_manager.auth_manager import auth_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.session_manager.session_manager import session_manager
from orion.services.mongo_manager.signup_model.signup_request_model import SignupRequest
from orion.services.mongo_manager.shared_model.forgot_model.forgot_password_request import ForgotPasswordRequest,ResetPassword
import pyotp

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@auth_router.post("/api/token")
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth_manager.get_instance().authenticate_user(
        form_data.username, form_data.password
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user.twofa_enabled:
        if user.twofa_secret:
            user.twofa_secret = ""
            temp_token = await session_manager.get_instance().create_temp_token(user.username)
            return {"twofa_required": True, "temp_token": temp_token}
        else:
            secret = pyotp.random_base32()
            provisioning_uri = pyotp.TOTP(secret).provisioning_uri(name=user.username, issuer_name="Orion")
            temp_token = await session_manager.get_instance().create_temp_token(user.username, extra={"tfa_secret": secret})
            return {
                "twofa_required": True,
                "temp_token": temp_token,
                "provisioning_uri": provisioning_uri,
                "twofa_secret": secret
            }

    if user.role == user_role.CRAWLER:
        access_token_expires = timedelta(weeks=92)
    else:
        access_token_expires = timedelta(minutes=30)

    access_token, role = await session_manager.get_instance().create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    onboarding_exists = await session_manager.get_instance().has_onboarding(str(user.id))

    return {"access_token": access_token, "token_type": "bearer", "role": role,"status": user.status,"hasOnboarding": onboarding_exists}



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
    return await auth_manager.signup_user(data)

@auth_router.post("/api/verify/{token}")
async def verifyUser(token: str):
    return await auth_manager.verify_user(token)

@auth_router.post("/api/forgot")
async def forgotPassword(request: ForgotPasswordRequest):
    return await auth_manager.forgot_password(request.email)

@auth_router.post("/api/updatePassword")
async def updatePassword(data:ResetPassword):
    return await auth_manager.update_password(data.token,data.password)