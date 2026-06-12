import { ArcPair, ArcPoint2D, LngLat } from '../models/threat-lens-map.types';

export class ThreatLensMapUtils {
  static buildCountryFeatureIndex(features: any[], countryNameFields: string[], normalizeCountryLabel: (value: string) => string, toCountryKey: (value: string) => string, countryCodeFields: string[] = []): Map<string, any> {
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
      const candidateFields = [
        ...countryCodeFields,
        ...countryNameFields,
      ];

      for (const fieldName of candidateFields) {
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

  static collectArcPairs(documentCountryGroups: string[][], toCountryKey: (value: string) => string, countryFeatureIndex: Map<string, any>, maxArcCount: number, minArcWeight: number): ArcPair[] {
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

  static getFeatureAnchor(feature: any, geometryEngine: any, webMercatorUtils: any): LngLat | null {
    const geometry = feature?.geometry;
    if (!geometry) {
      return null;
    }

    let anchor: LngLat | null = null;

    if (geometryEngine?.labelPoint) {
      try {
        anchor = ThreatLensMapUtils.toValidLngLat(geometryEngine.labelPoint(geometry), webMercatorUtils);
      }
      catch {
      }
    }

    if (!anchor && geometryEngine?.centroid) {
      try {
        anchor = ThreatLensMapUtils.toValidLngLat(geometryEngine.centroid(geometry), webMercatorUtils);
      }
      catch {
      }
    }

    if (anchor && ThreatLensMapUtils.isAnchorInsideGeometry(anchor, geometry, webMercatorUtils)) {
      return anchor;
    }

    const ringAnchor = ThreatLensMapUtils.getLargestRingAnchor(geometry, webMercatorUtils);
    if (ringAnchor) {
      return ringAnchor;
    }

    if (anchor) {
      return null;
    }

    return null;
  }

  static isValidLngLat(point: LngLat | null | undefined): point is LngLat {
    if (!point) {
      return false;
    }

    const [lon, lat] = point;
    return Number.isFinite(lon) && Number.isFinite(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
  }

  private static toValidLngLat(point: any, webMercatorUtils: any): LngLat | null {
    if (!point) {
      return null;
    }

    const rawLon = Number(point.longitude ?? point.lon ?? point.x);
    const rawLat = Number(point.latitude ?? point.lat ?? point.y);
    if (!Number.isFinite(rawLon) || !Number.isFinite(rawLat)) {
      return null;
    }

    if (Math.abs(rawLon) <= 180 && Math.abs(rawLat) <= 90) {
      return [ThreatLensMapUtils.normalizeLongitude(rawLon), rawLat];
    }

    if (webMercatorUtils?.xyToLngLat) {
      try {
        const [lng, lat] = webMercatorUtils.xyToLngLat(rawLon, rawLat);
        const lngLat: LngLat = [ThreatLensMapUtils.normalizeLongitude(lng), lat];
        if (ThreatLensMapUtils.isValidLngLat(lngLat)) {
          return lngLat;
        }
      }
      catch {
      }
    }

    const lon = (rawLon / 20037508.34) * 180;
    const lat = (rawLat / 20037508.34) * 180;
    const convertedLat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - (Math.PI / 2));
    const lngLat: LngLat = [ThreatLensMapUtils.normalizeLongitude(lon), convertedLat];
    return ThreatLensMapUtils.isValidLngLat(lngLat) ? lngLat : null;
  }

  static buildSurfacePath(start: LngLat, end: LngLat): [number, number][][] {
    return ThreatLensMapUtils.splitPath2D(ThreatLensMapUtils.buildSurfacePathPoints(start, end));
  }

  static extractSurfaceSegment(points: ArcPoint2D[], startProgress: number, endProgress: number): ArcPoint2D[][] {
    if (points.length < 2) {
      return [];
    }

    const start = Math.max(0, Math.min(1, startProgress));
    const end = Math.max(start, Math.min(1, endProgress));
    if (end <= start) {
      return [];
    }

    return ThreatLensMapUtils.splitPath2D(ThreatLensMapUtils.slicePath2D(points, start, end));
  }

  static getSurfacePointAtProgress(points: ArcPoint2D[], progress: number): ArcPoint2D | null {
    if (!points.length) {
      return null;
    }

    if (points.length === 1) {
      return points[0];
    }

    const clampedProgress = Math.max(0, Math.min(1, progress));
    const position = clampedProgress * (points.length - 1);
    const startIndex = Math.floor(position);
    const endIndex = Math.min(points.length - 1, Math.ceil(position));

    if (startIndex === endIndex) {
      return points[startIndex];
    }

    return ThreatLensMapUtils.interpolatePoint2D(points[startIndex], points[endIndex], position - startIndex);
  }

  static buildSurfacePathPoints(start: LngLat, end: LngLat): ArcPoint2D[] {
    return ThreatLensMapUtils.buildGreatCirclePoints(start, end);
  }

  private static buildGreatCirclePoints(start: LngLat, end: LngLat): ArcPoint2D[] {
    const steps = 56;
    const startVector = ThreatLensMapUtils.lngLatToCartesian(start);
    const endVector = ThreatLensMapUtils.lngLatToCartesian(end);
    const dot = ThreatLensMapUtils.clamp((startVector[0] * endVector[0]) + (startVector[1] * endVector[1]) + (startVector[2] * endVector[2]), -1, 1);
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);
    const points: ArcPoint2D[] = [];
    let previousLon: number | null = null;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const vector = sinOmega < 1e-6
        ? [
          startVector[0] + ((endVector[0] - startVector[0]) * t),
          startVector[1] + ((endVector[1] - startVector[1]) * t),
          startVector[2] + ((endVector[2] - startVector[2]) * t),
        ]
        : [
          ((Math.sin((1 - t) * omega) / sinOmega) * startVector[0]) + ((Math.sin(t * omega) / sinOmega) * endVector[0]),
          ((Math.sin((1 - t) * omega) / sinOmega) * startVector[1]) + ((Math.sin(t * omega) / sinOmega) * endVector[1]),
          ((Math.sin((1 - t) * omega) / sinOmega) * startVector[2]) + ((Math.sin(t * omega) / sinOmega) * endVector[2]),
        ];

      const normalizedVector = ThreatLensMapUtils.normalizeVector(vector as [number, number, number]);
      const lngLat = ThreatLensMapUtils.cartesianToLngLat(normalizedVector);
      const unwrappedLon: number = previousLon === null ? lngLat[0] : ThreatLensMapUtils.unwrapLongitude(lngLat[0], previousLon);

      points.push([unwrappedLon, lngLat[1]]);
      previousLon = unwrappedLon;
    }

    return points;
  }

  private static splitPath2D(points: ArcPoint2D[]): ArcPoint2D[][] {
    if (!points.length) {
      return [];
    }

    const paths: ArcPoint2D[][] = [];
    let currentPath: ArcPoint2D[] = [[ThreatLensMapUtils.normalizeLongitude(points[0][0]), points[0][1]]];

    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const next = points[i];
      const lonDelta = next[0] - previous[0];

      if (Math.abs(lonDelta) > 180) {
        const boundary = lonDelta > 0 ? 180 : -180;
        const t = (boundary - previous[0]) / lonDelta;
        const crossingLat = previous[1] + ((next[1] - previous[1]) * t);
        currentPath.push([boundary, crossingLat]);
        paths.push(currentPath);

        currentPath = [
          [boundary === 180 ? -180 : 180, crossingLat],
          [ThreatLensMapUtils.normalizeLongitude(next[0]), next[1]],
        ];
        continue;
      }

      currentPath.push([ThreatLensMapUtils.normalizeLongitude(next[0]), next[1]]);
    }

    paths.push(currentPath);
    return paths.filter((path) => path.length >= 2);
  }

  private static slicePath2D(points: ArcPoint2D[], startProgress: number, endProgress: number): ArcPoint2D[] {
    const maxIndex = points.length - 1;
    const startPosition = startProgress * maxIndex;
    const endPosition = endProgress * maxIndex;
    const startIndex = Math.floor(startPosition);
    const endIndex = Math.ceil(endPosition);
    const segment: ArcPoint2D[] = [ThreatLensMapUtils.interpolatePoint2D(points[startIndex], points[Math.min(maxIndex, startIndex + 1)], startPosition - startIndex)];

    for (let index = startIndex + 1; index <= endIndex - 1 && index < points.length; index += 1) {
      segment.push(points[index]);
    }

    segment.push(ThreatLensMapUtils.interpolatePoint2D(points[Math.max(0, endIndex - 1)], points[Math.min(maxIndex, endIndex)], endPosition - Math.max(0, endIndex - 1)));
    return ThreatLensMapUtils.dedupeSequentialPoints2D(segment);
  }

  private static interpolatePoint2D(start: ArcPoint2D, end: ArcPoint2D, t: number): ArcPoint2D {
    const ratio = Math.max(0, Math.min(1, t));
    return [
      start[0] + ((end[0] - start[0]) * ratio),
      start[1] + ((end[1] - start[1]) * ratio),
    ];
  }

  private static dedupeSequentialPoints2D(points: ArcPoint2D[]): ArcPoint2D[] {
    return points.filter((point, index) => {
      if (index === 0) {
        return true;
      }

      const previous = points[index - 1];
      return previous[0] !== point[0] || previous[1] !== point[1];
    });
  }

  private static lngLatToCartesian([lon, lat]: LngLat): [number, number, number] {
    const lonRad = ThreatLensMapUtils.toRadians(lon);
    const latRad = ThreatLensMapUtils.toRadians(lat);
    const cosLat = Math.cos(latRad);

    return [
      cosLat * Math.cos(lonRad),
      cosLat * Math.sin(lonRad),
      Math.sin(latRad),
    ];
  }

  private static cartesianToLngLat([x, y, z]: [number, number, number]): LngLat {
    const lon = (Math.atan2(y, x) * 180) / Math.PI;
    const lat = (Math.atan2(z, Math.sqrt((x * x) + (y * y))) * 180) / Math.PI;
    return [lon, lat];
  }

  private static normalizeVector([x, y, z]: [number, number, number]): [number, number, number] {
    const magnitude = Math.sqrt((x * x) + (y * y) + (z * z)) || 1;
    return [x / magnitude, y / magnitude, z / magnitude];
  }

  private static unwrapLongitude(lon: number, previousLon: number): number {
    let result = lon;
    while ((result - previousLon) > 180) {
      result -= 360;
    }
    while ((result - previousLon) < -180) {
      result += 360;
    }
    return result;
  }

  private static toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private static normalizeLongitude(value: number): number {
    let lon = value;
    while (lon > 180) {
      lon -= 360;
    }
    while (lon < -180) {
      lon += 360;
    }
    return lon;
  }

  private static isAnchorInsideGeometry(anchor: LngLat, geometry: any, webMercatorUtils: any): boolean {
    return ThreatLensMapUtils.getConvertedRings(geometry, webMercatorUtils)
      .some((ring) => ThreatLensMapUtils.isPointInRing(anchor, ring));
  }

  private static getLargestRingAnchor(geometry: any, webMercatorUtils: any): LngLat | null {
    const rings = ThreatLensMapUtils.getConvertedRings(geometry, webMercatorUtils)
      .filter((ring) => ring.length >= 3)
      .sort((a, b) => Math.abs(ThreatLensMapUtils.getRingArea(b)) - Math.abs(ThreatLensMapUtils.getRingArea(a)));

    for (const ring of rings) {
      const centroid = ThreatLensMapUtils.getRingCentroid(ring);
      if (centroid && ThreatLensMapUtils.isPointInRing(centroid, ring)) {
        return centroid;
      }

      const sampled = ThreatLensMapUtils.getSampledPointInRing(ring);
      if (sampled) {
        return sampled;
      }

      const vertex = ring.find((point) => ThreatLensMapUtils.isValidLngLat(point));
      if (vertex) {
        return vertex;
      }
    }

    return null;
  }

  private static getConvertedRings(geometry: any, webMercatorUtils: any): LngLat[][] {
    const rings = Array.isArray(geometry?.rings) ? geometry.rings : [];
    return rings
      .map((ring: any[]) => Array.isArray(ring)
        ? ring
          .map((point) => ThreatLensMapUtils.toValidLngLat(Array.isArray(point) ? { x: point[0], y: point[1] } : point, webMercatorUtils))
          .filter((point): point is LngLat => ThreatLensMapUtils.isValidLngLat(point))
        : [])
      .filter((ring: LngLat[]) => ring.length >= 3);
  }

  private static getRingArea(ring: LngLat[]): number {
    const unwrapped = ThreatLensMapUtils.unwrapRingLongitudes(ring);
    let area = 0;
    for (let index = 0; index < unwrapped.length; index += 1) {
      const current = unwrapped[index];
      const next = unwrapped[(index + 1) % unwrapped.length];
      area += (current[0] * next[1]) - (next[0] * current[1]);
    }
    return area / 2;
  }

  private static getRingCentroid(ring: LngLat[]): LngLat | null {
    const unwrapped = ThreatLensMapUtils.unwrapRingLongitudes(ring);
    let twiceArea = 0;
    let cx = 0;
    let cy = 0;

    for (let index = 0; index < unwrapped.length; index += 1) {
      const current = unwrapped[index];
      const next = unwrapped[(index + 1) % unwrapped.length];
      const cross = (current[0] * next[1]) - (next[0] * current[1]);
      twiceArea += cross;
      cx += (current[0] + next[0]) * cross;
      cy += (current[1] + next[1]) * cross;
    }

    if (Math.abs(twiceArea) < 1e-9) {
      return null;
    }

    const lon = ThreatLensMapUtils.normalizeLongitude(cx / (3 * twiceArea));
    const lat = cy / (3 * twiceArea);
    const centroid: LngLat = [lon, lat];
    return ThreatLensMapUtils.isValidLngLat(centroid) ? centroid : null;
  }

  private static getSampledPointInRing(ring: LngLat[]): LngLat | null {
    const unwrapped = ThreatLensMapUtils.unwrapRingLongitudes(ring);
    const lons = unwrapped.map(([lon]) => lon);
    const lats = unwrapped.map(([, lat]) => lat);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const samples: LngLat[] = [[centerLon, centerLat]];

    for (const ratio of [0.18, 0.32, 0.46]) {
      const lonOffset = (maxLon - minLon) * ratio;
      const latOffset = (maxLat - minLat) * ratio;
      samples.push(
        [centerLon - lonOffset, centerLat],
        [centerLon + lonOffset, centerLat],
        [centerLon, centerLat - latOffset],
        [centerLon, centerLat + latOffset],
        [centerLon - lonOffset, centerLat - latOffset],
        [centerLon + lonOffset, centerLat + latOffset],
      );
    }

    for (const sample of samples) {
      const normalized: LngLat = [ThreatLensMapUtils.normalizeLongitude(sample[0]), sample[1]];
      if (ThreatLensMapUtils.isValidLngLat(normalized) && ThreatLensMapUtils.isPointInRing(normalized, ring)) {
        return normalized;
      }
    }

    return null;
  }

  private static isPointInRing(point: LngLat, ring: LngLat[]): boolean {
    const unwrapped = ThreatLensMapUtils.unwrapRingLongitudes(ring);
    const baseLon = unwrapped[0]?.[0] ?? point[0];
    const x = ThreatLensMapUtils.unwrapLongitude(point[0], baseLon);
    const y = point[1];
    let inside = false;

    for (let index = 0, previousIndex = unwrapped.length - 1; index < unwrapped.length; previousIndex = index, index += 1) {
      const xi = unwrapped[index][0];
      const yi = unwrapped[index][1];
      const xj = unwrapped[previousIndex][0];
      const yj = unwrapped[previousIndex][1];
      const intersects = ((yi > y) !== (yj > y))
        && (x < (((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON)) + xi);
      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  private static unwrapRingLongitudes(ring: LngLat[]): LngLat[] {
    const unwrapped: LngLat[] = [];
    let previousLon: number | null = null;

    for (const point of ring) {
      const lon: number = previousLon === null ? point[0] : ThreatLensMapUtils.unwrapLongitude(point[0], previousLon);
      unwrapped.push([lon, point[1]]);
      previousLon = lon;
    }

    return unwrapped;
  }
}
