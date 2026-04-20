export interface SatelliteCoordinates {
  lat:   number;
  lon:   number;
  delta: number;
  label?: string;
}

export interface SatelliteImageType {
  key:   string;
  label: string;
}

export const SATELLITE_IMAGE_TYPES: SatelliteImageType[] = [
  { key: 'true_colour',  label: 'True Colour'   },
  { key: 'false_colour', label: 'False Colour'  },
  { key: 'ndvi',         label: 'NDVI'          },
  { key: 'swir',         label: 'SWIR'          },
  { key: 'moisture',     label: 'Moisture'      },
  { key: 'sar',          label: 'SAR'           },
];

export interface SatelliteMapTabType {
  id:    'map' | 'compare' | 'anomaly' | 'sentinel' | 'facilities';
  label: string;
}

export const SATELLITE_TABS: SatelliteMapTabType[] = [
  { id: 'map',        label: 'Map View'       },
  { id: 'compare',    label: 'Compare'        },
  { id: 'anomaly',    label: 'Anomaly'        },
  { id: 'sentinel',   label: 'Sentinel Passes'},
  { id: 'facilities', label: 'Facilities'     },
];
