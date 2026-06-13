import { AnimatedArcDescriptor, SelectedCountryCategoryCount, ThreatLensCategoryModelKey } from '../../models/geo-fencing.models';

export type LngLat = [number, number];

export type ArcPair = {
  countryAKey: string;
  countryBKey: string;
  weight: number;
};

export type ArcPoint2D = [number, number];

export interface ThreatLensCoordinates {
  lat: number;
  lon: number;
}

export interface ThreatLensCountryBoundary {
  rings: ThreatLensCoordinates[][];
  extent: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface ThreatLensIpViewportScanRequest {
  center: ThreatLensCoordinates;
  radiusKm: number;
  boundary?: ThreatLensCountryBoundary | null;
}

export interface ThreatLensIpRecord {
  ip: string;
}

export interface ThreatLensCountrySelection {
  name: string;
  key: string;
  count: number;
  breakdown: SelectedCountryCategoryCount[];
  ipScanRequest?: ThreatLensIpViewportScanRequest | null;
}

export interface ThreatLensArcSelection {
  categoryKey: ThreatLensCategoryModelKey;
  categoryLabel: string;
  countryAKey: string;
  countryBKey: string;
  countryAName: string;
  countryBName: string;
  weight: number;
}

export interface ThreatLensArcRenderResult {
  totalArcCount: number;
  arcCountByCategory: Map<ThreatLensCategoryModelKey, number>;
}

export interface ThreatLensArcBatchStatus {
  categoryKey: ThreatLensCategoryModelKey | null;
  categoryLabel: string;
  visibleCount: number;
  categoryArcCount: number;
  start: number;
  end: number;
  batchIndex: number;
  batchCount: number;
  isCategoryLocked: boolean;
}

export interface ArcCategoryBatch {
  categoryKey: ThreatLensCategoryModelKey;
  categoryLabel: string;
  categoryArcCount: number;
  categoryStartIndex: number;
  categoryBatchIndex: number;
  categoryBatchCount: number;
  items: AnimatedArcDescriptor[];
}
