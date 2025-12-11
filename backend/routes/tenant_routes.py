from fastapi import APIRouter, Body
from fastapi import Depends, UploadFile
from configs.app_dependency import license_required, role_required, status_required, get_current_user
from orion.api.interactive.auditlog_manager.audit_log_manager import AuditLogManager
from orion.api.interactive.auditlog_manager.models.audit_log_param_model import audit_log_param_model
from orion.api.interactive.tenant_manager.models.tenant_param_model import tenant_param_model
from orion.services.mongo_manager.shared_model.db_auth_models import user_role, UserStatus
from orion.services.mongo_manager.shared_model.db_tenant_model import TenantRequest
from orion.api.interactive.tenant_manager.tenant_manager import TenantManager
from orion.api.interactive.profile_manager.model.profile_parma_model import ProfileParmaModel
from orion.api.interactive.profile_manager.profile_manager import ProfileManager
from orion.services.mongo_manager.shared_model.db_alert_model import AlertModel
from orion.api.interactive.alert_manager.alert_manager import AlertManager
from orion.management.jobs.alert_job import alert_job
from orion.api.interactive.tenant_manager.models.tenant_team_model import tenant_team_model

tenant_routes = APIRouter(
    dependencies=[Depends(status_required([UserStatus.ACTIVE]))],
    tags=["Orion API"],
)
public_routes = APIRouter(tags=["Public"])


@tenant_routes.post(
    "/api/get/tenant",
    summary="Get tenant for current user",
    description="Retrieve tenant information associated with the current authenticated user.",
    tags=["Tenant"],
    operation_id="getTenantForUser",
    response_description="Tenant information for the current user.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.PROFILE]))],
)
async def get_tenant(current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().get_tenant(current_user)


@tenant_routes.post(
    "/api/tenants/update",
    summary="Update tenant",
    description="Update tenant configuration and metadata for the current user's tenant.",
    tags=["Tenant"],
    operation_id="updateTenant",
    response_description="Updated tenant information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE, user_role.ADMIN])),
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer", [user_role.ADMIN])),
    ],
)
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
    dependencies=[Depends(role_required([user_role.PROFILE, user_role.ADMIN]))],
)
async def get_tenant_users(current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().get_all_users(current_user)


@tenant_routes.post(
    "/api/tenants/get",
    summary="Get all tenants",
    description="Retrieve all tenant records available to the current user.",
    tags=["Tenant"],
    operation_id="getAllTenants",
    response_description="List of all tenants.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.PROFILE, user_role.ADMIN]))],
)
async def get_all_tenants():
    return await TenantManager.get_instance().get_all_tenant()


@tenant_routes.post(
    "/api/update/user",
    summary="Update user",
    description="Update user profile and access details within the tenant.",
    tags=["Users"],
    operation_id="updateUser",
    response_description="Updated user information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.PROFILE]))],
)
async def update_user(user: tenant_param_model, current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().update_user(user, current_user)

@tenant_routes.post(
    "/api/delete/user",
    summary="Update user",
    description="Update user profile and access details within the tenant.",
    tags=["Users"],
    operation_id="updateUser",
    response_description="Updated user information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.PROFILE]))],
)
async def delete_user(user: tenant_param_model, current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().delete_user(user, current_user)


@tenant_routes.post(
    "/api/tenant/create/user",
    summary="Create tenant user",
    description="Create a new company user in the current tenant.",
    tags=["Users", "Tenant"],
    operation_id="createTenantUser",
    response_description="Created tenant user information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(license_required("maintainer")),
    ],
)
async def create_tenant_user(data: tenant_team_model, current_user=Depends(get_current_user)):
    return await TenantManager.get_instance().create_company_user(data, current_user)


@tenant_routes.post(
    "/api/admin/create/user",
    summary="Create admin demo user",
    description="Create a new demo user with admin privileges.",
    tags=["Users", "Admin"],
    operation_id="createAdminDemoUser",
    response_description="Created demo user information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN]))],
)
async def create_admin_demo_user(data: tenant_team_model):
    return await TenantManager.get_instance().create_demo_user(data)


@tenant_routes.post(
    "/api/audit/logs",
    summary="Get audit logs",
    description="Retrieve audit logs for the current tenant and user context.",
    tags=["Audit Logs"],
    operation_id="getAuditLogs",
    response_description="Audit log entries matching the filter.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.PROFILE]))],
)
async def get_audit_logs(param: audit_log_param_model = Body(...), current_user=Depends(get_current_user)):
    return await AuditLogManager.get_instance().get(param, current_user)


@tenant_routes.post(
    "/api/get/company/profile",
    summary="Get company profile",
    description="Retrieve company profile data for the current tenant.",
    tags=["Profile", "Company"],
    operation_id="getCompanyProfile",
    response_description="Company profile data.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE,user_role.ADMIN])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def get_company_profile(current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().getCompanyProfileData(current_user)


@tenant_routes.post(
    "/api/update/company/profile",
    summary="Update company profile",
    description="Update company profile data for the current tenant.",
    tags=["Profile", "Company"],
    operation_id="updateCompanyProfile",
    response_description="Updated company profile data.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")),
    ],
)
async def update_company_profile(data: ProfileParmaModel, current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().updateCompanyProfile(data, current_user)


@tenant_routes.get(
    "/api/get/image",
    summary="Get profile image",
    description="Retrieve the profile image for the current user.",
    tags=["Profile", "Media"],
    operation_id="getProfileImage",
    response_description="Profile image metadata or file information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.PROFILE]))],
)
async def get_profile_image(current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().getProfileImage(current_user)


@tenant_routes.post(
    "/api/upload/image",
    summary="Upload profile image",
    description="Upload or update the profile image for the current user.",
    tags=["Profile", "Media"],
    operation_id="uploadProfileImage",
    response_description="Result of the profile image upload operation.",
    status_code=200,
    include_in_schema=False,
    dependencies=[Depends(role_required([user_role.ADMIN, user_role.PROFILE]))],
)
async def upload_profile_image(file: UploadFile, current_user=Depends(get_current_user)):
    return await ProfileManager.get_instance().uploadProfileImage(file, current_user)


@tenant_routes.post(
    "/api/alert/add",
    summary="Add custom alert",
    description="Create a new custom alert for the current user profile.",
    tags=["Alerts"],
    operation_id="addCustomAlert",
    response_description="Created custom alert information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def add_custom_alert(data: AlertModel, current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().add_custom_alert(data, current_user)


@tenant_routes.post(
    "/api/alert/seen",
    summary="Mark alerts as seen",
    description="Mark one or more alerts as seen for the current user profile.",
    tags=["Alerts"],
    operation_id="setAlertsSeen",
    response_description="Updated alerts with seen status.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def set_alerts_seen(data: list[AlertModel], current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().set_alert_seen(data, current_user)


@tenant_routes.post(
    "/api/alert/delete",
    summary="Delete alert",
    description="Delete a specific alert identified by its id for the current user.",
    tags=["Alerts"],
    operation_id="deleteAlert",
    response_description="Result of the delete alert operation.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def delete_alert(id: str = Body(..., description="Unique id identifier of the alert to delete."), current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().delete_alert(id, current_user)


@tenant_routes.post(
    "/api/alert/update",
    summary="Update alert",
    description="Update an existing alert for the current user profile.",
    tags=["Alerts"],
    operation_id="updateAlert",
    response_description="Updated alert information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def update_alert(data: AlertModel, current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().update_alert(data, current_user)


@tenant_routes.get(
    "/api/profile/alerts",
    summary="Get user alerts",
    description="Retrieve all alerts for the current user profile.",
    tags=["Alerts"],
    operation_id="getUserAlerts",
    response_description="List of alerts for the current user.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def get_user_alerts(current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().getAllAlerts(current_user)


@tenant_routes.post(
    "/api/profile/alert/scan",
    summary="Run IOC alert scan",
    description="Run indicator-of-compromise alert scanning for all categories for the current user.",
    tags=["Alerts", "Scanning"],
    operation_id="runUserIOCAlerts",
    response_description="Scan job execution information.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")),
    ],
)
async def run_user_ioc_alerts(current_user=Depends(get_current_user)):
    return await alert_job.get_instance().run_all_categories_for_api(current_user)


@tenant_routes.post(
    "/api/profile/alerts/delete/all",
    summary="Delete all alerts",
    description="Delete all alerts associated with the current user profile.",
    tags=["Alerts"],
    operation_id="deleteAllAlerts",
    response_description="Result of the delete-all operation.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")),
    ],
)
async def delete_all_alerts(current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().delete_all_alerts(current_user)

@tenant_routes.post(
    "/api/profile/alerts/delete/{_type}",
    summary="Delete all alerts",
    description="Delete all alerts associated with the current user profile.",
    tags=["Alerts"],
    operation_id="deleteAllAlerts",
    response_description="Result of the delete-all operation.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
        Depends(license_required("maintainer")),
    ],
)
async def delete_all_alerts(_type:str, current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().delete_alerts_by_type(current_user,_type)


@tenant_routes.post(
    "/api/profile/alert/scan/status",
    summary="Get alert scan status",
    description="Get the status of the latest alert scan for the current user.",
    tags=["Alerts", "Scanning"],
    operation_id="getAlertScanStatus",
    response_description="Alert scan status for the current user.",
    status_code=200,
    include_in_schema=False,
    dependencies=[
        Depends(role_required([user_role.PROFILE])),
        Depends(status_required([UserStatus.ACTIVE])),
    ],
)
async def get_alert_scan_status(current_user=Depends(get_current_user)):
    return await AlertManager.get_instance().get_scan_status(current_user)
