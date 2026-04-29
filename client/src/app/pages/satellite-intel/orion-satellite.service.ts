import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { SatelliteFacilitiesResponse } from '../../shared/model/satellite-intel/satellite-intel-api.models';
import { OrionSatelliteFeature, OrionSatelliteFeatureType, OrionSatelliteGeoJsonCollection } from './model/satellite-intel.model';

@Injectable({ providedIn: 'root' })
export class OrionSatelliteService {
  private readonly wriPath = 'assets/data/satellite/wri_power_plants.geojson';
  private wriCache$?: Observable<OrionSatelliteFeature[]>;
  private readonly facilitiesCache = new Map<string, Observable<OrionSatelliteFeature[]>>();

  constructor(private http: HttpClient, private api: ApiService) {}

  loadWRI(): Observable<OrionSatelliteFeature[]> {
    if (!this.wriCache$) {
      this.wriCache$ = this.http.get<OrionSatelliteGeoJsonCollection>(this.wriPath).pipe(map((collection) => Array.isArray(collection?.features) ? collection.features : []),
        map((features) => features
          .filter((feature) => Array.isArray(feature?.geometry?.coordinates) && feature.geometry.coordinates.length >= 2)
          .map((feature, index) => this.toWriFeature(feature, index))
          .filter((feature): feature is OrionSatelliteFeature => feature !== null),),
        shareReplay(1),);
    }

    return this.wriCache$;
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
    }).pipe(map((response) => response?.result ?? response as any),
      map((result: any) => Array.isArray(result?.features) ? result.features : []),
      map((features: any[]) => features
        .map((feature, index) => this.toFacilityFeature(feature, index))
        .filter((feature): feature is OrionSatelliteFeature => feature !== null),),
      shareReplay(1),);

    this.facilitiesCache.set(cacheKey, request$);
    return request$;
  }

  getMergedData(lat: number, lon: number, radiusKm = 5): Observable<OrionSatelliteFeature[]> {
    return combineLatest([
      this.loadWRI(),
      this.loadFacilities(lat, lon, radiusKm),
    ]).pipe(map(([wriData, facilitiesData]) => [...wriData, ...facilitiesData]));
  }

  filterByType(data: OrionSatelliteFeature[], type: string): OrionSatelliteFeature[] {
    return data.filter((feature) => feature.type === type);
  }

  private toWriFeature(feature: OrionSatelliteGeoJsonCollection['features'][number], index: number): OrionSatelliteFeature | null {
    const rawFuel = String(feature.properties?.primary_fuel || feature.properties?.fuel || '').trim().toLowerCase();
    const type = this.normalizeWriFuel(rawFuel);
    if (!type) {
      return null;
    }

    const [lon, lat] = feature.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    return {
      id: `wri-${index}`,
      name: feature.properties?.name?.trim() || `Power plant ${index + 1}`,
      type,
      rawType: rawFuel || type,
      source: 'WRI',
      coordinates: [lon, lat],
      color: this.getColor(type),
      capacityMw: typeof feature.properties?.capacity_mw === 'number' ? feature.properties.capacity_mw : null,
      properties: {
        ...feature.properties,
      },
    };
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
    switch (rawFuel) {
      case 'hydro':
      case 'nuclear':
      case 'coal':
      case 'oil':
      case 'gas':
      case 'solar':
      case 'wind':
        return rawFuel;
      case 'petcoke':
        return 'coal';
      case 'cogeneration':
      case 'biomass':
      case 'geothermal':
      case 'other':
      case 'storage':
      case 'waste':
      case 'wave and tidal':
        return 'other';
      default:
        return rawFuel ? 'other' : null;
    }
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
      case 'nuclear':
        return '#dc2626';
      case 'coal':
        return '#111827';
      case 'oil':
        return '#f97316';
      case 'gas':
      case 'industrial':
      case 'other':
        return '#6b7280';
      case 'solar':
        return '#facc15';
      case 'wind':
        return '#16a34a';
      case 'airport':
        return '#9333ea';
      case 'port':
        return '#0d9488';
      case 'warehouse':
        return '#92400e';
      default:
        return '#6b7280';
    }
  }
}
