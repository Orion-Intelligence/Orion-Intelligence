import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteLiveAircraft, SatelliteLiveAircraftBBoxResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class SatelliteAircraftTrackingService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  fetchInBounds(lat: number, lon: number, delta = 0.05, openskyClientId?: string, openskyClientSecret?: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft', this.buildBoundsPayload(lat, lon, delta, openskyClientId, openskyClientSecret));
  }

  pollInBounds(lat: number, lon: number, delta = 0.05, openskyClientId?: string, openskyClientSecret?: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.fetchInBounds(lat, lon, delta, openskyClientId, openskyClientSecret), (res) => this.getPollStatus(res));
  }

  fetchGlobal(openskyClientId?: string, openskyClientSecret?: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft', this.buildGlobalPayload(openskyClientId, openskyClientSecret));
  }

  pollGlobal(openskyClientId?: string, openskyClientSecret?: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.fetchGlobal(openskyClientId, openskyClientSecret), (res) => this.getPollStatus(res));
  }

  fetchByICAO(icao: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft/icao', { icao24: icao });
  }

  pollByICAO(icao: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.fetchByICAO(icao), (res) => this.getPollStatus(res));
  }

  fetchTrack(icao: string): Observable<any> {
    return this.api.post<any>('satellite/livetrack/aircraft/track', { icao24: icao });
  }

  pollTrack(icao: string): Observable<any> {
    return this.satelliteIntelService.createPolledRequest(() => this.fetchTrack(icao), (res) => this.getPollStatus(res));
  }

  extractItems(payload: any): SatelliteLiveAircraft[] | null {
    if (Array.isArray(payload?.aircraft)) {
      return payload.aircraft as SatelliteLiveAircraft[];
    }

    const status = String(payload?.status || '').toLowerCase();
    if (status === 'pending' || status === 'busy') {
      return null;
    }

    return payload?.count === 0 ? [] : null;
  }

  getFeedIssue(payload: any): string | null {
    return payload?.error || payload?.error_message || payload?.last_error || null;
  }

  private buildBoundsPayload(lat: number, lon: number, delta: number, openskyClientId?: string, openskyClientSecret?: string): Record<string, any> {
    const payload: Record<string, any> = {
      lat_min: lat - delta,
      lat_max: lat + delta,
      lon_min: lon - delta,
      lon_max: lon + delta,
    };

    if (openskyClientId?.trim()) {
      payload['opensky_client_id'] = openskyClientId.trim();
    }
    if (openskyClientSecret?.trim()) {
      payload['opensky_client_secret'] = openskyClientSecret.trim();
    }

    return payload;
  }

  private buildGlobalPayload(openskyClientId?: string, openskyClientSecret?: string): Record<string, any> {
    const payload: Record<string, any> = {
      lat_min: -90,
      lat_max: 90,
      lon_min: -180,
      lon_max: 180,
    };

    if (openskyClientId?.trim()) {
      payload['opensky_client_id'] = openskyClientId.trim();
    }
    if (openskyClientSecret?.trim()) {
      payload['opensky_client_secret'] = openskyClientSecret.trim();
    }

    return payload;
  }

  private getPollStatus(res: any): string | undefined {
    return res?.result?.status || res?.status;
  }
}
