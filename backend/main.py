from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles

from configs.SimpleAuthProvider import setup_admin
from configs.exception_handlers import global_exception_handler, validation_exception_handler
from configs.swagger_config import configure_swagger
from interface import interface
from orion.management.managers.service_manager import service_manager
from orion.middleware.middleware_setup import setup_middlewares
from orion.services.mongo_manager.mongo_controller import mongo_controller
from routes.admin_routes import admin_routes
from routes.api_micros import micro_routes
from routes.api_routes import api_routes
from routes.auth_routes import auth_router
from routes.crawl_routes import crawl_routes
from routes.tenant_routes import tenant_routes

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"

@asynccontextmanager
async def lifespan(p_app: FastAPI):
    service_manager_instance = service_manager.get_instance()
    await service_manager_instance.build_assets(ANGULAR_BUILD_DIR)
    await service_manager_instance.init_services()
    setup_admin(mongo_controller.get_instance().get_engine()).mount_to(p_app)
    app.include_router(interface)
    yield


app = FastAPI(lifespan=lifespan)
app.mount("/assets", StaticFiles(directory=ANGULAR_BUILD_DIR / "assets"), name="assets")
app.mount("/static", StaticFiles(directory=ANGULAR_BUILD_DIR), name="static")

setup_middlewares(app)
configure_swagger(app)
app.include_router(auth_router, include_in_schema=False)
app.include_router(crawl_routes, include_in_schema=False)
app.include_router(admin_routes, include_in_schema=False)
app.include_router(micro_routes)
app.include_router(api_routes)
app.include_router(tenant_routes)

app.add_exception_handler(Exception, global_exception_handler)

# noinspection PyTypeChecker
app.add_exception_handler(RequestValidationError, validation_exception_handler)
