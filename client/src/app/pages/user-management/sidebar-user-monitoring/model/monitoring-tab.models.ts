export type MonitoringTabId = 'event-management' | 'log-manager' | 'auditlog';

export interface MonitoringTab {
  id: MonitoringTabId;
  label: string;
}
