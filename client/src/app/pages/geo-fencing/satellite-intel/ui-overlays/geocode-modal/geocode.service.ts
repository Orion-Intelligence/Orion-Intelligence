import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { SatelliteGeocodeResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class GeocodeService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  async fetchGeocodeOnce(query: string): Promise<any> {
    const call = () => this.api.post<SatelliteGeocodeResponse>('satellite/geocode', { query });
    const response = await lastValueFrom(this.satelliteIntelService.createPolledRequest(call, (value) => this.getResponseStatus(value), 2000));
    const responseError = this.getResponseError(response);
    if (responseError) {
      throw new Error(responseError.message);
    }
    return response?.result ?? response;
  }

  isValidCoordinates(value: string): boolean {
    const parts = value.trim().split(/[\s,]+/);
    if (parts.length !== 2) {
      return false;
    }
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  isValidDelta(value: number): boolean {
    return value > 0 && value <= 9;
  }

  parseCoordinates(value: string): { lat: number; lon: number } | null {
    const parts = value.trim().split(/[\s,]+/);
    if (parts.length !== 2) {
      return null;
    }
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) {
      return null;
    }
    return { lat, lon };
  }

  validateCoordinatesInput(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (!this.isValidCoordinates(trimmed)) {
      return 'Enter coordinates as: latitude, longitude - e.g. 31.48, 74.17';
    }
    return null;
  }

  validateDeltaInput(value: number): string | null {
    if (!this.isValidDelta(value)) {
      return 'Coverage size must be between 0.001 and 9 degrees (~1,000 km)';
    }
    return null;
  }

  private getResponseStatus(value: any): string | undefined {
    return value?.result?.status || value?.status;
  }

  private getResponseError(value: any): { message: string } | null {
    const status = this.getResponseStatus(value);
    if (status !== 'error') {
      return null;
    }
    return { message: value?.result?.error_message || value?.result?.message || value?.message || 'Request failed' };
  }
}
