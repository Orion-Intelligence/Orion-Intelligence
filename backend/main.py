from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from contextlib import asynccontextmanager
from orion.middleware.middleware_setup import setup_middlewares
from orion.management.managers.service_manager import service_manager
from orion.services.mongo_manager.mongo_controller import mongo_controller
from configs.exception_handlers import global_exception_handler, validation_exception_handler
from routes.api_routes import api_routes
from routes.auth_routes import auth_router
from routes.crawl_routes import crawl_routes
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
ANGULAR_BUILD_DIR = BASE_DIR / "build"

app.mount("/assets", StaticFiles(directory=ANGULAR_BUILD_DIR / "assets"), name="assets")
app.mount("/static", StaticFiles(directory=ANGULAR_BUILD_DIR), name="static")

setup_middlewares(app)
app.include_router(auth_router, include_in_schema=False)
app.include_router(crawl_routes, include_in_schema=False)
app.include_router(api_routes)

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):

    requested_path = ANGULAR_BUILD_DIR / full_path
    if requested_path.exists() and requested_path.is_file():
        return FileResponse(requested_path)

    if full_path.startswith("api") or full_path.startswith("auth") or full_path.startswith("crawl"):
        raise HTTPException(status_code=404, detail="API route not found")

    index_path = ANGULAR_BUILD_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    raise HTTPException(status_code=404, detail="Frontend not found")