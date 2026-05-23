import { Injectable, signal } from '@angular/core';
import { defer, EMPTY, lastValueFrom, Observable, throwError, timer } from 'rxjs';
import { catchError, expand, switchMap, takeWhile, tap } from 'rxjs/operators';
import { SatelliteGeocodeResponse, SatelliteGeocodeResult } from '../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ApiService } from '../../../shared/services/api.service';

export type SatellitePollingOptions = {
  trackState?: boolean;
};

@Injectable({ providedIn: 'root' })
export class SatelliteIntelService {
  onError = signal<{ message: string } | null>(null);

  constructor(private api: ApiService) {}

  resetState(): void {
    this.onError.set(null);
  }

  createPolledRequest<T>( call: () => Observable<T>, getStatus: (value: T) => string | undefined, delayMs = 3000, options: SatellitePollingOptions = {}, ): Observable<T> {
    return defer(() => {
      const trackState = options.trackState === true;
      if (trackState) {
        this.onError.set(null);
      }

      return call().pipe(expand((value: T) => {
        if (this.isPendingOrBusy(getStatus(value))) {
          return timer(delayMs).pipe(switchMap(() => call()));
        }
        return EMPTY;
      }),
      takeWhile((value: T) => this.isPendingOrBusy(getStatus(value)), true),
      tap((value) => {
        const responseError = this.getResponseError(value);
        if (trackState && responseError) {
          this.onError.set(responseError);
          throw responseError;
        }
      }),
      catchError((error) => {
        const normalized = this.normalizeClientError(error);
        if (trackState) {
          this.onError.set(normalized);
        }
        return throwError(() => normalized);
      }),);
    });
  }

  isPendingResponse(value: any): boolean {
    return this.isPendingOrBusy(this.getResponseStatus(value));
  }

  getResponseResult(value: any): any {
    return value?.result !== undefined && value?.result !== null ? value.result : value;
  }

  async fetchGeocodeResults(query: string): Promise<SatelliteGeocodeResult[]> {
    const call = () => this.api.post<SatelliteGeocodeResponse>('satellite/geocode', { query });
    const response = await lastValueFrom(this.createPolledRequest(call, (value) => this.getResponseStatus(value), 2000));
    const responseError = this.getResponseError(response);
    if (responseError) {
      throw new Error(responseError.message);
    }
    return this.getResponseResult(response)?.results ?? [];
  }

  private isPendingOrBusy(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
  }

  private getResponseStatus(value: any): string | undefined {
    return value?.result?.status || value?.status;
  }

  private getResponseError(value: any): { message: string } | null {
    if (this.getResponseStatus(value) !== 'error') {
      return null;
    }

    return {
      message: value?.result?.error_message || value?.result?.message || value?.message || 'Request failed',
    };
  }

  private normalizeClientError(error: any): { message: string } {
    return {
      message: error?.error?.detail || error?.error?.message || error?.message || error?.statusText || 'Request failed',
    };
  }
}
