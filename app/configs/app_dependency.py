from fastapi import Depends, HTTPException, status, Request
from backend.services.session_manager.session_manager import session_manager
from backend.services.session_manager.shared_model.auth_models import user_role

async def get_current_role(request: Request) -> user_role:
    role = await session_manager.get_instance().get_current_role(request)
    print(f"🔹 Retrieved User Role: {role}")
    if role is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User role not found")
    return role

def role_required(required_roles: list[user_role]):
    async def verify_role(role: user_role = Depends(get_current_role)):
        if role not in required_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")
        return role
    return verify_role
