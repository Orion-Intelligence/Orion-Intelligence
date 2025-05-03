from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from configs.SimpleAuthProvider import setup_admin
from configs.swagger_config import configure_swagger
from orion.middleware.middleware_setup import setup_middlewares
from orion.management.managers.service_manager import service_manager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from configs.exception_handlers import global_exception_handler, validation_exception_handler
from routes.api_micros import micro_routes
from routes.api_routes import api_routes
from routes.admin_routes import admin_routes
from routes.auth_routes import auth_router
from routes.crawl_routes import crawl_routes
from interface import interface
from fastapi.exceptions import RequestValidationError

@asynccontextmanager
async def lifespan(p_app: FastAPI):
    service_manager_instance = service_manager.get_instance()
    await service_manager_instance.init_services()
    setup_admin(mongo_controller.get_instance().get_engine()).mount_to(p_app)
    app.include_router(interface)
    yield

app = FastAPI(lifespan=lifespan)

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"

app.mount("/assets", StaticFiles(directory=ANGULAR_BUILD_DIR / "assets"), name="assets")
app.mount("/static", StaticFiles(directory=ANGULAR_BUILD_DIR), name="static")

setup_middlewares(app)
configure_swagger(app)
app.include_router(auth_router, include_in_schema=False)
app.include_router(crawl_routes)
app.include_router(admin_routes, include_in_schema=False)
app.include_router(micro_routes)
app.include_router(api_routes)

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Angular runs on port 4200
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)