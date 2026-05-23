import { getThreatLensDistanceKm, hashThreatLensString, normalizeThreatLensLongitude } from '../../utils/threat-lens-geo.utils';
import { ThreatLensCoordinates, ThreatLensIpRecord } from '../threat-lens-map.types';

export class ThreatLensIpMarkerRenderer {
  private markerGraphics: any[] = [];

  constructor(private view: any, private graphicsLayer: any) {}

  render(records: ThreatLensIpRecord[], center: ThreatLensCoordinates, radiusKm: number): void {
    if (!this.graphicsLayer) {
      return;
    }

    this.clear();
    const markerGraphics = records.map((record, index) => {
      const point = this.resolveMarkerPoint(record, index, records.length, center, radiusKm);
      return {
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
      };
    });

    const radiusGraphic = {
      geometry: this.buildRadiusPolygon(center, radiusKm),
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
    this.graphicsLayer.addMany([radiusGraphic, ...markerGraphics]);
    this.updateSymbols();
    this.focusArea(center, radiusKm);
  }

  clear(): void {
    this.graphicsLayer?.removeAll();
    this.markerGraphics = [];
  }

  updateSymbols(): void {
    if (!this.markerGraphics.length) {
      return;
    }

    const size = this.getMarkerSizeForView();
    for (const graphic of this.markerGraphics) {
      graphic.symbol = this.buildMarkerSymbol(size);
    }
  }

  isMarkerGraphic(graphic: any): boolean {
    return graphic?.attributes?.role === 'ip-scan-marker';
  }

  private resolveMarkerPoint(record: ThreatLensIpRecord, index: number, total: number, center: ThreatLensCoordinates, radiusKm: number): ThreatLensCoordinates {
    if (Number.isFinite(record.lat) && Number.isFinite(record.lon)) {
      const point = { lat: record.lat as number, lon: record.lon as number };
      if (getThreatLensDistanceKm(center, point) <= radiusKm * 1.05) {
        return point;
      }
    }

    const hash = hashThreatLensString(`${record.ip}:${index}:${total}`);
    const angle = ((hash % 36000) / 36000) * Math.PI * 2;
    const radialSeed = ((Math.floor(hash / 36000) % 10000) + 1) / 10001;
    const distanceKm = Math.max(0.35, radiusKm * 0.92 * Math.sqrt(radialSeed));
    const latOffset = (distanceKm * Math.cos(angle)) / 111.32;
    const lonScale = Math.max(0.12, Math.cos(center.lat * Math.PI / 180));
    const lonOffset = (distanceKm * Math.sin(angle)) / (111.32 * lonScale);

    return {
      lat: Math.max(-89.9, Math.min(89.9, center.lat + latOffset)),
      lon: normalizeThreatLensLongitude(center.lon + lonOffset),
    };
  }

  private buildRadiusPolygon(center: ThreatLensCoordinates, radiusKm: number): any {
    const ring: number[][] = [];
    const latRad = center.lat * Math.PI / 180;
    const lonRad = center.lon * Math.PI / 180;
    const angularDistance = radiusKm / 6371.0088;

    for (let step = 0; step <= 96; step += 1) {
      const bearing = (step / 96) * Math.PI * 2;
      const pointLat = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing));
      const pointLon = lonRad + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat));
      ring.push([normalizeThreatLensLongitude(pointLon * 180 / Math.PI), pointLat * 180 / Math.PI]);
    }

    return {
      type: 'polygon',
      rings: [ring],
      spatialReference: { wkid: 4326 },
    };
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

  private focusArea(center: ThreatLensCoordinates, radiusKm: number): void {
    if (!this.view) {
      return;
    }

    const altitude = Math.max(450000, Math.min(12000000, radiusKm * 12000));
    void this.view.goTo({
      position: {
        longitude: center.lon,
        latitude: center.lat,
        z: altitude,
      },
      tilt: 0,
    }, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
  }
}
