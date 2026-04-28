export interface SatelliteGeocodeResult {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  delta: number;
  type: string;
  class: string;
}

export interface SatelliteGeocodeResponse {
  results: SatelliteGeocodeResult[];
  status: string;
  error_message?: string;
}

export type TrackKind = 'aircraft' | 'ship';

export interface TrackingProperties {
  id: string;
  kind: TrackKind;
  label: string;
  heading: number;
  speed: number | null;
  altitude?: number | null;
  destination?: string | null;
}

export interface TrackingFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: TrackingProperties;
}

export interface TrackingFeatureCollection {
  type: 'FeatureCollection';
  features: TrackingFeature[];
}

export interface TrackedEntityState {
  id: string;
  kind: TrackKind;
  label: string;
  heading: number;
  speed: number | null;
  altitude?: number | null;
  destination?: string | null;
  fromLon: number;
  fromLat: number;
  toLon: number;
  toLat: number;
  renderedLon: number;
  renderedLat: number;
}

export interface FacilityFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'Polygon' | 'LineString';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    osm_id: number;
    kind: string;
    name: string;
  };
}

export interface SatelliteFacilitiesResponse {
  type: 'FeatureCollection';
  features: FacilityFeature[];
  total: number;
  type_counts: Record<string, number>;
  overpass_ok: boolean;
  status: string;
  warning?: string;
  error_message?: string;
}

export interface SentinelSearchEntry {
  month: string;
  month_key: string;
  collection: string;
  label: string;
  available: number;
  latest: string | null;
  dates: string[];
  error?: string;
}

export interface SatelliteSentinelSearchResponse {
  lat: number;
  lon: number;
  bbox: number[];
  results: SentinelSearchEntry[];
  status: string;
  error_message?: string;
}

export interface SatelliteImageResponse {
  status: string;
  image_type: string;
  collection: string;
  month: string;
  date_from: string;
  date_to: string;
  bbox: number[];
  size: number;
  size_bytes: number;
  error_message?: string;
}

export interface AnomalyMonthResult {
  month: string;
  month_key: string;
  date_from: string;
  date_to: string;
  ndvi_score: number | null;
  has_data: boolean;
}

export type AlertLevel = 'critical' | 'warning' | 'nominal' | 'unknown';

export interface SatelliteAnomalyResponse {
  lat: number;
  lon: number;
  bbox: number[];
  months: AnomalyMonthResult[];
  delta_score: number;
  alert_level: AlertLevel;
  alert_colour: string;
  status: string;
  error_message?: string;
}

export interface CompareMonth {
  month_key: string;
  label: string;
  image_url: string;
}

export interface SatelliteCompareResponse {
  lat: number;
  lon: number;
  delta: number;
  image_type: string;
  months: CompareMonth[];
  status: string;
  error_message?: string;
}

export type SatelliteImageType =
  | 'true_colour'
  | 'false_colour'
  | 'ndvi'
  | 'swir'
  | 'moisture'
  | 'sar';

export const SATELLITE_IMAGE_TYPES: Record<SatelliteImageType, string> = {
  true_colour:  'True Colour',
  false_colour: 'False Colour',
  ndvi:         'NDVI',
  swir:         'SWIR',
  moisture:     'Moisture',
  sar:          'SAR',
};

export const FACILITY_COLOURS: Record<string, string> = {
  industrial:   '#f39c12',
  port:         '#e74c3c',
  depot:        '#e67e22',
  warehouse:    '#f39c12',
  logistics:    '#e67e22',
  dock:         '#3a7bd5',
  boatyard:     '#3a7bd5',
  pier:         '#3a7bd5',
  crane:        '#9b59b6',
  storage_tank: '#e74c3c',
  pipeline:     '#888888',
  breakwater:   '#888888',
  hangar:       '#9b59b6',
  factory:      '#e74c3c',
  facility:     '#888888',
};
