import { AlertAllIoc } from "../company-profile/node.model";

export const ALERT_CATEGORY_NAMES = [
  "general",
  "defacement",
  "breach",
  "exploit",
  "social",
  "discussion",
  "stealerlogs",
  "feed",
  "advanced scanning",
  "playstore-scanning",
  "social-scanner",
  "email-breach",
  "software-scanning",
  "vulnerability-scanning",
  "repo scanning",
  "seo scanning"
] as const;

export type AlertCategoryName = typeof ALERT_CATEGORY_NAMES[number];

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
    iocValue?: string;
    type?: string;
    reportSeen?: boolean;
    licenses?: string[];
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
    contentTypes: string[];
    rawFindings?: Record<string, unknown>;
    allIOC: AlertAllIoc[];
    detectedOn: Date;
    resultDate?: Date | null;
    password?: string;
}

export function createAlertCategorySummary(categoryName: string, iocCount: number, getRiskLevel: (categoryName: string) => string): AlertCategorySummary {
  return {
    categoryName,
    risk: getRiskLevel(categoryName),
    iocCount: Number(iocCount || 0),
    detectedDate: null,
    tags: []
  };
}
