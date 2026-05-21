import { TrackingEntityType } from '../../models/geo-fencing.models';

export function normalizeEntityId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

export function escapeTooltipText(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[character] ?? character));
}

export function getMarkerBaseSize(map: any, type: TrackingEntityType): number {
  const zoom = map?.getZoom?.() ?? 3;
  const base = type === 'aircraft' ? 26 : 28;
  const growth = type === 'aircraft' ? 1.8 : 1.6;
  const cap = type === 'aircraft' ? 20 : 8;
  return base + Math.max(0, Math.min(cap, Math.round((zoom - 3) * growth)));
}

export function getBearingDegrees(fromLat: number, fromLon: number, toLat: number, toLon: number): number | null {
  const deltaLat = toLat - fromLat;
  const deltaLon = toLon - fromLon;
  if (Math.abs(deltaLat) < 0.000001 && Math.abs(deltaLon) < 0.000001) {
    return null;
  }
  const fromLatRad = (fromLat * Math.PI) / 180;
  const toLatRad = (toLat * Math.PI) / 180;
  const deltaLonRad = ((toLon - fromLon) * Math.PI) / 180;
  const y = Math.sin(deltaLonRad) * Math.cos(toLatRad);
  const x = Math.cos(fromLatRad) * Math.sin(toLatRad) -
    Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(deltaLonRad);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export function getGridBucketKey(latitude: number, longitude: number): string {
  return `grid:${Math.floor((latitude + 90) / 10)}:${Math.floor((longitude + 180) / 10)}`;
}

export function stableHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  return hash;
}

export function sampleByBucket<T>(items: T[], ratio: number, getBucketKey: (item: T) => string, getStableKey: (item: T) => string): T[] {
  const buckets = new Map<string, T[]>();

  items.forEach(item => {
    const bucketKey = getBucketKey(item);
    const bucketItems = buckets.get(bucketKey) ?? [];
    bucketItems.push(item);
    buckets.set(bucketKey, bucketItems);
  });

  const sampled: T[] = [];
  buckets.forEach(bucketItems => {
    const keepCount = Math.max(1, Math.ceil(bucketItems.length * ratio));
    if (keepCount >= bucketItems.length) {
      sampled.push(...bucketItems);
      return;
    }

    sampled.push(...bucketItems.slice().sort((left, right) => stableHash(getStableKey(left)) - stableHash(getStableKey(right))).slice(0, keepCount));
  });

  return sampled;
}

export function getResponseStatus(res: any): string | undefined {
  return res?.result?.status || res?.status;
}

export function isPendingStatus(status: string | undefined): boolean {
  return status === 'pending' || status === 'busy';
}
