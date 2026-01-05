import asyncio

from fastapi import APIRouter, Body, HTTPException
from fastapi import Depends, UploadFile

from configs.app_dependency import license_required, role_required, status_required, get_current_user
from orion.api.interactive.account_manager.account_manager import AccountManager
from orion.api.interactive.account_manager.models.user_meta_model import user_meta_model
from orion.api.interactive.account_manager.models.user_param_model import user_param_model
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.auditlog_manager.models.audit_log_param_model import audit_log_param_model
from orion.api.interactive.resource_manager.resource_manager import ResourceManager
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, UserStatus
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantRequest
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.management.jobs.alert_job import alert_job
from orion.api.interactive.account_manager.models.user_model import user_model

tenant_routes = APIRouter(
    dependencies=[Depends(status_required([UserStatus.ACTIVE]))], tags=["Orion API"], )


@tenant_routes.post(
    "/api/get/tenant",
    summary="Get tenant for current user",
    description="Retrieve tenant information associated with the current authenticated user.",
    tags=["Tenant"],
    operation_id="getTenantForUser",
    response_description="Tenant information for the current user.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.DEMO, user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))], )
async def get_tenant(current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().get_tenant(current_user)


@tenant_routes.post(
    "/api/update/tenants",
    summary="Update tenant",
    description="Update tenant configuration and metadata for the current user's tenant.",
    tags=["Tenant"],
    operation_id="updateTenant",
    response_description="Updated tenant information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER, user_role.ADMIN])),
        Depends(status_required([UserStatus.ACTIVE])), Depends(license_required("maintainer")), ], )
async def update_tenant(data: TenantRequest, current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().update_tenant(data, current_user)


@tenant_routes.post(
    "/api/users",
    summary="Get all users for tenant",
    description="Retrieve all users associated with the current user's tenant.",
    tags=["Users", "Tenant"],
    operation_id="getAllUsersForTenant",
    response_description="List of users in the tenant.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER, user_role.ADMIN]))], )
async def get_tenant_users(current_user=Depends(get_current_user)):
    return await AccountManager.get_instance().get_all_users(current_user)


@tenant_routes.post(
    "/api/tenants/get",
    summary="Get all tenants",
    description="Retrieve all tenant records available to the current user.",
    tags=["Tenant"],
    operation_id="getAllTenants",
    response_description="List of all tenants.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN]))], )
async def get_all_tenants():
    return await TenantManager.get_instance().get_all_tenant()


@tenant_routes.post(
    "/api/update/user",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))], )
async def update_user(user: tenant_param_model, current_user=Depends(get_current_user)):
    return await AccountManager.get_instance().update_user(user, current_user)


@tenant_routes.post(
    "/api/update/current/user",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))], )
async def update_user(user: user_meta_model, current_user=Depends(get_current_user)):
    return await AccountManager.get_instance().update_current_user(user, current_user)


@tenant_routes.delete(
    "/api/tenant/image",
    summary="Update user",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))], )
async def update_user(current_user=Depends(get_current_user)):
    return await ResourceManager.get_instance().delete_user_icon(current_user)


@tenant_routes.put(
    "/api/tenant/image",
    summary="Upload profile image",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))], )
async def upload_profile_image(file: UploadFile, current_user=Depends(get_current_user)):
    return await ResourceManager.get_instance().uploadTenantImage(file, current_user)


@tenant_routes.delete(
    "/api/system/image",
    summary="Update system",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))], )
async def update_user(current_user=Depends(get_current_user)):
    return await ResourceManager.get_instance().delete_system_image(current_user)


@tenant_routes.put(
    "/api/system/image",
    summary="Upload system image",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))], )
async def upload_profile_image(file: UploadFile, current_user=Depends(get_current_user)):
    return await ResourceManager.get_instance().update_system_image(file, current_user)


@tenant_routes.delete(
    "/api/user/image",
    summary="Update user",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))], )
async def update_user(current_user=Depends(get_current_user)):
    return await ResourceManager.get_instance().delete_user_image(current_user)


@tenant_routes.put(
    "/api/user/image",
    summary="Upload profile image",
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.ANALYST]))], )
async def upload_profile_image(file: UploadFile, current_user=Depends(get_current_user)):
    return await ResourceManager.get_instance().update_user_image(file, current_user)


@tenant_routes.post(
    "/api/delete/user",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER]))], )
async def delete_user(user: user_param_model, current_user=Depends(get_current_user)):
    return await AccountManager.get_instance().delete_user(user, current_user)


@tenant_routes.post(
    "/api/tenant/create/user",
    summary="Create tenant user",
    description="Create a new company user in the current tenant.",
    tags=["Users", "Tenant"],
    operation_id="createTenantUser",
    response_description="Created tenant user information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER, user_role.ADMIN])),
        Depends(license_required("maintainer")), ], )
async def create_tenant_user(data: user_model, current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().create_tenant_user(data, current_user)


@tenant_routes.post(
    "/api/audit/logs",
    summary="Get audit logs",
    description="Retrieve audit logs for the current tenant and user context.",
    tags=["Audit Logs"],
    operation_id="getAuditLogs",
    response_description="Audit log entries matching the filter.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.MEMBER, user_role.DEMO])),
        Depends(license_required("maintainer"))], )
async def get_audit_logs(param: audit_log_param_model = Body(...), current_user=Depends(get_current_user)):
    return await AuditLogManager.get_instance().get(param, current_user)


@tenant_routes.post(
    "/api/get/tenant/node",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(status_required([UserStatus.ACTIVE])), ], )
async def get_node(current_user=Depends(get_current_user)):
    return await AccountManager.get_instance().get_node(current_user)


@tenant_routes.post(
    "/api/alert/add",
    summary="Add custom alert",
    description="Create a new custom alert for the current user profile.",
    tags=["Alerts"],
    operation_id="addCustomAlert",
    response_description="Created custom alert information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), ], )
async def add_custom_alert(data: AlertModel, current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().add_custom_alert(data, current_user)


@tenant_routes.post(
    "/api/alert/seen",
    summary="Mark alerts as seen",
    description="Mark one or more alerts as seen for the current user profile.",
    tags=["Alerts"],
    operation_id="setAlertsSeen",
    response_description="Updated alerts with seen status.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), ], )
async def set_alerts_seen(data: list[AlertModel], current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().set_alert_seen(data, current_user)


@tenant_routes.post(
    "/api/alert/delete",
    summary="Delete alert",
    description="Delete a specific alert identified by its id for the current user.",
    tags=["Alerts"],
    operation_id="deleteAlert",
    response_description="Result of the delete alert operation.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), ], )
async def delete_alert(id: str = Body(..., description="Unique id identifier of the alert to delete."),
        current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().delete_alert(id, current_user)


@tenant_routes.post(
    "/api/alert/update",
    summary="Update alert",
    description="Update an existing alert for the current user profile.",
    tags=["Alerts"],
    operation_id="updateAlert",
    response_description="Updated alert information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), ], )
async def update_alert(data: AlertModel, current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().update_alert(data, current_user)


@tenant_routes.get(
    "/api/profile/alerts",
    summary="Get user alerts",
    description="Retrieve all alerts for the current user profile.",
    tags=["Alerts"],
    operation_id="getUserAlerts",
    response_description="List of alerts for the current user.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), ], )
async def get_user_alerts(current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().getAllAlerts(current_user)


@tenant_routes.post(
    "/api/profile/alert/scan",
    status_code=202,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")), ], )
async def run_user_ioc_alerts(current_user=Depends(get_current_user)):
    scan_status = await AlertManager.getInstance().get_scan_status(current_user)
    if scan_status.get("scan_running", False):
        raise HTTPException(
            status_code=202, detail="Scan is still processing")

    asyncio.create_task(
        alert_job.get_instance().run_all_categories_for_api(current_user))
    return {"started": True}


@tenant_routes.post(
    "/api/profile/alert/scan/cancel",
    summary="Cancel IOC alert scan",
    description="Cancel alert scanning for all categories for the current user.",
    tags=["Alerts", "Scanning"],
    operation_id="cancelUserIOCAlerts",
    response_description="Cancel Scan job execution information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")), ], )
async def cancel_user_ioc_alerts(current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().set_scan_running(current_user.tenant_uuid, False,True)


@tenant_routes.post(
    "/api/profile/alerts/delete/all",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")), ], )
async def delete_all_alerts(current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().delete_all_alerts(current_user)


@tenant_routes.post(
    "/api/profile/alerts/delete/{_type}",
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), Depends(license_required("maintainer")), ], )
async def delete_typed_alerts(_type: str, current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().delete_alerts_by_type(current_user, _type)


@tenant_routes.post(
    "/api/profile/alert/scan/status",
    summary="Get alert scan status",
    description="Get the status of the latest alert scan for the current user.",
    tags=["Alerts", "Scanning"],
    operation_id="getAlertScanStatus",
    response_description="Alert scan status for the current user.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.MEMBER])), Depends(status_required([UserStatus.ACTIVE])), ], )
async def get_alert_scan_status(current_user=Depends(get_current_user)):
    return await AlertManager.getInstance().get_scan_status(current_user)
