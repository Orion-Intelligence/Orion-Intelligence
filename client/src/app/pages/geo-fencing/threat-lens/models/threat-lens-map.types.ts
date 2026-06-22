import { AnimatedArcDescriptor, ThreatLensCategoryModelKey } from '../../models/geo-fencing.models';

export type LngLat = [number, number];

export interface ArcPair {
  countryAKey: string;
  countryBKey: string;
  weight: number;
}

export type ArcPoint2D = [number, number];

export type ThreatLensFeedPanelType = 'news' | 'archive';

export interface ThreatLensScreenPoint {
  x: number;
  y: number;
}

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
  lat?: number;
  lon?: number;
  network?: string;
  accuracyRadius?: number;
  distanceKm?: number;
}

export interface ThreatLensMapGraphicAttributes {
  role?: string;
  ip?: string;
  count?: number;
  networkCount?: number;
  records?: ThreatLensIpRecord[];
  stackReason?: string;
  network?: string;
  accuracyRadius?: number;
  accuracyMin?: number;
  accuracyMax?: number;
  distanceKm?: number;
  [key: string]: unknown;
}

export interface ThreatLensMapGraphic {
  geometry?: any;
  attributes?: ThreatLensMapGraphicAttributes;
  symbol?: any;
}

export interface ThreatLensIpDistributionCellRef {
  key: string;
  row: number;
  col: number;
  centerScore: number;
}

export interface ThreatLensIpDistributionCell extends ThreatLensIpDistributionCellRef {
  items: ThreatLensMapGraphic[];
}

export interface ThreatLensIpPointGroup {
  point: ThreatLensCoordinates;
  records: ThreatLensIpRecord[];
}

export interface ThreatLensIpScreenGroup {
  point: ThreatLensCoordinates;
  records: ThreatLensIpRecord[];
  items: ThreatLensMapGraphic[];
}

export interface ThreatLensIpGroupStats {
  networkCount: number;
  accuracyMin?: number;
  accuracyMax?: number;
}

export interface ThreatLensArcRangeOption {
  index: number;
  label: string;
  start: number;
  end: number;
}

export interface ThreatLensCountrySelection {
  name: string;
  key: string;
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
