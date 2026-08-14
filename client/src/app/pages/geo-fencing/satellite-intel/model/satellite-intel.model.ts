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
