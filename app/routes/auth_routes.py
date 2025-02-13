from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from datetime import timedelta
from starlette.exceptions import HTTPException
from starlette.responses import Response, JSONResponse
from backend.constants.constant import CONSTANTS
from backend.services.auth_manager.auth_manager import auth_manager
from backend.services.session_manager.session_manager import session_manager
from backend.services.session_manager.shared_model.login_token_model import login_token_model

auth_router = APIRouter()
templates = Jinja2Templates(directory="templates")

@auth_router.get("/login")
async def parser(request: Request):
  return templates.TemplateResponse(CONSTANTS.S_TEMPLATE_LOGIN_PATH, {"request": request})


@auth_router.post("/token")
async def token(login_request: login_token_model):
  user = await auth_manager.get_instance().authenticate_user(login_request.username, login_request.password)

  if not user:
    raise HTTPException(status_code=400, detail="Invalid username or password")

  access_token_expires = timedelta(minutes=30)
  access_token = auth_manager.get_instance().create_access_token(
    data={"sub": user.username}, expires_delta=access_token_expires
  )

  return JSONResponse({"access_token": access_token, "token_type": "bearer"})

@auth_router.post("/logout")
async def logout(_: Response):
    return await session_manager.get_instance().logout_user()

@auth_router.post("/login")
async def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
  user = await auth_manager.get_instance().authenticate_user(username, password)
  if not user:
    return templates.TemplateResponse(CONSTANTS.S_TEMPLATE_LOGIN_PATH, {"request": request})

  access_token_expires = timedelta(minutes=30)
  access_token = auth_manager.get_instance().create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)

  response = RedirectResponse(url="/", status_code=303)
  response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
  return response
