from fastapi import APIRouter

# Create a router instance
router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}
