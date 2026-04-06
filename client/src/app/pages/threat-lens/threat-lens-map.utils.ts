export type LngLat = [number, number];

export type ArcPair = {
  countryAKey: string;
  countryBKey: string;
  weight: number;
};

export function buildCountryFeatureIndex(features: any[], countryNameFields: string[], normalizeCountryLabel: (value: string) => string, toCountryKey: (value: string) => string): Map<string, any> {
  const selected = new Map<string, { feature: any; priority: number; area: number }>();
  const priorityByField: Record<string, number> = {
    COUNTRY: 1,
    NAME: 2,
    ADMIN: 3,
    SOVEREIGNT: 4,
    COUNTRYAFF: 5,
  };

  for (const feature of features) {
    const attributes = feature?.attributes || {};
    const area = Number(attributes.Shape__Area || 0);

    for (const fieldName of countryNameFields) {
      const rawValue = attributes[fieldName];
      if (typeof rawValue !== 'string' || !rawValue.trim()) {
        continue;
      }

      const alias = normalizeCountryLabel(rawValue);
      const key = toCountryKey(alias);
      if (!key) {
        continue;
      }

      const current = selected.get(key);
      const priority = priorityByField[fieldName] ?? 10;
      if (!current || priority < current.priority || (priority === current.priority && area > current.area)) {
        selected.set(key, { feature, priority, area });
      }
    }
  }

  const index = new Map<string, any>();
  for (const [key, value] of selected.entries()) {
    index.set(key, value.feature);
  }

  return index;
}

export function collectArcPairs(documentCountryGroups: string[][], toCountryKey: (value: string) => string, countryFeatureIndex: Map<string, any>, maxArcCount: number, minArcWeight: number): ArcPair[] {
  const pairCount = new Map<string, number>();

  for (const group of documentCountryGroups) {
    const uniqueKeys = Array.from(new Set(group
      .map((country) => toCountryKey(country))
      .filter((key) => key && countryFeatureIndex.has(key))));

    if (uniqueKeys.length < 2) {
      continue;
    }

    for (let i = 0; i < uniqueKeys.length - 1; i += 1) {
      for (let j = i + 1; j < uniqueKeys.length; j += 1) {
        const pairKey = [uniqueKeys[i], uniqueKeys[j]].sort().join('||');
        pairCount.set(pairKey, (pairCount.get(pairKey) || 0) + 1);
      }
    }
  }

  const sortedPairs = Array.from(pairCount.entries())
    .sort((a, b) => b[1] - a[1]);

  const filtered = sortedPairs.filter(([, weight]) => weight >= minArcWeight);
  const pairs = (filtered.length ? filtered : sortedPairs).slice(0, maxArcCount);

  return pairs.map(([pairKey, weight]) => {
    const [countryAKey, countryBKey] = pairKey.split('||');
    return { countryAKey, countryBKey, weight };
  });
}

export function getFeatureAnchor(feature: any, geometryEngine: any, webMercatorUtils: any): LngLat | null {
  const geometry = feature?.geometry;
  if (!geometry) {
    return null;
  }

  let anchor = null;

  if (geometryEngine?.labelPoint) {
    try {
      anchor = geometryEngine.labelPoint(geometry);
    }
    catch {
    }
  }

  if (!anchor && geometryEngine?.centroid) {
    try {
      anchor = geometryEngine.centroid(geometry);
    }
    catch {
    }
  }

  if (!anchor) {
    anchor = geometry.extent?.center ?? geometry.centroid;
  }

  if (!anchor) {
    return null;
  }

  const rawLon = typeof anchor.longitude === 'number' ? anchor.longitude : anchor.x;
  const rawLat = typeof anchor.latitude === 'number' ? anchor.latitude : anchor.y;
  if (typeof rawLon !== 'number' || typeof rawLat !== 'number') {
    return null;
  }

  if (Math.abs(rawLon) <= 180 && Math.abs(rawLat) <= 90) {
    return [rawLon, rawLat];
  }

  if (webMercatorUtils?.xyToLngLat) {
    try {
      const [lng, lat] = webMercatorUtils.xyToLngLat(rawLon, rawLat);
      if (typeof lng === 'number' && typeof lat === 'number') {
        return [lng, lat];
      }
    }
    catch {
    }
  }

  const lon = (rawLon / 20037508.34) * 180;
  const lat = (rawLat / 20037508.34) * 180;
  const convertedLat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - (Math.PI / 2));
  return [lon, convertedLat];
}

export function buildArcPath(start: LngLat, end: LngLat, weight: number): [number, number, number][] {
  const path: [number, number, number][] = [];
  const steps = 38;
  const startLon = start[0];
  let endLon = end[0];
  const startLat = start[1];
  const endLat = end[1];

  const lonDelta = endLon - startLon;
  if (lonDelta > 180) {
    endLon -= 360;
  }
  else if (lonDelta < -180) {
    endLon += 360;
  }

  const arcHeight = 520000 + Math.min(2600000, weight * 190000);
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const lon = normalizeLongitude(startLon + ((endLon - startLon) * t));
    const lat = startLat + ((endLat - startLat) * t);
    const z = 18000 + (Math.sin(Math.PI * t) * arcHeight);
    path.push([lon, lat, z]);
  }

  return path;
}

export function buildSurfacePath(start: LngLat, end: LngLat): [number, number][] {
  const path: [number, number][] = [];
  const steps = 38;
  const startLon = start[0];
  let endLon = end[0];
  const startLat = start[1];
  const endLat = end[1];

  const lonDelta = endLon - startLon;
  if (lonDelta > 180) {
    endLon -= 360;
  }
  else if (lonDelta < -180) {
    endLon += 360;
  }

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const lon = normalizeLongitude(startLon + ((endLon - startLon) * t));
    const lat = startLat + ((endLat - startLat) * t);
    path.push([lon, lat]);
  }

  return path;
}

function normalizeLongitude(value: number): number {
  let lon = value;
  while (lon > 180) {
    lon -= 360;
  }
  while (lon < -180) {
    lon += 360;
  }
  return lon;
}
