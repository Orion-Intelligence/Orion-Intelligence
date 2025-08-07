export interface TechnicalDetails {
    foundOn: string;
    instancesCount: number;
    cweId: string;
    wascId: string;
}

export interface FindingDetail {
    id: number;
    url: string;
}

export interface Finding {
    id: number;
    title: string;
    description: string;
    note: string;
    severity: string;
    confidence: string;
    instances: string;
    expanded: boolean;
    details: FindingDetail[];
    technicalDetails: TechnicalDetails;
}

export interface RiskBreakdown {
    total: number;
    medium: number;
    low: number;
    informational: number;
}

export interface SecurityPosture {
    riskAppetite: string;
    score: number;
    riskBreakdown: RiskBreakdown;
}

export interface ScanData {
    url: string;
    host: string;
    port: number;
    scanDate: string;
    scannedBy: string;
}
