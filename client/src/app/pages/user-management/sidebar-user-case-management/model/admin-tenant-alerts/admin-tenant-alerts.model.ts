import { AlertCategorySummary } from '../../../../../shared/model/alert-notification/alert.notification.model';
import { AlertModel, AlertSummary } from '../../../../../shared/model/company-profile/node.model';
import { TenantModel } from '../../../../../shared/model/tenant/tenant.model';

export interface AdminTenantSummary extends TenantModel {
  email?: string;
  is_active?: boolean;
}

export interface AdminTenantAlertsResponse {
  tenant: AdminTenantSummary;
  alert_summary: AlertSummary;
}

export interface AdminTenantAlertGroup {
  tenant: AdminTenantSummary;
  alertSummary: AlertSummary;
  totalAlerts: number;
  categories: AlertCategorySummary[];
  riskCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface AdminTenantAlertsPage {
  items: AlertModel[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
