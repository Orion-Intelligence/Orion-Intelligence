export interface SystemLogEntry {
  id: string;
  date: string;
  file: string;
  line: number;
  type: 'INFO' | 'WARNING' | 'ERROR';
  timestamp: string;
  message: string;
  caller: string;
  raw: string;
}

export interface SystemLogFile {
  date: string;
  file: string;
  size: number;
  modified_at: string;
}

export interface SystemLogResponse {
  entries: SystemLogEntry[];
  total: number;
  page: number;
  limit: number;
  page_count: number;
  available_dates: string[];
  files: SystemLogFile[];
}
