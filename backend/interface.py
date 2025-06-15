from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

interface = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"


@interface.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    try:
        # Normalize and prevent path traversal
        clean_path = Path(full_path).name
        requested_path = (ANGULAR_BUILD_DIR / clean_path).resolve()

        if not requested_path.is_relative_to(ANGULAR_BUILD_DIR.resolve()):
            raise HTTPException(status_code=400, detail="Invalid path")

        if requested_path.exists() and requested_path.is_file():
            return FileResponse(requested_path)

        if any(full_path.startswith(x) for x in ["api", "auth", "crawl"]):
            raise HTTPException(status_code=404, detail="API route not found")

        index_path = ANGULAR_BUILD_DIR / "index.html"
        return FileResponse(index_path) if index_path.exists() else HTTPException(status_code=404,
                                                                                  detail="Frontend not found")
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")