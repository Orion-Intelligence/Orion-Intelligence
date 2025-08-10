export interface UrlScanMeta {
  URL: string;
  Host: string;
  Port: string;
  Scanned_on_date: string;
  Scanned_by: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Informational' | string;

export interface UrlScanThreatItem {
  header: string;
  description: string;
  confidence: RiskLevel;
  risk: RiskLevel;
}

export interface UrlScanResponse {
  result: {
    meta: UrlScanMeta;
    threats: Record<string, UrlScanThreatItem[]>;
  };
}
