from fastapi import APIRouter
from datetime import timedelta
from starlette.exceptions import HTTPException
from starlette.responses import Response, JSONResponse
from backend.services.auth_manager.auth_manager import auth_manager
from backend.services.session_manager.session_manager import session_manager
from backend.services.session_manager.shared_model.login_token_model import login_token_model

auth_router = APIRouter()

@auth_router.post("/api/token")
async def token(login_request: login_token_model):
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  print("::::::::::::::::::::::::::::::::::::::::::::::::")
  user = await auth_manager.get_instance().authenticate_user(login_request.username, login_request.password)

  if not user:
    raise HTTPException(status_code=401, detail="Invalid username or password")

  access_token_expires = timedelta(minutes=30)
  access_token = auth_manager.get_instance().create_access_token(
    data={"sub": user.username}, expires_delta=access_token_expires
  )

  return JSONResponse({"access_token": access_token, "token_type": "bearer"})

@auth_router.post("/api/logout")
async def logout(_: Response):
    return await session_manager.get_instance().logout_user()
