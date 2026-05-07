import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { SatelliteFacilitiesResponse } from '../../shared/model/satellite-intel/satellite-intel-api.models';
import { OrionSatelliteFeature, OrionSatelliteFeatureType, PowerPlantByIdItem, PowerPlantsByIdsResponse, PowerPlantsSearchItem, PowerPlantsSearchResponse } from './model/satellite-intel.model';
import { AuthService } from '../../services/authetication/auth.service';
@Injectable({ providedIn: 'root' })
export class OrionSatelliteService {
  private readonly wriPath = 'assets/data/satellite/wri_power_plants.geojson';
  private wriCache$?: Observable<OrionSatelliteFeature[]>;
  private readonly facilitiesCache = new Map<string, Observable<OrionSatelliteFeature[]>>();

  constructor(private http: HttpClient, private api: ApiService, private auth: AuthService) {}

  async streamPowerPlants( size: number, onChunk: (items: OrionSatelliteFeature[]) => void, onComplete?: () => void, onError?: (error: any) => void ): Promise<void> {

    try {

      const response = await fetch(`/api/search/power-plants/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.auth.getStoredToken()}`
          },
          body: JSON.stringify({
            size
          })
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

        buffer += decoder.decode(value, {
          stream: true
        });

        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {

          if (!line.trim()) {
            continue;
          }

          const chunk = JSON.parse(line);

          const mapped = chunk
            .map((item: any) => this.toFeatureFromById({
              id: item.id,
              name: item.name,
              source: 'WRI',
              location: {
                lat: item.lat,
                lon: item.lon,
              },
            }))
            .filter((item: PowerPlantsSearchItem | null): item is PowerPlantsSearchItem => item !== null);

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
    }).pipe(map((response) => response?.result ?? response as any),
      map((result: any) => Array.isArray(result?.features) ? result.features : []),
      map((features: any[]) => features
        .map((feature, index) => this.toFacilityFeature(feature, index))
        .filter((feature): feature is OrionSatelliteFeature => feature !== null),),
      shareReplay(1),);

    this.facilitiesCache.set(cacheKey, request$);
    return request$;
  }

  filterByType(data: OrionSatelliteFeature[], type: string): OrionSatelliteFeature[] {
    return data.filter((feature) => feature.type === type);
  }

  private toPowerPlantFeature(item: { id?: string; _id?: string; name?: string; location?: { lat?: number; lon?: number }; location_point?: { lat?: number; lon?: number }; lat?: number; lon?: number }, index: number): OrionSatelliteFeature | null {
    const parsedLocation = this.extractLatLon(item);
    const lat = parsedLocation?.lat;
    const lon = parsedLocation?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

    return {
      id: item.id || item._id || `wri-${index}`,
      name: item.name?.trim() || `Power plant ${index + 1}`,
      type: 'other',
      rawType: 'unknown',
      source: 'WRI',
      coordinates: [lon as number, lat as number],
      color: this.getColor('other'),
      capacityMw: null,
      properties: {
        source: 'WRI',
      },
    };
  }

  toFeatureFromById(item: PowerPlantByIdItem): OrionSatelliteFeature | null {
    const parsedLocation = this.extractLatLon(item as any);
    const lat = parsedLocation?.lat;
    const lon = parsedLocation?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    const type = this.normalizeWriFuel(String(item?.type || '').trim().toLowerCase()) || 'other';
    return {
      id: item.id,
      name: String(item?.name || 'Power plant').trim(),
      type,
      rawType: String(item?.type || type),
      source: 'WRI',
      coordinates: [lon as number, lat as number],
      color: this.getColor(type),
      capacityMw: typeof item?.capacity === 'number' ? item.capacity : null,
      properties: {
        country: item?.country,
        fuel: item?.type,
        source: item?.source || 'WRI',
      },
    };
  }

  private extractPowerPlantItems(response: PowerPlantsSearchResponse | null | undefined): any[] {
    if (!response) {
      return [];
    }
    if (Array.isArray(response.Result)) {
      return response.Result;
    }
    if (Array.isArray(response.result)) {
      return response.result;
    }
    return [];
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
