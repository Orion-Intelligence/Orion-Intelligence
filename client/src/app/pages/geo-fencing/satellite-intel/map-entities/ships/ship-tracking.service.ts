import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteLiveShip, SatelliteLiveShipsBBoxResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class SatelliteShipTrackingService {
  private readonly minimumBoundsDelta = 2.5;

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
    const items = this.extractShipArray(payload);
    if (items) {
      return items
        .map((item) => this.normalizeShip(item))
        .filter((ship): ship is SatelliteLiveShip => ship !== null);
    }

    const status = String(payload?.status || '').toLowerCase();
    if (status === 'pending' || status === 'busy') {
      return null;
    }

    return this.getPayloadCount(payload) === 0 ? [] : null;
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
    const boundsDelta = Math.max(delta, this.minimumBoundsDelta);
    const payload: Record<string, any> = {
      lat_min: this.clampLatitude(lat - boundsDelta),
      lat_max: this.clampLatitude(lat + boundsDelta),
      lon_min: this.clampLongitude(lon - boundsDelta),
      lon_max: this.clampLongitude(lon + boundsDelta),
    };

    if (aisstreamApiKey?.trim()) {
      payload['aisstream_api_key'] = aisstreamApiKey.trim();
    }

    return payload;
  }

  private extractShipArray(payload: any): any[] | null {
    const candidates = [
      payload?.ships,
      payload?.result?.ships,
      payload?.data?.ships,
      payload?.ship,
      payload?.result?.ship,
      payload?.data?.ship,
      payload?.vessels,
      payload?.result?.vessels,
      payload?.data?.vessels,
      payload?.items,
      payload?.result?.items,
      payload?.data?.items,
      payload?.Result,
    ];

    for (const candidate of candidates) {
      const items = this.toShipArray(candidate);
      if (items) {
        return items;
      }
    }

    return null;
  }

  private normalizeShip(item: any): SatelliteLiveShip | null {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const latitude = this.readNumber(item, ['latitude', 'lat', 'LAT', 'Latitude'], [['position', 'lat'], ['location', 'lat'], ['location_point', 'lat']]);
    const longitude = this.readNumber(item, ['longitude', 'lon', 'lng', 'LON', 'Longitude'], [['position', 'lon'], ['position', 'lng'], ['location', 'lon'], ['location', 'lng'], ['location_point', 'lon']]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const mmsi = this.readString(item, ['mmsi', 'MMSI', 'Mmsi', 'id', 'ship_id', 'vessel_id']) || `${latitude}:${longitude}`;
    return {
      ...item,
      mmsi,
      name: this.readString(item, ['name', 'ship_name', 'vessel_name', 'VesselName']) ?? item.name ?? null,
      latitude,
      longitude,
      speed: this.readNumber(item, ['speed', 'sog', 'SOG', 'Speed']),
      course: this.readNumber(item, ['course', 'cog', 'COG', 'Course']),
      true_heading: this.readNumber(item, ['true_heading', 'heading', 'HDG', 'Heading']),
      nav_status: this.readNumber(item, ['nav_status', 'navigational_status', 'status_code']),
      call_sign: this.readString(item, ['call_sign', 'callsign', 'CallSign']) ?? item.call_sign ?? null,
      destination: this.readString(item, ['destination', 'Destination']) ?? item.destination ?? null,
      ship_type: this.readNumber(item, ['ship_type', 'ShipType', 'type']),
    };
  }

  private readNumber(item: any, keys: string[], paths: string[][] = []): number | null {
    const value = this.readValue(item, keys, paths);
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private toShipArray(candidate: any): any[] | null {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

    if (this.hasShipFields(candidate)) {
      return [candidate];
    }

    const values = Object.values(candidate).filter((value) => value && typeof value === 'object');
    return values.length ? values : null;
  }

  private hasShipFields(candidate: any): boolean {
    return [
      candidate?.mmsi,
      candidate?.MMSI,
      candidate?.latitude,
      candidate?.lat,
      candidate?.longitude,
      candidate?.lon,
      candidate?.lng,
      candidate?.position,
      candidate?.location,
    ].some((value) => value !== null && value !== undefined && value !== '');
  }

  private readString(item: any, keys: string[]): string | null {
    const value = this.readValue(item, keys);
    if (value === null || value === undefined) {
      return null;
    }
    const text = String(value).trim();
    return text || null;
  }

  private readValue(item: any, keys: string[], paths: string[][] = []): unknown {
    for (const key of keys) {
      if (item[key] !== null && item[key] !== undefined && item[key] !== '') {
        return item[key];
      }
    }

    for (const path of paths) {
      let value = item;
      for (const segment of path) {
        value = value?.[segment];
      }
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    return null;
  }

  private getPayloadCount(payload: any): number | null {
    const count = payload?.count ?? payload?.total ?? payload?.result?.count ?? payload?.data?.count;
    if (typeof count === 'number') {
      return Number.isFinite(count) ? count : null;
    }
    if (typeof count === 'string' && count.trim()) {
      const parsed = Number(count);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private clampLatitude(value: number): number {
    return Math.max(-90, Math.min(90, value));
  }

  private clampLongitude(value: number): number {
    return Math.max(-180, Math.min(180, value));
  }

  private getPollStatus(res: any): string | undefined {
    return res?.result?.status || res?.status;
  }
}
