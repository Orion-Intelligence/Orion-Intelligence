from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import RedirectResponse, JSONResponse

async def global_exception_handler(request: Request, exc: Exception):
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=400, content={"error": str(exc)})
    return RedirectResponse(url="/")

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
