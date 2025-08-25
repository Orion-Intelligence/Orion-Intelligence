from fastapi import APIRouter, Depends
from typing import List
from orion.api.interactive.tenant_management.tenant_controler import tenant_controller
from orion.api.interactive.tenant_management.db_tenant_model import db_tenant_model


tenant_routes = APIRouter()

def get_tenant_controller():
    return tenant_controller.getInstance()


@tenant_routes.get("/api/tenant/view", response_model=List[db_tenant_model])
async def get_tenants(ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.get_tenants()

@tenant_routes.post("/api/tenant/add", response_model=dict)
async def add_tenant(tenant: db_tenant_model, ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.add_tenant(tenant)

@tenant_routes.get("/verify/{token}", response_model=dict)
async def verify_tenant(token: str, ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.verify_tenant(token)

@tenant_routes.post("/{tenant_id}/approve", response_model=db_tenant_model)
async def approve_tenant(tenant_id: str, ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.approve_tenant(tenant_id)


@tenant_routes.post("/{tenant_id}/reject", response_model=db_tenant_model)
async def reject_tenant(tenant_id: str, ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.reject_tenant(tenant_id)


@tenant_routes.get("/mappings/emails", response_model=List[str])
async def get_emails(ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.get_all_emails()


@tenant_routes.get("/mappings/phones", response_model=List[str])
async def get_phones(ctrl: tenant_controller = Depends(get_tenant_controller)):
    return await ctrl.get_all_phones()
