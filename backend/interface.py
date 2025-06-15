from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

interface = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"

def is_safe_path(base: Path, target: Path) -> bool:
    try:
        return base.resolve(strict=False) in target.resolve(strict=False).parents or base.resolve(strict=False) == target.resolve(strict=False)
    except Exception:
        return False

@interface.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    if full_path.startswith(("api", "auth", "crawl")):
        raise HTTPException(status_code=404, detail="API route not found")

    requested_path = ANGULAR_BUILD_DIR / full_path

    # Ensure that the requested path is within the ANGULAR_BUILD_DIR
    if not is_safe_path(ANGULAR_BUILD_DIR, requested_path):
        raise HTTPException(status_code=400, detail="Invalid file path")

    if requested_path.exists() and requested_path.is_file():
        return FileResponse(requested_path)

    index_path = ANGULAR_BUILD_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    raise HTTPException(status_code=404, detail="Frontend not found")
