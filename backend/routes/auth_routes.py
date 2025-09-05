from datetime import timedelta

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from starlette.responses import JSONResponse

from orion.services.auth_manager.auth_manager import auth_manager
from orion.services.mongo_manager.shared_model.db_auth_models import user_role
from orion.services.session_manager.session_manager import session_manager
from orion.services.mongo_manager.signup_model.signup_request_model import SignupRequest

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@auth_router.post("/api/token")
async def token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth_manager.get_instance().authenticate_user(
        form_data.username, form_data.password
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user.role == user_role.CRAWLER:
        access_token_expires = timedelta(weeks=92)
    else:
        access_token_expires = timedelta(minutes=30)
    access_token, role = await session_manager.get_instance().create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    onboarding_exists = await session_manager.get_instance().has_onboarding(str(user.id))

    return {"access_token": access_token, "token_type": "bearer", "role": role,"status": user.status,"hasOnboarding": onboarding_exists}


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
