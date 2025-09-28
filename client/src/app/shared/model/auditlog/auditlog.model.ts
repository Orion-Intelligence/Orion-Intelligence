export interface AuditLogItem {
  id: string;
  ts: string;
  actor_id: string;
  event: string;
}

export interface AuditLogCallbackModel {
  total_count: number;
  page: number;
  items: AuditLogItem[];
}
