import { ConsolidatedParamModel } from '../../../shared/model/results/consolidated/consolidated.param.model';

export const THREAT_LENS_CATEGORY_CONFIG = [
  { key: 'leak_model', label: 'Leak', color: [244, 114, 182] as [number, number, number] },
  { key: 'tracking_model', label: 'Tracking', color: [250, 204, 21] as [number, number, number] },
  { key: 'news_model', label: 'News', color: [34, 211, 238] as [number, number, number] },
  { key: 'exploit_model', label: 'Exploit', color: [251, 146, 60] as [number, number, number] },
  { key: 'defacement_model', label: 'Defacement', color: [248, 113, 113] as [number, number, number] },
  { key: 'chat_model', label: 'Chat', color: [167, 139, 250] as [number, number, number] },
  { key: 'social_model', label: 'Social', color: [74, 222, 128] as [number, number, number] },
  { key: 'generic_model', label: 'Generic', color: [148, 163, 184] as [number, number, number] },
] as const;

export type ThreatLensCategoryModelKey = typeof THREAT_LENS_CATEGORY_CONFIG[number]['key'];
export type ThreatLensRequestPayload = ConsolidatedParamModel;

export interface ThreatCountryCount {
  country: string;
  count: number;
}

export interface ThreatLensCategoryMapData {
  categoryKey: ThreatLensCategoryModelKey;
  categoryLabel: string;
  color: [number, number, number];
  countryCounts: ThreatCountryCount[];
  totalResults: number;
  documentCountryGroups: string[][];
}

export interface ThreatLensFeedItem {
  id: string;
  categoryKey: ThreatLensCategoryModelKey;
  categoryLabel: string;
  color: [number, number, number];
  title: string;
  summary: string;
  highlights: string[];
  link: string;
  date: string;
  timestamp: number;
  countryKeys: string[];
}

export interface ThreatLensMapData {
  countryCounts: ThreatCountryCount[];
  totalResults: number;
  maxCount: number;
  categoryData: ThreatLensCategoryMapData[];
  feedItems: ThreatLensFeedItem[];
}

export interface ThreatLensLegendItem {
  categoryKey: ThreatLensCategoryModelKey;
  label: string;
  colorHex: string;
  countryCount: number;
  arcCount: number;
  totalResults: number;
}

export interface SelectedCountryCategoryCount {
  label: string;
  colorHex: string;
  count: number;
}

export interface AnimatedArcDescriptor {
  categoryKey: ThreatLensCategoryModelKey;
  categoryLabel: string;
  color: [number, number, number];
  weight: number;
  arcPoints: [number, number, number][];
  arcPaths: [number, number, number][][];
  surfacePaths: [number, number][][];
  countryAKey: string;
  countryBKey: string;
  countryAName: string;
  countryBName: string;
  animationOffset: number;
  animationDuration: number;
}

export type ThreatLensFeedRange = '1d' | '7d' | 'all';

export type ThreatLensDisplayFeedItem = ThreatLensFeedItem & {
  displayDate: string;
  colorHex: string;
};
