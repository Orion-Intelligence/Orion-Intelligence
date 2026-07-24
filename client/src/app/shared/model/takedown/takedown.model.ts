export type TakedownFilter = 'all' | 'pending' | 'accepted' | 'denied' | 'failed';

export interface TakedownRequestItem {
  id: string;
  created_at: string;
  target_url: string;
  target_domain: string;
  abuse_email: string;
  denial_reason?: string;
  username?: string;
  user_uuid: string;
  status: Exclude<TakedownFilter, 'all'>;
  public_status?: string;
  status_label?: string;
  report_id: string;
}

export interface TakedownListResponse {
  items: TakedownRequestItem[];
  total: number;
}

export interface TakedownActionResponse extends Partial<TakedownRequestItem> {
  evidence?: {
    result?: Record<string, unknown>;
    abuse_email_found?: string;
  } & Record<string, unknown>;
}

export interface TakedownActionResult {
  abuse_email?: string;
  error?: string;
  status_label?: string;
  takedown_type?: string;
  action_url?: string;
}
