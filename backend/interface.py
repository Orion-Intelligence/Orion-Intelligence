from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

interface = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"

@interface.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    try:
        if full_path.startswith("api") or full_path.startswith("auth") or full_path.startswith("crawl"):
            raise HTTPException(status_code=404, detail="API route not found")

        requested_path = (ANGULAR_BUILD_DIR / full_path).resolve()
        if not str(requested_path).startswith(str(ANGULAR_BUILD_DIR.resolve())):
            raise HTTPException(status_code=403, detail="Forbidden path access")

        if requested_path.exists() and requested_path.is_file():
            return FileResponse(requested_path)

        index_path = (ANGULAR_BUILD_DIR / "index.html").resolve()
        if not str(index_path).startswith(str(ANGULAR_BUILD_DIR.resolve())):
            raise HTTPException(status_code=403, detail="Forbidden path access")

        if index_path.exists():
            return FileResponse(index_path)

        raise HTTPException(status_code=404, detail="Frontend not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid path")
