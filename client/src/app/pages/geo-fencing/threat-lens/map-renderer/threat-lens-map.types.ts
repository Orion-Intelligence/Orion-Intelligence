import { SelectedCountryCategoryCount, ThreatLensCategoryModelKey } from '../../models/geo-fencing.models';

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
