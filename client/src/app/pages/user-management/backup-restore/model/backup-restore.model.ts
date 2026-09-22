export interface BackupJob {
  operation: string;
  status: 'idle' | 'running' | 'done' | 'failed';
  progress: number;
  message: string;
  filename: string;
}

export interface BackupRecord {
  id: string;
  filename: string;
  backup_type: 'auto' | 'instant';
  created_at: string;
}

export interface BackupVisibilityTenant {
  tenant_id: string;
  name: string;
  slug: string;
  kind: 'default' | 'primary' | 'secondary';
  parent_tenant_id: string;
  users: number;
  documents: number;
  search_documents: number;
  files: number;
}

export interface BackupVisibility {
  filename: string;
  backup_type: string;
  created_at: string;
  totals: { tenants: number; primary: number; secondary: number };
  admin: {
    mongo: Record<string, number>;
    elastic: Record<string, number>;
    arango: Record<string, number>;
    documents: number;
    search_documents: number;
    connections: number;
  };
  tenants: BackupVisibilityTenant[];
}

export interface CountRow {
  name: string;
  count: number;
}
