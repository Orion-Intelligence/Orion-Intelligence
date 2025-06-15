from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

interface = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
ANGULAR_BUILD_DIR = BASE_DIR / "build"
ALLOWED_FILES = {'index.html', 'favicon.ico', 'main.js', 'styles.css'}


@interface.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    try:
        if not full_path:
            raise HTTPException(status_code=400, detail="Invalid path")

        if any(full_path.startswith(x) for x in ["api", "auth", "crawl"]):
            raise HTTPException(status_code=404, detail="API route not found")

        filename = Path(full_path).name
        if filename in ALLOWED_FILES:
            file_path = ANGULAR_BUILD_DIR / filename
            if file_path.is_file():
                return FileResponse(file_path)

        index_path = ANGULAR_BUILD_DIR / "index.html"
        return FileResponse(index_path)
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")