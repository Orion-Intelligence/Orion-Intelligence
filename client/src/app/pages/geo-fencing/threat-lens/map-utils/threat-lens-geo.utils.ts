import { ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensLegendItem } from '../../models/geo-fencing.models';
import { ThreatLensCoordinates, ThreatLensIpRecord } from '../models/threat-lens-map.types';

export class ThreatLensGeoUtils {
  static getThreatLensDistanceKm(a: ThreatLensCoordinates, b: ThreatLensCoordinates): number {
    const toRadians = (value: number) => value * Math.PI / 180;
    const dLat = toRadians(b.lat - a.lat);
    const dLon = toRadians(b.lon - a.lon);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2);
    return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  static normalizeThreatLensLongitude(value: number): number {
    return ((((value + 180) % 360) + 360) % 360) - 180;
  }

  static hashThreatLensString(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  static toThreatLensHexColor(color: [number, number, number]): string {
    return `#${color.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  static buildThreatLensLegend( categoryData: ThreatLensCategoryMapData[], arcCountByCategory: Map<ThreatLensCategoryModelKey, number>, ): ThreatLensLegendItem[] {
    return categoryData.map((category) => ({
      categoryKey: category.categoryKey,
      label: category.categoryLabel,
      colorHex: ThreatLensGeoUtils.toThreatLensHexColor(category.color),
      countryCount: category.countryCounts.length,
      arcCount: arcCountByCategory.get(category.categoryKey) || 0,
      totalResults: category.totalResults,
    }));
  }

  static extractThreatLensIpScanRecords(payload: any): ThreatLensIpRecord[] {
    const records = new Map<string, ThreatLensIpRecord>();
    const addRecord = (value: any) => {
      if (typeof value === 'string') {
        const ip = value.trim();
        if (ip && !records.has(ip)) {
          records.set(ip, { ip });
        }
        return;
      }

      if (!value || typeof value !== 'object') {
        return;
      }

      const ip = String(value.ip || value.ip_address || value.host || '').trim();
      if (!ip || records.has(ip)) {
        return;
      }

      records.set(ip, { ip });
    };

    [
      payload?.ips,
      payload?.ip_addresses,
      payload?.data?.ips,
      payload?.result?.ips,
      payload?.cameras,
      payload?.result?.cameras,
      payload?.data?.cameras,
    ].forEach((candidate) => {
      if (Array.isArray(candidate)) {
        candidate.forEach(addRecord);
      }
    });

    return Array.from(records.values()).slice(0, 500);
  }
}
