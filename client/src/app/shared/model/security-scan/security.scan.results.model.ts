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
  proof?: string;
}

export interface UrlScanProofItem {
  header: string;
  proof: string;
  confidence: RiskLevel;
  risk: RiskLevel;
}

export interface UrlScanResponse {
  result: {
    meta: UrlScanMeta;
    threats: Record<string, UrlScanThreatItem[]>;
    proofs?: Record<string, UrlScanProofItem[]>;
  };
}
