import { SatelliteIntelPanelEnum, SatelliteIntelRequestEnum } from '../enums/geo-fencing.enums';

export type SatelliteIntelPanel = SatelliteIntelPanelEnum;

export type SatelliteIntelRequest = SatelliteIntelRequestEnum;

export interface SatelliteIntelViewport {
  lat: number;
  lon: number;
  delta: number;
}
