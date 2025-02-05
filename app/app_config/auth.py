from fastapi import Depends, HTTPException
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv

from backend.helper_manager.env_handler import env_handler

load_dotenv()

DOCS_USERNAME = env_handler.get_instance().env("SWAGGER_USERNAME")
DOCS_PASSWORD = env_handler.get_instance().env("SWAGGER_PASSWORD")

security = HTTPBasic()

def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    if credentials.username != DOCS_USERNAME or credentials.password != DOCS_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
