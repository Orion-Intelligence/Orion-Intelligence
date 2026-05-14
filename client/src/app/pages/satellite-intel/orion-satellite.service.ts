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
  // private readonly wriPath = 'assets/data/satellite/wri_power_plants.geojson';
  // private wriCache$?: Observable<OrionSatelliteFeature[]>;
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
            .map((item: any, index: number) => this.toPowerPlantFeature(item, index))
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

  private toPowerPlantFeature(item: { id?: string; _id?: string; name?: string; type?: string; primary_fuel?: string; country?: string; capacity_mw?: number; source?: string; location?: { lat?: number; lon?: number }; location_point?: { lat?: number; lon?: number }; lat?: number; lon?: number }, index: number): OrionSatelliteFeature | null {
    const parsedLocation = this.extractLatLon(item);
    const lat = parsedLocation?.lat;
    const lon = parsedLocation?.lon;
    // Allow records without valid coordinates - still create feature but with null coordinates
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lon);
    
    const type = this.detectTypeFromRecord(item);
    const rawType = String(item?.type || item?.primary_fuel || '').trim();

    // Only return null if record has no identifying info at all
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
    // Allow records without valid coordinates
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

    // Priority 1: Direct power type field
    if (record?.type) {
      const detected = this.normalizeWriFuel(String(record.type));
      if (detected && detected !== 'other') {
        return detected;
      }
    }

    // Priority 2: Aeroway = airport/port facilities
    if (record?.aeroway) {
      const aeroway = String(record.aeroway).toLowerCase().trim();
      if (['aerodrome', 'airfield', 'airstrip', 'hangar', 'helipad', 'heliport', 'terminal'].includes(aeroway)) {
        return 'airport';
      }
    }

    // Priority 2.5: Explicit port/warehouse/industrial tags
    if (record?.port) {
      return 'port';
    }
    if (record?.harbour || record?.harbor) {
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

    // Priority 3: Military field
    if (record?.military) {
      const military = String(record.military).toLowerCase().trim();
      if (military && military !== 'no') {
        return 'military';
      }
    }

    // Priority 4: Landuse field
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

    // Priority 5: Building field for commercial/industrial
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

    // Priority 6: Man_made field
    if (record?.man_made) {
      if (['wind_farm', 'power_station', 'biogas_plant', 'heat_plant', 'solar_panels'].includes(manMade)) {
        return 'industrial';
      }
      if (['radar', 'military'].includes(manMade)) {
        return 'military';
      }
    }

    // Priority 7: Power field (plant vs substation)
    if (record?.power) {
      const power = String(record.power).toLowerCase().trim();
      if (power === 'plant') {
        return 'industrial';
      }
    }

    // Default fallback
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
