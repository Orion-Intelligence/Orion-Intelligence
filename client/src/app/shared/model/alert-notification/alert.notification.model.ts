import { AlertAllIoc } from "../company-profile/company.profile.model";

export interface AlertCategorySummary {
    categoryName: string;
    risk: string;
    iocCount: number;
    detectedDate: Date | null;
    tags: string[];
}

export interface AlertNotification {
    categoryName: string;
    risk: string;
    iocNames: string[];
    subCategory: string;
    lastSeen: Date;
    hash: string;
}
export interface CategoryAlerts {
    id: string;
    custom: boolean;
    seen: boolean;
    risk: string;
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
