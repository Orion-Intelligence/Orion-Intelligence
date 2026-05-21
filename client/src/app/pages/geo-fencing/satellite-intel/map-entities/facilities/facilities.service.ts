import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteFacilitiesResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { AuthService } from '../../../../../services/authetication/auth.service';
import { MapEntitiesByIdsResponse, OrionSatelliteFeature, OrionSatelliteFeatureType } from '../../../models/geo-fencing.models';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class SatelliteFacilitiesService {
  constructor(private api: ApiService, private auth: AuthService, private satelliteIntelService: SatelliteIntelService) {}

  fetchNearby(lat: number, lon: number, radiusKm = 5): Observable<SatelliteFacilitiesResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.api.post<SatelliteFacilitiesResponse>('satellite/facilities', { lat, lon, radius_km: radiusKm }), (res) => this.getPollStatus(res));
  }

  toMapFeatures(result: SatelliteFacilitiesResponse['result'] | null | undefined): OrionSatelliteFeature[] {
    const features = Array.isArray(result?.features) ? result.features : [];
    return features
      .map((feature, index) => this.toFeature(feature, index))
      .filter((feature): feature is OrionSatelliteFeature => feature !== null);
  }

  getTypeEntries(data: SatelliteFacilitiesResponse['result'] | null): [string, number][] {
    return Object.entries(data?.type_counts || {}).sort((a, b) => b[1] - a[1]) as [string, number][];
  }

  async streamMapEntities(size: number, onChunk: (items: OrionSatelliteFeature[]) => void, onComplete?: () => void, onError?: (error: any) => void): Promise<void> {
    try {
      const response = await fetch('/api/search/map-entities/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.auth.getStoredToken()}`,
        },
        body: JSON.stringify({ size }),
      });

      if (!response.body) {
        onError?.(new Error('No response body'));
        return;
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
            .map((item: any, index: number) => this.toStreamedMapEntityFeature(item, index))
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

  getMapEntitiesByIds(ids: string[]): Observable<MapEntitiesByIdsResponse> {
    return this.api.post<MapEntitiesByIdsResponse>('search/map-entities/by-ids', ids);
  }

  private getPollStatus(res: SatelliteFacilitiesResponse): string | undefined {
    return res?.result?.status || res?.status;
  }

  private toFeature(feature: any, index: number): OrionSatelliteFeature | null {
    const coordinates = this.extractCoordinates(feature?.geometry);
    if (!coordinates) {
      return null;
    }

    const rawKind = String(feature?.properties?.kind || feature?.properties?.type || '').trim().toLowerCase();
    const type = this.normalizeType(rawKind);

    return {
      id: `osm-${feature?.properties?.osm_id ?? index}`,
      name: String(feature?.properties?.name || '').trim() || this.defaultLabel(type),
      type,
      rawType: rawKind || type,
      source: 'OSM',
      coordinates,
      color: this.getNearbyFacilityColor(type),
      capacityMw: null,
      properties: {
        ...(feature?.properties || {}),
      },
    };
  }

  private normalizeType(rawKind: string): OrionSatelliteFeatureType {
    const value = rawKind.toLowerCase().trim();
    switch (value) {
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
        return value ? 'other' : 'other';
    }
  }

  private extractCoordinates(geometry: any): [number, number] | null {
    const coords = geometry?.coordinates;
    if (!Array.isArray(coords)) {
      return null;
    }
    if (geometry?.type === 'Point' && Number.isFinite(coords[0]) && Number.isFinite(coords[1])) {
      return [coords[0], coords[1]];
    }
    if (geometry?.type === 'Polygon' && Array.isArray(coords[0]?.[0])) {
      return this.averageCoordinates(coords[0]);
    }
    if (geometry?.type === 'MultiPolygon' && Array.isArray(coords[0]?.[0]?.[0])) {
      return this.averageCoordinates(coords[0][0]);
    }
    return null;
  }

  private averageCoordinates(points: any[]): [number, number] | null {
    const valid = points.filter((point) => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]));
    if (!valid.length) {
      return null;
    }
    const total = valid.reduce((sum, point) => ({ lon: sum.lon + point[0], lat: sum.lat + point[1] }), { lon: 0, lat: 0 });
    return [total.lon / valid.length, total.lat / valid.length];
  }

  private defaultLabel(type: OrionSatelliteFeatureType): string {
    return type.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private toStreamedMapEntityFeature(item: { id?: string; _id?: string; name?: string; type?: string; primary_fuel?: string; country?: string; capacity_mw?: number; source?: string; location?: { lat?: number; lon?: number }; location_point?: { lat?: number; lon?: number }; lat?: number; lon?: number }, index: number): OrionSatelliteFeature | null {
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
      color: this.getStreamedMapEntityColor(type),
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

  private extractLatLon(item: any): { lat: number; lon: number } | null {
    const lat = item?.location?.lat ?? item?.location_point?.lat ?? item?.lat;
    const lon = item?.location?.lon ?? item?.location_point?.lon ?? item?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    return { lat, lon };
  }

  private detectTypeFromRecord(record: any): OrionSatelliteFeatureType {
    const landuse = String(record?.landuse || '').toLowerCase().trim();
    const building = String(record?.building || '').toLowerCase().trim();
    const manMade = String(record?.man_made || '').toLowerCase().trim();

    if (record?.type) {
      const detected = this.normalizeType(String(record.type));
      if (detected !== 'other') {
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

  private getNearbyFacilityColor(type: OrionSatelliteFeatureType): string {
    const colors: Record<OrionSatelliteFeatureType, string> = {
      airport: '#38bdf8',
      port: '#60a5fa',
      warehouse: '#a78bfa',
      industrial: '#f59e0b',
      military: '#ef4444',
      solar: '#facc15',
      wind: '#22c55e',
      hydro: '#0ea5e9',
      gas: '#fb7185',
      coal: '#78716c',
      oil: '#f97316',
      nuclear: '#c084fc',
      geothermal: '#fb923c',
      biomass: '#84cc16',
      waste: '#94a3b8',
      storage: '#2dd4bf',
      cogeneration: '#f43f5e',
      petcoke: '#57534e',
      wave_and_tidal: '#06b6d4',
      other: '#64748b',
    };
    return colors[type] || colors.other;
  }

  private getStreamedMapEntityColor(type: OrionSatelliteFeatureType): string {
    const colors: Record<OrionSatelliteFeatureType, string> = {
      hydro: '#2563eb',
      solar: '#facc15',
      wind: '#16a34a',
      gas: '#f59e0b',
      coal: '#111827',
      oil: '#f97316',
      nuclear: '#dc2626',
      geothermal: '#ec4899',
      biomass: '#84cc16',
      waste: '#8b5cf6',
      storage: '#06b6d4',
      cogeneration: '#14b8a6',
      petcoke: '#78716c',
      wave_and_tidal: '#0ea5e9',
      airport: '#9333ea',
      port: '#0d9488',
      warehouse: '#92400e',
      industrial: '#6b7280',
      military: '#d71c1c',
      other: '#a3a3a3',
    };
    return colors[type] || colors.other;
  }
}
