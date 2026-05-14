export interface FeederRuleOption {
  key: string;
  rule_type: string;
  path?: string | null;
  values: string[];
}

export interface FeederCatalogResponse {
  rules: FeederRuleOption[];
}

export interface FeederValueItem {
  url: string;
  status?: string | null;
  last_checked_at?: string | null;
  last_error?: string | null;
  last_success_date?: string | null;
  last_success_message?: string | null;
  last_failure_date?: string | null;
  last_failure_message?: string | null;
}

export interface FeederScriptItem {
  id: string;
  entry_kind?: string | null;
  enabled: boolean;
  file_name: string;
  path?: string | null;
  session_file_name?: string | null;
  content?: string | null;
  url?: string | null;
  values: FeederValueItem[];
  owner_id?: string | null;
  owner_name?: string | null;
  last_failure_date?: string | null;
  last_failure_message?: string | null;
  last_success_date?: string | null;
  last_success_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FeederScriptListResponse {
  scripts: FeederScriptItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface FeederUploadResponse {
  message?: string;
  script?: FeederScriptItem | null;
}

export interface FeederOwnerUser {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
  licenses?: string[];
}
