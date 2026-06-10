import { SelectedCountryCategoryCount, ThreatLensCategoryModelKey } from '../../models/geo-fencing.models';

export type LngLat = [number, number];

export type ArcPair = {
  countryAKey: string;
  countryBKey: string;
  weight: number;
};

export type ArcPoint3D = [number, number, number];
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
