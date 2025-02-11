from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from backend.middleware.middleware_setup import setup_middlewares
from backend.management.managers.service_manager import service_manager
from backend.services.mongo_manager.mongo_controller import mongo_controller
from configs.exception_handlers import global_exception_handler, validation_exception_handler
from routes.api_routes import api_routes
from routes.auth_routes import auth_router
from routes.crawl_routes import crawl_routes
from routes.default_routes import default_routes
from fastapi.exceptions import RequestValidationError

@asynccontextmanager
async def lifespan(p_app: FastAPI):
    service_manager_instance = service_manager.get_instance()
    await service_manager_instance.init_services()
    mongo_controller.getInstance().get_admin().mount_to(p_app)
    yield

async def init_cronjob():
    manager = service_manager.get_instance()
    await manager.init_services()
    await manager.init_cronjobs()

app = FastAPI(lifespan=lifespan)

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

setup_middlewares(app)

app.include_router(default_routes, include_in_schema=False)
app.include_router(auth_router, include_in_schema=False)
app.include_router(crawl_routes, include_in_schema=False)
app.include_router(api_routes)

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
