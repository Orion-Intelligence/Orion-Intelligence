from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

interface = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"


@interface.get("/{full_path:path}", include_in_schema=False)
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
