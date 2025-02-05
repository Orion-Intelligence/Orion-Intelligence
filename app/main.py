from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from backend.middleware.middleware_setup import setup_middlewares
from routes import routes
from routes import api

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

setup_middlewares(app)

app.include_router(routes.router, include_in_schema=False)
app.include_router(api.api)
