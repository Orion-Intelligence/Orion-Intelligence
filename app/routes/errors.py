from fastapi import APIRouter, HTTPException

# Create a router instance
router = APIRouter()

@router.get("/nonexistent")
def trigger_404():
    raise HTTPException(status_code=404, detail="Page not found")
