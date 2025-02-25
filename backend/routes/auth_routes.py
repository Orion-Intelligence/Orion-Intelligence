from fastapi import APIRouter, HTTPException, Depends
from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from starlette.responses import JSONResponse
from orion.services.auth_manager.auth_manager import auth_manager
from orion.services.session_manager.session_manager import session_manager
from orion.services.session_manager.shared_model.login_token_model import login_token_model

auth_router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@auth_router.post("/api/token")
async def swagger_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth_manager.get_instance().authenticate_user(
        form_data.username, form_data.password
    )

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token_expires = timedelta(minutes=30)
    access_token = auth_manager.get_instance().create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/api/token/refresh")
async def refresh_token(ptoken: str = Depends(oauth2_scheme)):
    return await session_manager.get_instance().refresh_token(ptoken)

@auth_router.post("/api/logout")
async def logout():
  return await session_manager.get_instance().logout_user()

