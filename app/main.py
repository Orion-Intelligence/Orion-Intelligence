from fastapi import FastAPI, Request, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from routes import home, errors
from backend.view_managers.server.error_manager.error_view_model import error_view_model
from backend.view_managers.server.error_manager.shared_model.error_param_model import error_param_model

app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

app.include_router(home.router)
app.include_router(errors.router)
@app.exception_handler(404)
async def custom_404_handler(request: Request, exc: HTTPException):
    params = error_param_model(error_code=404)

    response = await error_view_model.getInstance().invoke_trigger(request, params)
    return response
