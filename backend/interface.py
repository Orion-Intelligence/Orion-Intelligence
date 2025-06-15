from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

interface = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"


@interface.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    try:
        if not full_path:
            raise HTTPException(status_code=400, detail="Invalid path")

        requested_path = ANGULAR_BUILD_DIR / Path(full_path).name
        if not requested_path.is_file():
            if any(full_path.startswith(x) for x in ["api", "auth", "crawl"]):
                raise HTTPException(status_code=404, detail="API route not found")
            requested_path = ANGULAR_BUILD_DIR / "index.html"

        return FileResponse(requested_path)
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")