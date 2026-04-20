export interface SatelliteGeocodeResult {
  name:         string;
  display_name: string;
  lat:          number;
  lon:          number;
  delta:        number;
  type:         string;
  class:        string;
}

export interface SatelliteGeocodeResponse {
  status?:  string;
  result?: {
    status:  string;
    results: SatelliteGeocodeResult[];
  };
  results?: SatelliteGeocodeResult[];
}

export interface SatelliteFacilityFeature {
  type:     'Feature';
  geometry: {
    type:        string;
    coordinates: any;
  };
  properties: {
    osm_id: number;
    kind:   string;
    name:   string;
  };
}

export interface SatelliteFacilitiesResponse {
  status?:  string;
  result?: {
    status:       string;
    type:         string;
    features:     SatelliteFacilityFeature[];
    total:        number;
    type_counts:  Record<string, number>;
    overpass_ok:  boolean;
    warning?:     string;
  };
}

export interface SatelliteSentinelPass {
  month:       string;
  month_key:   string;
  collection:  string;
  label:       string;
  available:   number;
  latest:      string | null;
  dates:       string[];
  error?:      string;
}

export interface SatelliteSentinelSearchResponse {
  status?:  string;
  result?: {
    status:  string;
    lat:     number;
    lon:     number;
    bbox:    number[];
    results: SatelliteSentinelPass[];
  };
}

export interface SatelliteMonthScore {
  month:       string;
  month_key:   string;
  date_from:   string;
  date_to:     string;
  ndvi_score:  number | null;
  has_data:    boolean;
}

export interface SatelliteAnomalyResponse {
  status?:  string;
  result?: {
    status:        string;
    lat:           number;
    lon:           number;
    bbox:          number[];
    months:        SatelliteMonthScore[];
    delta_score:   number;
    alert_level:   'critical' | 'warning' | 'nominal' | 'unknown';
    alert_colour:  string;
  };
}

export interface SatelliteCompareMonth {
  month_key:  string;
  label:      string;
  image_url:  string;
}

export interface SatelliteCompareResponse {
  status?:  string;
  result?: {
    status:      string;
    lat:         number;
    lon:         number;
    delta:       number;
    image_type:  string;
    months:      SatelliteCompareMonth[];
  };
}
