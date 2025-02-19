from fastapi import FastAPI
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

# Define paths for Angular build
BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "client"

# ✅ Serve static files correctly (JS, CSS, images, fonts)
app.mount("/client", StaticFiles(directory=ANGULAR_BUILD_DIR, html=True), name="client")

# API Routes
setup_middlewares(app)
app.include_router(auth_router, include_in_schema=False)
app.include_router(crawl_routes, include_in_schema=False)
app.include_router(api_routes)

app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# ✅ Serve Angular `index.html` for unknown routes
@app.get("/")
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index_path = ANGULAR_BUILD_DIR / "index.html"
    return FileResponse(index_path)