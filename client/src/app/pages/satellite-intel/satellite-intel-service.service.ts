import { Injectable, signal } from '@angular/core';
import { EMPTY, lastValueFrom, Observable, Subject, Subscription, timer } from 'rxjs';
import { expand, finalize, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { SatelliteGeocodeResponse, SatelliteFacilitiesResponse, SatelliteSentinelSearchResponse, SatelliteSentinelImageResponse, SatelliteAnomalyResponse, SatelliteCompareResponse, SatelliteLiveAircraftBBoxResponse, SatelliteLiveShipsBBoxResponse, } from '../../shared/model/satellite-intel/satellite-intel-api.models';

@Injectable({ providedIn: 'root' })
export class SatelliteIntelService {
  private currentCancel$?: Subject<boolean> = undefined;

  progress  = signal(0);
  isRunning = signal(false);
  onDone    = signal<any>(null);
  onError   = signal<any>(null);

  constructor(private api: ApiService) {}

  resetState(): void {
    console.log("Ali bhai 00")
    this.currentCancel$ = undefined;
    this.progress.set(0);
    this.isRunning.set(false);
    this.onDone.set(null);
    this.onError.set(null);
  }

  cancelCurrentScan(): void {
    if (this.currentCancel$) {
      this.currentCancel$.next(true);
      this.currentCancel$.complete();
      this.resetState();
      this.onError.set({ message: 'Cancelled by user' });
    }
  }

  private isPendingOrBusy(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
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

  private normalizeClientError(err: any): { message: string } {
    const detail = err?.error?.detail;
    const message = err?.error?.message;
    const fallback = err?.message || err?.statusText || 'Request failed';
    return { message: detail || message || fallback };
  }

  private poll<T>( call: () => Observable<T>, getStatus: (v: T) => string | undefined, onEach: (v: T) => void, cancel$: Subject<boolean>, delayMs: number, ): Observable<T> {
    const request$ = call().pipe(tap(onEach));
    return request$.pipe(expand((v: T) => {
      const status = getStatus(v);
      if (this.isPendingOrBusy(status)) {
        return timer(delayMs).pipe(switchMap(() => call().pipe(tap(onEach))));
      }
      return EMPTY;
    }),
    takeWhile((v: T) => this.isPendingOrBusy(getStatus(v)), true),
    takeUntil(cancel$),);
  }

  private createPolledRequest<T>(call: () => Observable<T>, getStatus: (v: T) => string | undefined, delayMs: number): Observable<T> {
    return new Observable<T>((observer) => {
      const cancel$ = new Subject<boolean>();
      const sub = this.poll<T>(call, getStatus, () => {}, cancel$, delayMs).subscribe(observer);

      return () => {
        if (!cancel$.closed) {
          cancel$.next(true);
          cancel$.complete();
        }
        sub.unsubscribe();
      };
    });
  }

  private runTask<T>(build: (cancel$: Subject<boolean>) => Observable<T>): Subscription {
    console.log("Ali bhai 01")
    this.progress.set(0);
    this.isRunning.set(true);
    this.onDone.set(null);
    this.onError.set(null);

    const cancel$ = new Subject<boolean>();
    this.currentCancel$ = cancel$;

    const obs$ = build(cancel$).pipe(finalize(() => {
      console.log("Ali bhai 02")
      this.progress.set(100);
      this.isRunning.set(false);
      this.currentCancel$ = undefined;
    }),);

    const sub = new Subscription();
    sub.add(obs$.subscribe({
      next: (value) => {
        const responseError = this.getResponseError(value);
        if (responseError) {
          this.onDone.set(null);
          this.onError.set(responseError);
          return;
        }
        this.onDone.set(value);
      },
      error: (err) => {
        this.onDone.set(null);
        this.onError.set(this.normalizeClientError(err));
      },
      complete: () => {
        console.log("Ali bhai 03")
        this.isRunning.set(false);
        if (this.currentCancel$ === cancel$) {
          this.currentCancel$ = undefined;
        }
      },
    }));
    sub.add(() => {
      if (!cancel$.closed) {
        cancel$.next(true);
        cancel$.complete();
      }
      console.log("Ali bhai 04")
      this.isRunning.set(false);
      if (this.currentCancel$ === cancel$) {
        this.currentCancel$ = undefined;
      }
    });

    return sub;
  }

  geocode(query: string): Subscription {
    const call      = () => this.api.post<SatelliteGeocodeResponse>('satellite/geocode', { query });
    const getStatus = (res: SatelliteGeocodeResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteGeocodeResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<SatelliteGeocodeResponse>(call, getStatus, enhanced, cancel$, 2000);
    return this.runTask<SatelliteGeocodeResponse>(build);
  }

  fetchFacilities(lat: number, lon: number, radius_km = 5): Subscription {
    const call      = () => this.api.post<SatelliteFacilitiesResponse>('satellite/facilities', { lat, lon, radius_km });
    const getStatus = (res: SatelliteFacilitiesResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteFacilitiesResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<SatelliteFacilitiesResponse>(call, getStatus, enhanced, cancel$, 3000);
    return this.runTask<SatelliteFacilitiesResponse>(build);
  }

  searchSentinel(lat: number, lon: number, delta = 0.05): Subscription {
    const call      = () => this.api.post<SatelliteSentinelSearchResponse>('satellite/sentinel/search', { lat, lon, delta });
    const getStatus = (res: SatelliteSentinelSearchResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteSentinelSearchResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<SatelliteSentinelSearchResponse>(call, getStatus, enhanced, cancel$, 3000);
    return this.runTask<SatelliteSentinelSearchResponse>(build);
  }

  fetchSentinelImage(lat: number, lon: number, delta = 0.05, image_type = 'true_colour', month?: string, size = 512): Subscription {
    const payload: Record<string, any> = { lat, lon, delta, image_type, size };
    if (month?.trim()) {
      payload['month'] = month.trim();
    }
    const call      = () => this.api.post<SatelliteSentinelImageResponse>('satellite/sentinel/image', payload);
    const getStatus = (res: SatelliteSentinelImageResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteSentinelImageResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<SatelliteSentinelImageResponse>(call, getStatus, enhanced, cancel$, 3000);
    return this.runTask<SatelliteSentinelImageResponse>(build);
  }

  runAnomalyScan(lat: number, lon: number, delta = 0.05, sh_client_id?: string, sh_client_secret?: string): Subscription {
    const payload: Record<string, any> = { lat, lon, delta };
    if (sh_client_id)     {
      payload['sh_client_id']     = sh_client_id;
    }
    if (sh_client_secret) {
      payload['sh_client_secret'] = sh_client_secret;
    }
    const call      = () => this.api.post<SatelliteAnomalyResponse>('satellite/anomaly', payload);
    const getStatus = (res: SatelliteAnomalyResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteAnomalyResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<SatelliteAnomalyResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<SatelliteAnomalyResponse>(build);
  }

  runCompare(lat: number, lon: number, delta = 0.05, image_type = 'true_colour'): Subscription {
    const call      = () => this.api.post<SatelliteCompareResponse>('satellite/compare', { lat, lon, delta, image_type });
    const getStatus = (res: SatelliteCompareResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteCompareResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<SatelliteCompareResponse>(call, getStatus, enhanced, cancel$, 3000);
    return this.runTask<SatelliteCompareResponse>(build);
  }

  async fetchGeocodeOnce(query: string): Promise<any> {
    const cancel$ = new Subject<boolean>();
    const call      = () => this.api.post<SatelliteGeocodeResponse>('satellite/geocode', { query });
    const getStatus = (res: SatelliteGeocodeResponse) => (res?.result?.status || res?.status) as any;
    try {
      const response = await lastValueFrom(this.poll<SatelliteGeocodeResponse>(call, getStatus, () => {}, cancel$, 2000),);
      const responseError = this.getResponseError(response);
      if (responseError) {
        throw new Error(responseError.message);
      }
      // Backend wraps as { result: { status, results: [...] } }
      // Return the inner result object so callers can access .results
      return response?.result ?? response;
    }
    finally {
      cancel$.next(true);
      cancel$.complete();
    }
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
    return value > 0 && value <= 2;
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
      return 'Enter coordinates as: latitude, longitude — e.g. 31.48, 74.17';
    }
    return null;
  }

  validateSearchInput(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.length < 2) {
      return 'Enter at least 2 characters';
    }
    return null;
  }

  validateDeltaInput(value: number): string | null {
    if (value <= 0 || value > 2) {
      return 'Delta must be between 0.001 and 2';
    }
    return null;
  }

  fetchAircraftInBounds( lat: number, lon: number, delta = 0.05, openskyClientId?: string, openskyClientSecret?: string, ): Observable<SatelliteLiveAircraftBBoxResponse> {
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

    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft/bbox', payload);
  }

  pollAircraftInBounds(lat: number, lon: number, delta = 0.05, openskyClientId?: string, openskyClientSecret?: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.createPolledRequest(() => this.fetchAircraftInBounds(lat, lon, delta, openskyClientId, openskyClientSecret), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchShipsInBounds( lat: number, lon: number, delta = 0.05, aisstreamApiKey?: string, ): Observable<SatelliteLiveShipsBBoxResponse> {
    const payload: Record<string, any> = {
      lat_min: lat - delta,
      lat_max: lat + delta,
      lon_min: lon - delta,
      lon_max: lon + delta,
    };

    if (aisstreamApiKey?.trim()) {
      payload['aisstream_api_key'] = aisstreamApiKey.trim();
    }

    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships/bbox', payload);
  }

  pollShipsInBounds(lat: number, lon: number, delta = 0.05, aisstreamApiKey?: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.createPolledRequest(() => this.fetchShipsInBounds(lat, lon, delta, aisstreamApiKey), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchAircraftGlobal( openskyClientId?: string, openskyClientSecret?: string, ): Observable<SatelliteLiveAircraftBBoxResponse> {
    // Query entire world: lat range [-90, 90], lon range [-180, 180]
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

    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft/bbox', payload);
  }

  pollAircraftGlobal(openskyClientId?: string, openskyClientSecret?: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.createPolledRequest(() => this.fetchAircraftGlobal(openskyClientId, openskyClientSecret), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchShipsGlobal( aisstreamApiKey?: string, ): Observable<SatelliteLiveShipsBBoxResponse> {
    // Query entire world: lat range [-90, 90], lon range [-180, 180]
    const payload: Record<string, any> = {
      lat_min: -90,
      lat_max: 90,
      lon_min: -180,
      lon_max: 180,
    };

    if (aisstreamApiKey?.trim()) {
      payload['aisstream_api_key'] = aisstreamApiKey.trim();
    }

    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships/bbox', payload);
  }

  pollShipsGlobal(aisstreamApiKey?: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.createPolledRequest(() => this.fetchShipsGlobal(aisstreamApiKey), (res) => (res?.result?.status || res?.status) as any, 3000);
  }
}
