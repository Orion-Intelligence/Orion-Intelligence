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

export interface ThreatLensIpRecord {
  ip: string;
  lat?: number;
  lon?: number;
}

export interface ThreatLensCountrySelection {
  name: string;
  key: string;
  count: number;
  breakdown: SelectedCountryCategoryCount[];
}

export interface ThreatLensArcRenderResult {
  totalArcCount: number;
  arcCountByCategory: Map<ThreatLensCategoryModelKey, number>;
}
