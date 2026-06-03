import { ThreatLensGeoUtils } from '../map-utils/threat-lens-geo.utils';
import { ThreatLensCoordinates, ThreatLensCountryBoundary, ThreatLensIpRecord } from '../models/threat-lens-map.types';

type IpDistributionCell = {
  key: string;
  row: number;
  col: number;
  items: any[];
};

export class ThreatLensIpMarkerRenderer {
  private markerGraphics: any[] = [];
  private visibleMarkerGraphics: any[] = [];
  private radiusGraphic: any | null = null;
  private renderKey = '';
  private readonly minimumVisibleMarkers = 20;
  private readonly maximumVisibleMarkers = 200;

  constructor(private view: any, private graphicsLayer: any, private geometryEngine: any | null = null) {}

  render(records: ThreatLensIpRecord[], center: ThreatLensCoordinates, radiusKm: number, boundary: ThreatLensCountryBoundary | null = null): boolean {
    if (!this.graphicsLayer) {
      return false;
    }

    const markerGraphics: any[] = [];
    records.forEach((record, index) => {
      const point = this.resolveMarkerPoint(record, index, records.length, center, radiusKm, boundary);
      if (!point) {
        return;
      }

      markerGraphics.push({
        geometry: {
          type: 'point',
          longitude: point.lon,
          latitude: point.lat,
          spatialReference: { wkid: 4326 },
        },
        attributes: {
          role: 'ip-scan-marker',
          ip: record.ip,
        },
        symbol: this.buildMarkerSymbol(this.getMarkerSizeForView()),
      });
    });

    if (!markerGraphics.length) {
      return false;
    }

    this.clear();
    this.radiusGraphic = boundary
      ? null
      : {
        geometry: this.buildRadiusGeometry(center, radiusKm),
        attributes: {
          role: 'ip-scan-radius',
        },
        symbol: {
          type: 'simple-fill',
          color: [14, 165, 233, 0.08],
          outline: {
            color: [56, 189, 248, 0.72],
            width: 1.25,
          },
        },
      };

    this.markerGraphics = markerGraphics;
    if (this.radiusGraphic) {
      this.graphicsLayer.add(this.radiusGraphic);
    }
    this.updateSymbols(true);
    return true;
  }

  clear(): void {
    this.graphicsLayer?.removeAll();
    this.markerGraphics = [];
    this.visibleMarkerGraphics = [];
    this.radiusGraphic = null;
    this.renderKey = '';
  }

  updateSymbols(force = false): void {
    if (!this.markerGraphics.length) {
      return;
    }

    const size = this.getMarkerSizeForView();
    const nextMarkers = this.getVisibleMarkerGraphics();
    const nextKey = `${size}:${nextMarkers.map((graphic) => graphic.attributes?.ip || '').join('|')}`;

    if (!force && nextKey === this.renderKey) {
      for (const graphic of this.visibleMarkerGraphics) {
        graphic.symbol = this.buildMarkerSymbol(size);
      }
      return;
    }

    for (const graphic of nextMarkers) {
      graphic.symbol = this.buildMarkerSymbol(size);
    }

    this.graphicsLayer.removeAll();
    if (this.radiusGraphic) {
      this.graphicsLayer.add(this.radiusGraphic);
    }
    if (nextMarkers.length) {
      this.graphicsLayer.addMany(nextMarkers);
    }

    this.visibleMarkerGraphics = nextMarkers;
    this.renderKey = nextKey;
  }

  isMarkerGraphic(graphic: any): boolean {
    return graphic?.attributes?.role === 'ip-scan-marker';
  }

  private resolveMarkerPoint(record: ThreatLensIpRecord, index: number, total: number, center: ThreatLensCoordinates, radiusKm: number, boundary: ThreatLensCountryBoundary | null): ThreatLensCoordinates | null {
    if (boundary) {
      return this.resolveBoundaryMarkerPoint(record, index, total, center, radiusKm, boundary);
    }

    const hash = ThreatLensGeoUtils.hashThreatLensString(`${record.ip}:${index}:${total}`);
    const angle = ((hash % 36000) / 36000) * Math.PI * 2;
    const radialSeed = ((Math.floor(hash / 36000) % 10000) + 1) / 10001;
    const distanceKm = Math.max(0.35, radiusKm * 0.92 * Math.sqrt(radialSeed));
    const latOffset = (distanceKm * Math.cos(angle)) / 111.32;
    const lonScale = Math.max(0.12, Math.cos(center.lat * Math.PI / 180));
    const lonOffset = (distanceKm * Math.sin(angle)) / (111.32 * lonScale);

    return {
      lat: Math.max(-89.9, Math.min(89.9, center.lat + latOffset)),
      lon: ThreatLensGeoUtils.normalizeThreatLensLongitude(center.lon + lonOffset),
    };
  }

  private resolveBoundaryMarkerPoint(record: ThreatLensIpRecord, index: number, total: number, center: ThreatLensCoordinates, radiusKm: number, boundary: ThreatLensCountryBoundary): ThreatLensCoordinates | null {
    const radiusLat = radiusKm / 111.32;
    const lonScale = Math.max(0.12, Math.cos(center.lat * Math.PI / 180));
    const radiusLon = radiusKm / (111.32 * lonScale);
    const extent = {
      minLat: Math.max(boundary.extent.minLat, center.lat - radiusLat),
      maxLat: Math.min(boundary.extent.maxLat, center.lat + radiusLat),
      minLon: Math.max(boundary.extent.minLon, center.lon - radiusLon),
      maxLon: Math.min(boundary.extent.maxLon, center.lon + radiusLon),
    };
    const latSpan = extent.maxLat - extent.minLat;
    const lonSpan = extent.maxLon - extent.minLon;
    if (!boundary.rings.length || latSpan <= 0 || lonSpan <= 0) {
      return null;
    }

    for (let attempt = 0; attempt < 96; attempt += 1) {
      const latSeed = this.seedUnit(`${record.ip}:${index}:${total}:lat:${attempt}`);
      const lonSeed = this.seedUnit(`${record.ip}:${index}:${total}:lon:${attempt}`);
      const point = {
        lat: extent.minLat + (latSeed * latSpan),
        lon: ThreatLensGeoUtils.normalizeThreatLensLongitude(extent.minLon + (lonSeed * lonSpan)),
      };

      if (this.isPointInBoundary(point, boundary) && ThreatLensGeoUtils.getThreatLensDistanceKm(center, point) <= radiusKm * 1.04) {
        return point;
      }
    }

    return null;
  }

  private seedUnit(value: string): number {
    return (ThreatLensGeoUtils.hashThreatLensString(value) % 1000000) / 1000000;
  }

  private isPointInBoundary(point: ThreatLensCoordinates, boundary: ThreatLensCountryBoundary): boolean {
    return boundary.rings.some((ring) => this.isPointInRing(point, ring));
  }

  private isPointInRing(point: ThreatLensCoordinates, ring: ThreatLensCoordinates[]): boolean {
    if (ring.length < 3) {
      return false;
    }

    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const current = ring[i];
      const previous = ring[j];
      const crossesLatitude = (current.lat > point.lat) !== (previous.lat > point.lat);
      if (!crossesLatitude) {
        continue;
      }

      const crossingLon = ((previous.lon - current.lon) * (point.lat - current.lat)) / ((previous.lat - current.lat) || 1e-9) + current.lon;
      if (point.lon < crossingLon) {
        inside = !inside;
      }
    }

    return inside;
  }

  private getVisibleMarkerGraphics(): any[] {
    const limit = this.getVisibleMarkerLimit();
    if (this.markerGraphics.length <= limit) {
      return this.markerGraphics.slice();
    }

    return this.takeSpatiallyDistributedMarkers(this.markerGraphics, limit);
  }

  private getVisibleMarkerLimit(): number {
    const total = this.markerGraphics.length;
    if (total <= this.minimumVisibleMarkers) {
      return total;
    }

    const zoom = Number(this.view?.zoom);
    const zoomFactor = Number.isFinite(zoom)
      ? Math.max(0, Math.min(1, (zoom - 3) / 6))
      : this.getScaleZoomFactor();
    const limit = Math.round(this.minimumVisibleMarkers + (zoomFactor * (this.maximumVisibleMarkers - this.minimumVisibleMarkers)));

    return Math.min(total, Math.max(this.minimumVisibleMarkers, Math.min(this.maximumVisibleMarkers, limit)));
  }

  private getScaleZoomFactor(): number {
    const scale = Number(this.view?.scale || 50000000);
    const logScale = Math.log10(Math.max(1, scale));
    return Math.max(0, Math.min(1, (7.45 - logScale) / 2.1));
  }

  private takeSpatiallyDistributedMarkers(markers: any[], limit: number): any[] {
    if (limit <= 0) {
      return [];
    }
    if (markers.length <= limit) {
      return markers.slice();
    }

    const cells = new Map<string, IpDistributionCell>();
    markers.forEach((marker) => {
      const cellRef = this.getDistributionCell(marker);
      const cell = cells.get(cellRef.key) ?? { ...cellRef, items: [] };
      cell.items.push(marker);
      cells.set(cellRef.key, cell);
    });

    const orderedCells = this.orderDistributionCells(Array.from(cells.values()).map((cell) => ({
      ...cell,
      items: cell.items.slice().sort((left, right) => ThreatLensGeoUtils.hashThreatLensString(String(left.attributes?.ip || '')) - ThreatLensGeoUtils.hashThreatLensString(String(right.attributes?.ip || ''))),
    })), limit);
    const selected: any[] = [];
    let round = 0;

    while (selected.length < limit) {
      let addedThisRound = false;
      for (const cell of orderedCells) {
        const marker = cell.items[round];
        if (!marker) {
          continue;
        }
        selected.push(marker);
        addedThisRound = true;
        if (selected.length >= limit) {
          break;
        }
      }
      if (!addedThisRound) {
        break;
      }
      round += 1;
    }

    return selected;
  }

  private getDistributionCell(marker: any): { key: string; row: number; col: number } {
    const screenCell = this.getScreenDistributionCell(marker, this.getDistributionScreenGridSize());
    if (screenCell) {
      return screenCell;
    }

    const latitude = Number(marker.geometry?.latitude);
    const longitude = Number(marker.geometry?.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const gridSize = this.getDistributionGeoGridSize();
      const row = Math.floor((latitude + 90) / gridSize);
      const col = Math.floor((longitude + 180) / gridSize);
      return { key: `geo:${gridSize}:${row}:${col}`, row, col };
    }

    return { key: 'unknown:0:0', row: 0, col: 0 };
  }

  private getScreenDistributionCell(marker: any, gridSize: number): { key: string; row: number; col: number } | null {
    const point = this.getScreenPoint(marker);
    if (!point) {
      return null;
    }

    const row = Math.floor(point.y / gridSize);
    const col = Math.floor(point.x / gridSize);
    return { key: `screen:${gridSize}:${row}:${col}`, row, col };
  }

  private getScreenPoint(marker: any): { x: number; y: number } | null {
    if (!this.view?.toScreen) {
      return null;
    }

    let point: { x?: number; y?: number } | null = null;
    try {
      point = this.view.toScreen(marker.geometry);
    }
    catch {
      return null;
    }
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    const width = Number(this.view?.width || 0);
    const height = Number(this.view?.height || 0);
    if (width > 0 && height > 0 && (x < -80 || y < -80 || x > width + 80 || y > height + 80)) {
      return null;
    }

    return { x, y };
  }

  private getDistributionScreenGridSize(): number {
    const zoom = Number(this.view?.zoom || 0);
    if (zoom >= 8) {
      return 72;
    }
    if (zoom >= 6) {
      return 88;
    }
    if (zoom >= 4) {
      return 108;
    }
    return 128;
  }

  private getDistributionGeoGridSize(): number {
    const zoom = Number(this.view?.zoom || 0);
    if (zoom >= 8) {
      return 0.35;
    }
    if (zoom >= 6) {
      return 0.65;
    }
    if (zoom >= 4) {
      return 1.1;
    }
    return 2;
  }

  private orderDistributionCells(cells: IpDistributionCell[], limit: number): IpDistributionCell[] {
    if (cells.length <= limit) {
      return cells.slice().sort((left, right) => left.row - right.row || left.col - right.col);
    }

    const rowGroups = new Map<number, IpDistributionCell[]>();
    cells.forEach((cell) => {
      const rowCells = rowGroups.get(cell.row) ?? [];
      rowCells.push(cell);
      rowGroups.set(cell.row, rowCells);
    });

    const quotas = Array.from(rowGroups.entries())
      .map(([row, rowCells]) => {
        const sortedCells = rowCells.slice().sort((left, right) => left.col - right.col);
        const rawQuota = (limit * sortedCells.length) / cells.length;
        return {
          row,
          cells: sortedCells,
          quota: Math.min(sortedCells.length, Math.floor(rawQuota)),
          remainder: rawQuota % 1,
        };
      })
      .sort((left, right) => left.row - right.row);
    let used = quotas.reduce((total, quota) => total + quota.quota, 0);

    quotas
      .slice()
      .sort((left, right) => right.remainder - left.remainder || right.cells.length - left.cells.length)
      .forEach((quota) => {
        if (used >= limit || quota.quota >= quota.cells.length) {
          return;
        }
        quota.quota += 1;
        used += 1;
      });

    while (used < limit) {
      const nextQuota = quotas.find((quota) => quota.quota < quota.cells.length);
      if (!nextQuota) {
        break;
      }
      nextQuota.quota += 1;
      used += 1;
    }

    return quotas.flatMap((quota) => this.takeEvenlySpacedCells(quota.cells, quota.quota));
  }

  private takeEvenlySpacedCells(cells: IpDistributionCell[], count: number): IpDistributionCell[] {
    if (count <= 0) {
      return [];
    }
    if (count >= cells.length) {
      return cells;
    }

    const selected: IpDistributionCell[] = [];
    const step = cells.length / count;
    for (let index = 0; index < count; index += 1) {
      selected.push(cells[Math.min(cells.length - 1, Math.floor((index + 0.5) * step))]);
    }
    return selected;
  }

  private buildRadiusGeometry(center: ThreatLensCoordinates, radiusKm: number): any {
    const point = {
      type: 'point',
      longitude: center.lon,
      latitude: center.lat,
      spatialReference: { wkid: 4326 },
    };

    if (this.geometryEngine?.geodesicBuffer) {
      try {
        const buffer = this.geometryEngine.geodesicBuffer(point, radiusKm, 'kilometers');
        const geometry = Array.isArray(buffer) ? buffer[0] : buffer;
        if (geometry) {
          return geometry;
        }
      }
      catch {
      }
    }

    const ring: number[][] = [];
    const latRad = center.lat * Math.PI / 180;
    const lonRad = center.lon * Math.PI / 180;
    const angularDistance = radiusKm / 6371.0088;

    for (let step = 0; step <= 96; step += 1) {
      const bearing = (step / 96) * Math.PI * 2;
      const pointLat = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing));
      const pointLon = lonRad + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat));
      ring.push([this.unwrapLongitude(pointLon * 180 / Math.PI, ring), pointLat * 180 / Math.PI]);
    }

    return {
      type: 'polygon',
      rings: [ring],
      spatialReference: { wkid: 4326 },
    };
  }

  private unwrapLongitude(value: number, ring: number[][]): number {
    if (!ring.length) {
      return ThreatLensGeoUtils.normalizeThreatLensLongitude(value);
    }

    let lon = value;
    const previousLon = ring[ring.length - 1][0];
    while (lon - previousLon > 180) {
      lon -= 360;
    }
    while (lon - previousLon < -180) {
      lon += 360;
    }
    return lon;
  }

  private buildMarkerSymbol(size: number): any {
    return {
      type: 'simple-marker',
      style: 'circle',
      size,
      color: [56, 189, 248, 0.88],
      outline: {
        color: [255, 255, 255, 0.92],
        width: Math.max(1, Math.min(2.5, size * 0.16)),
      },
    };
  }

  private getMarkerSizeForView(): number {
    const scale = Number(this.view?.scale || 50000000);
    const logScale = Math.log10(Math.max(1, scale));
    const zoomFactor = Math.max(0, Math.min(1, (8.25 - logScale) / 4.5));
    return Math.round((6 + (zoomFactor * 9)) * 10) / 10;
  }

}
