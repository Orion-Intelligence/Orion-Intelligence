from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from datetime import timedelta

from backend.constants.constant import CONSTANTS
from backend.services.session_manager.session_manager import session_manager

router = APIRouter()
templates = Jinja2Templates(directory="templates")


@router.get("/login")
async def parser(request: Request):
  return templates.TemplateResponse(CONSTANTS.S_TEMPLATE_LOGIN_PATH, {"request": request})


@router.post("/login")
async def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
  user = await session_manager.getInstance().authenticate_user(username, password)
  if not user:
    return templates.TemplateResponse(CONSTANTS.S_TEMPLATE_LOGIN_PATH, {"request": request})

  access_token_expires = timedelta(minutes=30)
  access_token = session_manager.getInstance().create_access_token(data={"sub": user["username"]}, expires_delta=access_token_expires)

  response = RedirectResponse(url="/", status_code=303)
  response.set_cookie(key="access_token", value=f"Bearer {access_token}", httponly=True)
  return response
