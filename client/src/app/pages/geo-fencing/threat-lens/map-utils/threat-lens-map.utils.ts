import { ArcPair, ArcPoint2D, LngLat } from '../models/threat-lens-map.types';

export class ThreatLensMapUtils {
  static buildCountryFeatureIndex(features: any[], countryNameFields: string[], normalizeCountryLabel: (value: string) => string, toCountryKey: (value: string) => string): Map<string, any> {
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
}
