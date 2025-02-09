from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import RedirectResponse, JSONResponse
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
    service_manager_instance = service_manager.get_instance()
    await service_manager_instance.init_services()
    session_manager.get_instance().get_admin().mount_to(p_app)
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

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=400, content={"error": str(exc)})
    return RedirectResponse(url="/")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    if request.url.path.startswith("/api"):
        errors = [
            {
                "field": ".".join(str(loc) for loc in error["loc"][1:]),  # Extracts field name
                "message": error["msg"],
                "type": error["type"]
            }
            for error in exc.errors()
        ]
        return JSONResponse(status_code=422, content={"validation_errors": errors})
    return RedirectResponse(url="/")
