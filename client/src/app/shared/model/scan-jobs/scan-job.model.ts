export type ScanJobStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled' | 'expired';

export interface ScanJob {
  id: string;
  title?: string;
  target?: string;
  payload?: Record<string, any>;
  response?: any;
  seen?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
  completed_at?: string | Date | null;
}

export interface ScanJobCreateResponse {
  scan_id: string;
  title: string;
  target: string;
  payload: Record<string, any>;
  status: ScanJobStatus;
  response?: any;
  seen?: boolean;
  source?: 'new' | 'existing_running' | 'previous_completed';
  created_at?: string | Date;
  updated_at?: string | Date;
  completed_at?: string | Date | null;
}

export interface ScanJobDuplicateChoiceResponse {
  requires_confirmation: true;
  message: string;
  previous_scan: ScanJobCreateResponse;
}

export type ScanJobCreateApiResponse = ScanJobCreateResponse | ScanJobDuplicateChoiceResponse;

export interface ScanJobNotificationResponse {
  scan_id: string;
  title?: string;
  target?: string;
  response?: any;
  seen?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
  completed_at?: string | Date | null;
}

export interface ScanJobIncompleteResponse {
  scan_id: string;
  payload?: Record<string, any>;
}

export type ScanJobApiItem = Partial<ScanJob> & {
  scan_id?: string;
  status?: ScanJobStatus;
};

export interface ScanJobListResponse<T = ScanJobApiItem> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface ScanJobPollResponse {
  response?: any;
  seen?: boolean;
  updated_at?: string | Date;
  completed_at?: string | Date | null;
}

export interface ScanJobCountResponse {
  total: number;
}

export interface ScanJobSeenResponse {
  message: string;
}

export interface ScanJobDeleteResponse {
  message: string;
  deleted?: number;
  skipped?: number;
}

export interface ScanJobStartRequest {
  apiReference: string;
  payload: Record<string, any>;
  metadata?: {
    section?: string;
    title?: string;
    target?: string;
  };
  pollDelayMs?: number;
  forceNew?: boolean;
}
