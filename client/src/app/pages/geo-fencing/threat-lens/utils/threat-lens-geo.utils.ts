import { SelectedCountryCategoryCount, ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensLegendItem } from '../../models/geo-fencing.models';
import { ThreatLensCoordinates, ThreatLensIpRecord } from '../map-renderer/threat-lens-map.types';

export function parseThreatLensCoordinates(value: string): ThreatLensCoordinates | null {
  const parts = value.trim().split(/[\s,]+/);
  if (parts.length !== 2) {
    return null;
  }

  const lat = Number(parts[0]);
  const lon = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}

export function getThreatLensDistanceKm(a: ThreatLensCoordinates, b: ThreatLensCoordinates): number {
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2);
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function normalizeThreatLensLongitude(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

export function hashThreatLensString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function toThreatLensHexColor(color: [number, number, number]): string {
  return `#${color.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

export function buildThreatLensCategoryCountryCounts( categoryData: ThreatLensCategoryMapData[], toCountryKey: (value: string) => string, ): Map<ThreatLensCategoryModelKey, Map<string, number>> {
  const categoryCountryNewsCountByKey = new Map<ThreatLensCategoryModelKey, Map<string, number>>();

  for (const category of categoryData) {
    const countsByCountry = new Map<string, number>();
    for (const item of category.countryCounts) {
      countsByCountry.set(toCountryKey(item.country), item.count);
    }
    categoryCountryNewsCountByKey.set(category.categoryKey, countsByCountry);
  }

  return categoryCountryNewsCountByKey;
}

export function getThreatLensSelectedCountryBreakdown( countryKey: string, categoryLegend: ThreatLensLegendItem[], categoryCountryNewsCountByKey: Map<ThreatLensCategoryModelKey, Map<string, number>>, ): SelectedCountryCategoryCount[] {
  return categoryLegend
    .map((category) => ({
      label: category.label,
      colorHex: category.colorHex,
      count: categoryCountryNewsCountByKey.get(category.categoryKey)?.get(countryKey) || 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function buildThreatLensLegend( categoryData: ThreatLensCategoryMapData[], arcCountByCategory: Map<ThreatLensCategoryModelKey, number>, ): ThreatLensLegendItem[] {
  return categoryData.map((category) => ({
    categoryKey: category.categoryKey,
    label: category.categoryLabel,
    colorHex: toThreatLensHexColor(category.color),
    countryCount: category.countryCounts.length,
    arcCount: arcCountByCategory.get(category.categoryKey) || 0,
    totalResults: category.totalResults,
  }));
}

export function extractThreatLensIpScanRecords(payload: any): ThreatLensIpRecord[] {
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

    const lat = Number(value.latitude ?? value.lat);
    const lon = Number(value.longitude ?? value.lon ?? value.lng);
    records.set(ip, {
      ip,
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
    });
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
