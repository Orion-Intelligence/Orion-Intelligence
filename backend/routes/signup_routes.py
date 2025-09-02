from fastapi import APIRouter, HTTPException,Depends
from pydantic import BaseModel, EmailStr, validator
from fastapi.security import HTTPBearer, OAuth2PasswordBearer
import re
from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account, UserStatus,user_role
from orion.services.mongo_manager.shared_model.db_onboarding_model import IocCategory, db_onboarding_model,OnboardingRequest
from orion.services.session_manager.session_manager import session_manager
from orion.services.encryption_manager.encryption_manager import encryption_manager
from datetime import datetime

signup_router = APIRouter()
security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password:str

    @validator("email")
    def validate_company_email(cls, v):
        blocked_domains = {
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", 
            "live.com", "aol.com", "protonmail.com", "icloud.com"
        }
        domain = v.split("@")[-1].lower()
        if domain in blocked_domains:
            raise ValueError("Personal email addresses are not allowed. Please use your company email.")
        return v
    
    @validator("password")
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


@signup_router.post("/api/signup")
async def signup(data: SignupRequest):
    engine = mongo_controller.get_instance().get_engine()

    existing_user = await engine.find_one(
        db_user_account,
        (db_user_account.username == data.username) | (db_user_account.email == data.email)
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(data.password)

    user = db_user_account(
        username=data.username,
        email=data.email,
        password=hashed_password,
        role=user_role.PROFILE,
        status=UserStatus.PENDING
    )

    await engine.save(user)

    return {"message": "Signup successful. Your account is under verification.", "status": "pending"}

@signup_router.post("/api/onboarding")
async def save_onboarding(data: OnboardingRequest,token: str = Depends(oauth2_scheme)):
    current_user = await session_manager.get_instance().get_current_user(token)
    engine = session_manager.get_instance()._engine

    encryptor = encryption_manager.get_instance(secret_key=CONSTANTS.S_ENCRYPTION_KEY)

    encrypted_company = encryptor.encrypt(data.companyName)

    encrypted_iocs = [
        IocCategory(
            ioc_id=encryptor.encrypt(ioc.ioc_id),
            name=encryptor.encrypt(ioc.name),
            values=[encryptor.encrypt(v) for v in ioc.values]
        )
        for ioc in data.iocs
    ]

    new_onboarding = db_onboarding_model(
        userId=str(current_user.id),
        companyName=encrypted_company,
        iocs=encrypted_iocs
    )

    await engine.save(new_onboarding)

    current_user.status = UserStatus.ACTIVE
    await engine.save(current_user)
    
    return {"message": "Onboarding created", "user": current_user.username," _ ":encrypted_company}
