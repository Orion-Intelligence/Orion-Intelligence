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
export type OrionPowerType =
  | 'hydro'
  | 'solar'
  | 'wind'
  | 'gas'
  | 'coal'
  | 'oil'
  | 'nuclear'
  | 'geothermal'
  | 'biomass'
  | 'waste'
  | 'storage'
  | 'cogeneration'
  | 'petcoke'
  | 'wave_and_tidal'
  | 'airport'
  | 'port'
  | 'warehouse'
  | 'industrial'
  | 'military'
  | 'other';

export type OrionInfrastructureType =
  | 'airport'
  | 'port'
  | 'warehouse'
  | 'industrial'
  | 'military';

export type OrionSatelliteFeatureType = OrionPowerType | OrionInfrastructureType;
export type OrionSatelliteSource = 'WRI' | 'OSM';

export interface OrionSatelliteFeature {
  id: string;
  name: string;
  type: OrionSatelliteFeatureType;
  rawType: string;
  source: OrionSatelliteSource;
  coordinates: [number, number];
  color: string;
  capacityMw?: number | null;
  properties?: Record<string, unknown>;
}

export interface PowerPlantsSearchRequest {
  page: number;
  size: number;
}

export interface PowerPlantsSearchItem {
  id?: string;
  _id?: string;
  name?: string;
  location?: {
    lat?: number;
    lon?: number;
  };
  location_point?: {
    lat?: number;
    lon?: number;
  };
  lat?: number;
  lon?: number;
}

export interface PowerPlantsSearchResponse {
  Result?: PowerPlantsSearchItem[];
  result?: PowerPlantsSearchItem[];
  Page?: number;
  page?: number;
  Page_Count?: number;
  page_count?: number;
  Total_Hits?: number;
  total_hits?: number;
}

export interface PowerPlantByIdItem {
  id: string;
  name?: string;
  country?: string;
  type?: string;
  capacity?: number;
  source?: string;
  location?: {
    lat?: number;
    lon?: number;
  };
  location_point?: string;
}

export interface PowerPlantsByIdsResponse {
  Result: PowerPlantByIdItem[];
  Count: number;
}

export interface OrionSatelliteFilterOption {
  key: OrionSatelliteFeatureType;
  label: string;
  color: string;
}

export interface OrionSatelliteGeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    country?: string;
    fuel?: string;
    primary_fuel?: string;
    capacity_mw?: number | null;
    source?: string;
  };
}

export interface OrionSatelliteGeoJsonCollection {
  type: 'FeatureCollection';
  features: OrionSatelliteGeoJsonFeature[];
}

export const ORION_POWER_FILTERS: OrionSatelliteFilterOption[] = [
  { key: 'hydro', label: 'hydro', color: '#2563eb' },
  { key: 'solar', label: 'solar', color: '#facc15' },
  { key: 'wind', label: 'wind', color: '#16a34a' },
  { key: 'gas', label: 'gas', color: '#f59e0b' },
  { key: 'coal', label: 'coal', color: '#111827' },
  { key: 'oil', label: 'oil', color: '#f97316' },
  { key: 'nuclear', label: 'nuclear', color: '#dc2626' },
  { key: 'geothermal', label: 'geothermal', color: '#ec4899' },
  { key: 'biomass', label: 'biomass', color: '#84cc16' },
  { key: 'waste', label: 'waste', color: '#8b5cf6' },
  { key: 'storage', label: 'storage', color: '#06b6d4' },
  { key: 'cogeneration', label: 'cogeneration', color: '#14b8a6' },
  { key: 'petcoke', label: 'petcoke', color: '#78716c' },
  { key: 'wave_and_tidal', label: 'wave & tidal', color: '#0ea5e9' },
  { key: 'airport', label: 'airport', color: '#9333ea' },
  { key: 'port', label: 'port', color: '#0d9488' },
  { key: 'warehouse', label: 'warehouse', color: '#92400e' },
  { key: 'industrial', label: 'industrial', color: '#6b7280' },
  { key: 'military', label: 'military', color: '#d71c1c' },
  { key: 'other', label: 'other', color: '#a3a3a3' },
];

export const ORION_INFRASTRUCTURE_FILTERS: OrionSatelliteFilterOption[] = [
  { key: 'airport', label: 'airport', color: '#9333ea' },
  { key: 'port', label: 'port', color: '#0d9488' },
  { key: 'warehouse', label: 'warehouse', color: '#92400e' },
  { key: 'industrial', label: 'industrial', color: '#6b7280' },
  { key: 'military', label: 'military', color: '#d71c1c' },
];

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
