from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from backend.middleware.middleware_setup import setup_middlewares
from backend.management.managers.service_manager import service_manager
from backend.services.session_manager.session_manager import session_manager
from routes.api_routes import api_routes
from routes.auth_routes import auth_router
from routes.crawl_routes import crawl_routes
from routes.default_routes import default_routes

@asynccontextmanager
async def lifespan(p_app: FastAPI):
    service_managergr = service_manager.get_instance()
    await service_managergr.init_services()
    session_manager.get_instance().get_admin().mount_to(p_app)
    yield

app = FastAPI(lifespan=lifespan)
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

setup_middlewares(app)

app.include_router(default_routes, include_in_schema=False)
app.include_router(auth_router, include_in_schema=False)
app.include_router(crawl_routes, include_in_schema=False)
app.include_router(api_routes)
