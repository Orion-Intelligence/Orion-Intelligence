import { AppService } from '../../services/core/app/app.service';

export function isTenantIocPrivileged(appService: AppService): boolean {
  const tenantPrivileged = appService.tenantData().privileged_ioc;
  return tenantPrivileged === undefined
    ? appService.userSessionData().tenant.privilegedIoc !== true
    : !tenantPrivileged;
}
