export enum OrionSatelliteFeatureTypeEnum {
  Hydro = 'hydro',
  Solar = 'solar',
  Wind = 'wind',
  Gas = 'gas',
  Coal = 'coal',
  Oil = 'oil',
  Nuclear = 'nuclear',
  Geothermal = 'geothermal',
  Biomass = 'biomass',
  Waste = 'waste',
  Storage = 'storage',
  Cogeneration = 'cogeneration',
  Petcoke = 'petcoke',
  WaveAndTidal = 'wave_and_tidal',
  Airport = 'airport',
  Port = 'port',
  Warehouse = 'warehouse',
  Industrial = 'industrial',
  Military = 'military',
  Other = 'other',
}

export enum OrionSatelliteSourceEnum {
  Wri = 'WRI',
  Osm = 'OSM',
}

export enum SatelliteIntelPanelEnum {
  Dashboard = 'dashboard',
  Compare = 'compare',
  Anomaly = 'anomaly',
  Sentinel = 'sentinel',
  Image = 'image',
}

export enum SatelliteIntelRequestEnum {
  Anomaly = 'anomaly',
  Compare = 'compare',
  Sentinel = 'sentinel',
  SentinelImage = 'sentinel-image',
}
