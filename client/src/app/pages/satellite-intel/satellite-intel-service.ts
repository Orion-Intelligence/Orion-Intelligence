import { Injectable, signal } from '@angular/core';
import { EMPTY, lastValueFrom, Observable, Subject, timer } from 'rxjs';
import { expand, finalize, map, shareReplay, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { SatelliteGeocodeResponse, SatelliteFacilitiesResponse, SatelliteSentinelSearchResponse, SatelliteSentinelImageResponse, SatelliteAnomalyResponse, SatelliteCompareResponse, SatelliteLiveAircraftBBoxResponse, SatelliteLiveShipsBBoxResponse, } from '../../shared/model/satellite-intel/satellite-intel-api.models';
import { AuthService } from '../../services/authetication/auth.service';
import { OrionSatelliteFeature, OrionSatelliteFeatureType, PowerPlantByIdItem, PowerPlantsByIdsResponse } from './model/satellite-intel.model';

@Injectable({ providedIn: 'root' })
export class SatelliteIntelService {
  private currentCancel$?: Subject<boolean> = undefined;
  private readonly facilitiesCache = new Map<string, Observable<OrionSatelliteFeature[]>>();

  progress  = signal(0);
  isRunning = signal(false);
  onDone    = signal<any>(null);
  onError   = signal<any>(null);

  constructor(private api: ApiService, private auth: AuthService) {}

  resetState(): void {
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

  private runTask<T>(build: (cancel$: Subject<boolean>) => Observable<T>): Observable<T> {
    return new Observable<T>((observer) => {

      this.progress.set(0);
      this.isRunning.set(true);
      this.onDone.set(null);
      this.onError.set(null);

      const cancel$ = new Subject<boolean>();
      this.currentCancel$ = cancel$;

      const sub = build(cancel$)
        .pipe(finalize(() => {
          this.progress.set(100);
          this.isRunning.set(false);
          this.currentCancel$ = undefined;
        }))
        .subscribe({
          next: (value) => {
            const responseError = this.getResponseError(value);
            if (responseError) {
              this.onError.set(responseError);
              observer.error(responseError); // 🔥 important
              return;
            }

            this.onDone.set(value);
            observer.next(value); // 🔥 pass to component
          },
          error: (err) => {
            const normalized = this.normalizeClientError(err);
            this.onError.set(normalized);
            observer.error(normalized);
          },
          complete: () => {
            observer.complete(); // 🔥 now component knows it's done
          },
        });

      return () => {
        if (!cancel$.closed) {
          cancel$.next(true);
          cancel$.complete();
        }
        sub.unsubscribe();
        this.isRunning.set(false);
        if (this.currentCancel$ === cancel$) {
          this.currentCancel$ = undefined;
        }
      };
    });
  }

  fetchFacilities(lat: number, lon: number, radius_km = 5): Observable<SatelliteFacilitiesResponse> {
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
    // return this.runTask<SatelliteFacilitiesResponse>(build);
    return this.runTask<SatelliteFacilitiesResponse>(build);
  }

  async streamPowerPlants(size: number, onChunk: (items: OrionSatelliteFeature[]) => void, onComplete?: () => void, onError?: (error: any) => void): Promise<void> {
    try {
      const response = await fetch('/api/search/power-plants/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.auth.getStoredToken()}`,
        },
        body: JSON.stringify({ size }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }

          const chunk = JSON.parse(line);
          const mapped = chunk
            .map((item: any, index: number) => this.toPowerPlantFeature(item, index))
            .filter((item: OrionSatelliteFeature | null): item is OrionSatelliteFeature => item !== null);

          onChunk(mapped);
        }
      }

      onComplete?.();
    }
    catch (error) {
      onError?.(error);
    }
  }

  getPowerPlantsByIds(ids: string[]): Observable<PowerPlantsByIdsResponse> {
    return this.api.post<PowerPlantsByIdsResponse>('search/power-plants/by-ids', ids);
  }

  loadFacilities(lat: number, lon: number, radiusKm = 5): Observable<OrionSatelliteFeature[]> {
    const cacheKey = `${lat.toFixed(3)}:${lon.toFixed(3)}:${radiusKm.toFixed(2)}`;
    const cached = this.facilitiesCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.api.post<SatelliteFacilitiesResponse>('satellite/facilities', {
      lat,
      lon,
      radius_km: radiusKm,
    }).pipe(
      map((response) => response?.result ?? response as any),
      map((result: any) => Array.isArray(result?.features) ? result.features : []),
      map((features: any[]) => features
        .map((feature, index) => this.toFacilityFeature(feature, index))
        .filter((feature): feature is OrionSatelliteFeature => feature !== null)),
      shareReplay(1),
    );

    this.facilitiesCache.set(cacheKey, request$);
    return request$;
  }

  filterByType(data: OrionSatelliteFeature[], type: string): OrionSatelliteFeature[] {
    return data.filter((feature) => feature.type === type);
  }

  searchSentinel(lat: number, lon: number, delta = 0.05): Observable<SatelliteSentinelSearchResponse> {
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

  fetchSentinelImage(lat: number, lon: number, delta = 0.05, image_type = 'true_colour', month?: string, size = 512): Observable<SatelliteSentinelImageResponse> {
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

  runAnomalyScan(lat: number, lon: number, delta = 0.05, sh_client_id?: string, sh_client_secret?: string): Observable<SatelliteAnomalyResponse> {
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

  runCompare(lat: number, lon: number, delta = 0.05, image_type = 'true_colour'): Observable<SatelliteCompareResponse> {
    const call      = () => this.api.post<SatelliteCompareResponse>('satellite/compare', { lat, lon, delta, image_type });
    const getStatus = (res: SatelliteCompareResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: SatelliteCompareResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) => this.poll<SatelliteCompareResponse>(call, getStatus, enhanced, cancel$, 3000);
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

    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft', payload);
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

    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships', payload);
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

    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft', payload);
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

    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships', payload);
  }

  pollShipsGlobal(aisstreamApiKey?: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.createPolledRequest(() => this.fetchShipsGlobal(aisstreamApiKey), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchAircraftByICAO(icao: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.api.post<SatelliteLiveAircraftBBoxResponse>('satellite/livetrack/aircraft/icao', { icao24: icao });
  }

  pollAircraftByICAO(icao: string): Observable<SatelliteLiveAircraftBBoxResponse> {
    return this.createPolledRequest(() => this.fetchAircraftByICAO(icao), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchAircraftTrack(icao: string): Observable<any> {
    return this.api.post<any>('satellite/livetrack/aircraft/track', { icao24: icao });
  }

  pollAircraftTrack(icao: string): Observable<any> {
    return this.createPolledRequest(() => this.fetchAircraftTrack(icao), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchShipByMMSI(mmsi: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.api.post<SatelliteLiveShipsBBoxResponse>('satellite/livetrack/ships/mmsi', { mmsi: mmsi });
  }

  pollShipByMMSI(mmsi: string): Observable<SatelliteLiveShipsBBoxResponse> {
    return this.createPolledRequest(() => this.fetchShipByMMSI(mmsi), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  fetchLivetrackStatus(): Observable<any> {
    return this.api.post<any>('satellite/livetrack/status', {});
  }

  pollLivetrackStatus(): Observable<any> {
    return this.createPolledRequest(() => this.fetchLivetrackStatus(), (res) => (res?.result?.status || res?.status) as any, 3000);
  }

  private toPowerPlantFeature(item: { id?: string; _id?: string; name?: string; type?: string; primary_fuel?: string; country?: string; capacity_mw?: number; source?: string; location?: { lat?: number; lon?: number }; location_point?: { lat?: number; lon?: number }; lat?: number; lon?: number }, index: number): OrionSatelliteFeature | null {
    const parsedLocation = this.extractLatLon(item);
    const lat = parsedLocation?.lat;
    const lon = parsedLocation?.lon;
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lon);
    const type = this.detectTypeFromRecord(item);
    const rawType = String(item?.type || item?.primary_fuel || '').trim();

    if (!item.id && !item._id && !item.name) {
      return null;
    }

    return {
      id: item.id || item._id || `wri-${index}`,
      name: item.name?.trim() || `Facility ${index + 1}`,
      type,
      rawType: rawType || type,
      source: 'WRI',
      coordinates: hasValidCoords ? [lon as number, lat as number] : [0, 0],
      color: this.getColor(type),
      capacityMw: typeof item?.capacity_mw === 'number' ? item.capacity_mw : null,
      properties: {
        source: 'WRI',
        country: item?.country,
        type: item?.type,
        capacity_mw: item?.capacity_mw,
        hasValidCoordinates: hasValidCoords,
      },
    };
  }

  toFeatureFromById(item: PowerPlantByIdItem): OrionSatelliteFeature | null {
    const parsedLocation = this.extractLatLon(item as any);
    const lat = parsedLocation?.lat;
    const lon = parsedLocation?.lon;
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lon);
    const type = this.detectTypeFromRecord(item);

    return {
      id: item.id,
      name: String(item?.name || 'Facility').trim(),
      type,
      rawType: String(item?.type || type),
      source: 'WRI',
      coordinates: hasValidCoords ? [lon as number, lat as number] : [0, 0],
      color: this.getColor(type),
      capacityMw: typeof item?.capacity === 'number' ? item.capacity : null,
      properties: {
        country: item?.country,
        fuel: item?.type,
        source: item?.source || 'WRI',
        hasValidCoordinates: hasValidCoords,
      },
    };
  }

  private extractLatLon(item: any): { lat: number; lon: number } | null {
    const lat = item?.location?.lat ?? item?.location_point?.lat ?? item?.lat;
    const lon = item?.location?.lon ?? item?.location_point?.lon ?? item?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    return { lat, lon };
  }

  private toFacilityFeature(feature: any, index: number): OrionSatelliteFeature | null {
    const coordinates = this.extractCoordinates(feature?.geometry);
    if (!coordinates) {
      return null;
    }

    const rawKind = String(feature?.properties?.kind || feature?.properties?.type || '').trim().toLowerCase();
    const type = this.normalizeFacilityType(rawKind);

    return {
      id: `osm-${feature?.properties?.osm_id ?? index}`,
      name: String(feature?.properties?.name || '').trim() || this.defaultFacilityLabel(type),
      type,
      rawType: rawKind || type,
      source: 'OSM',
      coordinates,
      color: this.getColor(type),
      capacityMw: null,
      properties: {
        ...(feature?.properties || {}),
      },
    };
  }

  private normalizeWriFuel(rawFuel: string): OrionSatelliteFeatureType | null {
    const lower = rawFuel.toLowerCase().trim();
    switch (lower) {
      case 'airport':
      case 'aerodrome':
      case 'airfield':
      case 'heliport':
        return 'airport';
      case 'port':
      case 'harbour':
      case 'harbor':
      case 'seaport':
      case 'dock':
      case 'marina':
        return 'port';
      case 'warehouse':
      case 'depot':
      case 'storage_depot':
        return 'warehouse';
      case 'industrial':
      case 'industry':
      case 'factory':
        return 'industrial';
      case 'military':
      case 'barracks':
      case 'military_base':
        return 'military';
      case 'hydro':
      case 'hydroelectric':
      case 'hydropower':
        return 'hydro';
      case 'solar':
      case 'photovoltaic':
      case 'pv':
        return 'solar';
      case 'wind':
      case 'wind_turbine':
      case 'windfarm':
        return 'wind';
      case 'gas':
      case 'natural_gas':
      case 'lng':
      case 'cng':
        return 'gas';
      case 'coal':
      case 'lignite':
        return 'coal';
      case 'oil':
      case 'diesel':
      case 'petroleum':
      case 'fuel_oil':
        return 'oil';
      case 'nuclear':
      case 'atomic':
        return 'nuclear';
      case 'geothermal':
      case 'geotherm':
        return 'geothermal';
      case 'biomass':
      case 'biogas':
      case 'wood':
      case 'bagasse':
        return 'biomass';
      case 'waste':
      case 'waste_to_energy':
      case 'landfill_gas':
        return 'waste';
      case 'storage':
      case 'battery':
      case 'pumped_hydro':
        return 'storage';
      case 'cogeneration':
      case 'chp':
      case 'combined_heat_power':
        return 'cogeneration';
      case 'petcoke':
        return 'petcoke';
      case 'wave and tidal':
      case 'wave':
      case 'tidal':
      case 'tidal_stream':
        return 'wave_and_tidal';
      case 'other':
        return 'other';
      default:
        return lower ? 'other' : null;
    }
  }

  private detectTypeFromRecord(record: any): OrionSatelliteFeatureType {
    const landuse = String(record?.landuse || '').toLowerCase().trim();
    const building = String(record?.building || '').toLowerCase().trim();
    const manMade = String(record?.man_made || '').toLowerCase().trim();

    if (record?.type) {
      const detected = this.normalizeWriFuel(String(record.type));
      if (detected && detected !== 'other') {
        return detected;
      }
    }

    if (record?.aeroway) {
      const aeroway = String(record.aeroway).toLowerCase().trim();
      if (['aerodrome', 'airfield', 'airstrip', 'hangar', 'helipad', 'heliport', 'terminal'].includes(aeroway)) {
        return 'airport';
      }
    }

    if (record?.port || record?.harbour || record?.harbor) {
      return 'port';
    }
    if (['port', 'harbour', 'harbor', 'dock', 'marina'].includes(landuse)) {
      return 'port';
    }
    if (['port', 'harbour', 'harbor', 'dock', 'pier', 'quay', 'jetty', 'wharf', 'shipyard'].includes(building)) {
      return 'port';
    }
    if (['pier', 'quay', 'wharf', 'jetty', 'breakwater', 'dock', 'dolphin'].includes(manMade)) {
      return 'port';
    }

    if (record?.military) {
      const military = String(record.military).toLowerCase().trim();
      if (military && military !== 'no') {
        return 'military';
      }
    }

    if (record?.landuse) {
      if (landuse === 'industrial' || landuse === 'power' || landuse === 'brownfield' || landuse === 'quarry') {
        return 'industrial';
      }
      if (['port', 'harbour', 'harbor', 'dock'].includes(landuse)) {
        return 'port';
      }
      if (['warehouse', 'logistics', 'depot'].includes(landuse)) {
        return 'warehouse';
      }
      if (landuse === 'windfarm') {
        return 'wind';
      }
      if (landuse === 'aeroway' || landuse === 'airport') {
        return 'airport';
      }
    }

    if (record?.building) {
      if (['warehouse', 'storage', 'depot'].includes(building)) {
        return 'warehouse';
      }
      if (['industrial', 'factory', 'power_plant', 'power_station', 'electricity'].includes(building)) {
        return 'industrial';
      }
      if (['airport_terminal', 'terminal', 'hangar'].includes(building)) {
        return 'airport';
      }
      if (building === 'military base' || building === 'barrack' || building === 'barracks' || building === 'bunker') {
        return 'military';
      }
    }

    if (record?.man_made) {
      if (['wind_farm', 'power_station', 'biogas_plant', 'heat_plant', 'solar_panels'].includes(manMade)) {
        return 'industrial';
      }
      if (['radar', 'military'].includes(manMade)) {
        return 'military';
      }
    }

    if (record?.power) {
      const power = String(record.power).toLowerCase().trim();
      if (power === 'plant') {
        return 'industrial';
      }
    }

    return 'other';
  }

  private normalizeFacilityType(rawKind: string): OrionSatelliteFeatureType {
    if ([ 'airport', 'aerodrome', 'hangar', 'terminal' ].includes(rawKind)) {
      return 'airport';
    }
    if ([ 'port', 'dock', 'pier', 'boatyard', 'crane', 'breakwater', 'harbour', 'harbor', 'marina' ].includes(rawKind)) {
      return 'port';
    }
    if ([ 'warehouse', 'depot', 'logistics' ].includes(rawKind)) {
      return 'warehouse';
    }
    return 'industrial';
  }

  private extractCoordinates(geometry: any): [number, number] | null {
    if (!geometry) {
      return null;
    }

    if (geometry.type === 'Point' && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
      const [lon, lat] = geometry.coordinates;
      return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
    }

    if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0]?.[0])) {
      const [lon, lat] = geometry.coordinates[0][0];
      return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
    }

    if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates?.[0])) {
      const [lon, lat] = geometry.coordinates[0];
      return Number.isFinite(lat) && Number.isFinite(lon) ? [lon, lat] : null;
    }

    return null;
  }

  private defaultFacilityLabel(type: OrionSatelliteFeatureType): string {
    switch (type) {
      case 'airport':
        return 'Unnamed airport';
      case 'port':
        return 'Unnamed port';
      case 'warehouse':
        return 'Unnamed warehouse';
      default:
        return 'Unnamed industrial facility';
    }
  }

  private getColor(type: OrionSatelliteFeatureType): string {
    switch (type) {
      case 'hydro':
        return '#2563eb';
      case 'solar':
        return '#facc15';
      case 'wind':
        return '#16a34a';
      case 'gas':
        return '#f59e0b';
      case 'coal':
        return '#111827';
      case 'oil':
        return '#f97316';
      case 'nuclear':
        return '#dc2626';
      case 'geothermal':
        return '#ec4899';
      case 'biomass':
        return '#84cc16';
      case 'waste':
        return '#8b5cf6';
      case 'storage':
        return '#06b6d4';
      case 'cogeneration':
        return '#14b8a6';
      case 'petcoke':
        return '#78716c';
      case 'wave_and_tidal':
        return '#0ea5e9';
      case 'airport':
        return '#9333ea';
      case 'port':
        return '#0d9488';
      case 'warehouse':
        return '#92400e';
      case 'industrial':
        return '#6b7280';
      case 'military':
        return '#d71c1c';
      case 'other':
      default:
        return '#a3a3a3';
    }
  }
}
