import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteLiveShip, SatelliteLiveShipsBBoxResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class SatelliteShipTrackingService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  fetchInBounds(lat: number, lon: number, delta = 0.05, aisstreamApiKey?: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships', this.buildBoundsPayload(lat, lon, delta, aisstreamApiKey));
  }

  pollInBounds(lat: number, lon: number, delta = 0.05, aisstreamApiKey?: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.fetchInBounds(lat, lon, delta, aisstreamApiKey), (res) => this.getPollStatus(res));
  }

  fetchByMMSI(mmsi: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships/mmsi', { mmsi: mmsi });
  }

  pollByMMSI(mmsi: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.fetchByMMSI(mmsi), (res) => this.getPollStatus(res));
  }

  extractItems(payload: any): SatelliteLiveShip[] | null {
    if (Array.isArray(payload?.ships)) {
      return payload.ships as SatelliteLiveShip[];
    }

    const status = String(payload?.status || '').toLowerCase();
    if (status === 'pending' || status === 'busy') {
      return null;
    }

    return payload?.count === 0 ? [] : null;
  }

  getFeedIssue(payload: any): string | null {
    const payloadError = payload?.error || payload?.error_message || payload?.last_error || null;
    if (payloadError) {
      return payloadError;
    }

    if (payload?.connected === false || payload?.aisstream?.connected === false) {
      return 'ship feed disconnected';
    }

    return null;
  }

  private buildBoundsPayload(lat: number, lon: number, delta: number, aisstreamApiKey?: string): Record<string, any> {
    const payload: Record<string, any> = {
      lat_min: lat - delta,
      lat_max: lat + delta,
      lon_min: lon - delta,
      lon_max: lon + delta,
    };

    if (aisstreamApiKey?.trim()) {
      payload['aisstream_api_key'] = aisstreamApiKey.trim();
    }

    return payload;
  }

  private getPollStatus(res: any): string | undefined {
    return res?.result?.status || res?.status;
  }
}
