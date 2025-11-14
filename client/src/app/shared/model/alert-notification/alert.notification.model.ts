import { AlertAllIoc } from "../company-profile/company.profile.model";

export interface AlertCategorySummary {
    categoryName: string;
    risk: AlertRiskLevel;
    iocCount: number;
    detectedDate: Date;
    tags: string[];
}

export interface AlertNotification {
    categoryName: string;
    risk: AlertRiskLevel;
    iocNames: string[];
    subCategory: string;
    lastSeen: Date;
    hash: string;
}
export interface CategoryAlerts {
    risk: AlertRiskLevel;
    category: string;
    title: string;
    description: string;
    hash: string;
    source: string;
    url: string;
    entity: string;
    allIOC: AlertAllIoc[];
    detectedOn: Date;
}
export type AlertRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
