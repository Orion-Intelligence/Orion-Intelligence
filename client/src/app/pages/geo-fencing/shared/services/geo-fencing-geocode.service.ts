import { Injectable } from '@angular/core';
import { lastValueFrom, Observable } from 'rxjs';
import { SatelliteGeocodeResponse, SatelliteGeocodeResult } from '../../satellite-intel/model/satellite-intel-api.models';
import { ApiService } from '../../../../shared/services/api.service';
import { pollWhilePending } from '../utils/polling.util';

@Injectable({ providedIn: 'root' })
export class GeoFencingGeocodeService {
  private readonly pollDelayMs = 2000;

  constructor(private api: ApiService) {}

  async fetchGeocodeResults(query: string): Promise<SatelliteGeocodeResult[]> {
    const call = () => this.api.post<SatelliteGeocodeResponse>('satellite/geocode', { query });
    const response = await lastValueFrom(this.createPolledRequest(call, (value) => this.getResponseStatus(value)));
    const responseError = this.getResponseError(response);
    if (responseError) {
      throw new Error(responseError.message);
    }
    return this.getResponseResult(response)?.results ?? [];
  }

  private createPolledRequest<T>(call: () => Observable<T>, getStatus: (value: T) => string | undefined): Observable<T> {
    return pollWhilePending(call, (value) => this.isPendingOrBusy(getStatus(value)), this.pollDelayMs);
  }

  private isPendingOrBusy(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
  }

  private getResponseStatus(value: SatelliteGeocodeResponse): string | undefined {
    return value.result?.status ?? value.status;
  }

  private getResponseResult(value: SatelliteGeocodeResponse): SatelliteGeocodeResponse['result'] | SatelliteGeocodeResponse {
    return value.result ?? value;
  }

  private getResponseError(value: SatelliteGeocodeResponse): { message: string } | null {
    if (this.getResponseStatus(value) !== 'error') {
      return null;
    }

    return {
      message: value.result?.error_message ?? value.result?.message ?? value.message ?? 'Request failed',
    };
  }
}
