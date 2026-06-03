import { geoContains } from 'd3-geo';
import { feature as topojsonFeature } from 'topojson-client';
import { OrionSatelliteFeature } from '../../models/geo-fencing.models';

export class CountryBoundaryMapRenderer {
  private boundaryLayer: any = null;
  private highlightLayer: any = null;
  private hoverLayer: any = null;
  private countryFeatures: any[] = [];
  private highlightedFeature: any | null = null;

  constructor(private L: any, private map: any) {}

  async init(): Promise<void> {
    if (!this.map || !this.L || this.boundaryLayer) {
      this.updateHighlight();
      return;
    }

    try {
      const response = await fetch('/assets/data/map/world.json');
      if (!response.ok) {
        console.error('[Country Highlight] Failed to fetch world.json:', response.status);
        return;
      }

      const topology = await response.json();
      const countryCollection = topojsonFeature(topology, topology.objects?.countries) as any;
      this.countryFeatures = Array.isArray(countryCollection?.features) ? countryCollection.features : [];
      const renderableCountryCollection = {
        ...countryCollection,
        features: this.countryFeatures.map((feature: any) => this.normalizeFeature(feature)),
      };

      this.highlightLayer = this.L.geoJSON(null, {
        interactive: false,
        noClip: true,
        style: () => this.getHighlightStyle(),
      }).addTo(this.map);

      this.hoverLayer = this.L.geoJSON(null, {
        interactive: false,
        noClip: true,
        style: () => this.getHoverStyle(),
      }).addTo(this.map);

      this.boundaryLayer = this.L.geoJSON(renderableCountryCollection, {
        interactive: true,
        noClip: true,
        smoothFactor: 0,
        style: () => this.getBoundaryStyle(),
        onEachFeature: (feature: any, layer: any) => this.bindCountryFeature(feature, layer),
      }).addTo(this.map);

      this.updateHighlight();
    }
    catch (error) {
      console.error('[Country Highlight] Error loading country data:', error);
      this.countryFeatures = [];
    }
  }

  setFocusedFeature(feature: OrionSatelliteFeature | null): void {
    const coordinates = this.getFeatureCoordinates(feature);
    this.highlightedFeature = coordinates
      ? this.countryFeatures.find((countryFeature: any) => {
        try {
          return geoContains(countryFeature, coordinates);
        }
        catch {
          return false;
        }
      }) ?? null
      : null;
    this.updateHighlight();
  }

  destroy(): void {
    [this.boundaryLayer, this.highlightLayer, this.hoverLayer].forEach(layer => {
      if (layer) {
        this.map?.removeLayer(layer);
      }
    });
    this.boundaryLayer = null;
    this.highlightLayer = null;
    this.hoverLayer = null;
    this.countryFeatures = [];
    this.highlightedFeature = null;
  }

  private bindCountryFeature(feature: any, layer: any): void {
    const countryName = feature?.properties?.name || 'Country';
    layer.bindTooltip(countryName, {
      direction: 'center',
      sticky: true,
      opacity: 0.95,
      className: 'country-hover-tooltip',
    });
    layer.on('click', () => this.toggleCountryHighlight(feature));
    layer.on('mouseover', () => this.showCountryHover(feature));
    layer.on('mouseout', () => this.clearCountryHover());
  }

  private toggleCountryHighlight(feature: any): void {
    if (this.isSameFeature(feature, this.highlightedFeature)) {
      this.highlightedFeature = null;
      this.updateHighlight();
      return;
    }
    this.highlightedFeature = feature;
    this.updateHighlight();
  }

  private showCountryHover(feature: any): void {
    try {
      this.hoverLayer?.clearLayers();
      this.hoverLayer?.addData(feature);
      this.hoverLayer?.bringToFront();
    }
    catch { }
  }

  private clearCountryHover(): void {
    try {
      this.hoverLayer?.clearLayers();
      this.updateHighlight();
    }
    catch { }
  }

  private updateHighlight(): void {
    if (!this.highlightLayer) {
      return;
    }
    this.highlightLayer.clearLayers();
    if (this.highlightedFeature) {
      this.highlightLayer.addData(this.highlightedFeature);
      this.highlightLayer.bringToFront();
    }
  }

  private getBoundaryStyle(): Record<string, any> {
    return {
      color: 'rgba(0,0,0,0.45)',
      weight: 0.8,
      opacity: 0.55,
      fillColor: 'rgba(0,0,0,0)',
      fillOpacity: 0,
      lineJoin: 'round',
      lineCap: 'round',
    };
  }

  private getHoverStyle(): Record<string, any> {
    return {
      color: 'rgba(96,165,250,0.98)',
      weight: 2.5,
      opacity: 1,
      fillColor: 'rgba(96,165,250,0.08)',
      fillOpacity: 0.08,
      lineJoin: 'round',
      lineCap: 'round',
    };
  }

  private getHighlightStyle(): Record<string, any> {
    return {
      color: 'rgba(59,130,246,0.98)',
      weight: 2.2,
      opacity: 0.95,
      fillColor: 'rgba(56,189,248,0)',
      fillOpacity: 0,
      lineJoin: 'round',
      lineCap: 'round',
    };
  }

  private normalizeFeature(feature: any): any {
    if (!feature?.geometry) {
      return feature;
    }
    return {
      ...feature,
      geometry: this.normalizeGeometry(feature.geometry),
    };
  }

  private normalizeGeometry(geometry: any): any {
    const type = geometry?.type;
    const coordinates = geometry?.coordinates;

    if (!type || !coordinates) {
      return geometry;
    }

    if (type === 'Polygon') {
      return {
        ...geometry,
        coordinates: coordinates.map((ring: any) => this.unwrapRing(ring)),
      };
    }

    if (type === 'MultiPolygon') {
      return {
        ...geometry,
        coordinates: coordinates.map((polygon: any) => polygon.map((ring: any) => this.unwrapRing(ring))),
      };
    }

    return geometry;
  }

  private unwrapRing(ring: any[]): any[] {
    if (!Array.isArray(ring) || ring.length < 2) {
      return ring;
    }

    const normalizedRing: any[] = [];
    let offset = 0;
    const firstPoint = ring[0];
    normalizedRing.push([firstPoint[0], firstPoint[1]]);
    let previousLongitude = firstPoint[0];

    for (let index = 1; index < ring.length; index += 1) {
      const point = ring[index];
      if (!Array.isArray(point) || point.length < 2) {
        continue;
      }

      let longitude = point[0] + offset;
      const latitude = point[1];

      while (longitude - previousLongitude > 180) {
        offset -= 360;
        longitude = point[0] + offset;
      }

      while (previousLongitude - longitude > 180) {
        offset += 360;
        longitude = point[0] + offset;
      }

      normalizedRing.push([longitude, latitude]);
      previousLongitude = longitude;
    }

    return normalizedRing;
  }

  private getFeatureCoordinates(feature: OrionSatelliteFeature | null): [number, number] | null {
    const coordinates = feature?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const [lon, lat] = coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return null;
    }

    return [lon, lat];
  }

  private isSameFeature(left: any, right: any): boolean {
    if (!left || !right) {
      return false;
    }

    const leftId = left?.id ?? left?.properties?.name ?? left?.properties?.iso_a3 ?? left?.properties?.admin;
    const rightId = right?.id ?? right?.properties?.name ?? right?.properties?.iso_a3 ?? right?.properties?.admin;
    return String(leftId || '').trim() !== '' && String(leftId) === String(rightId);
  }
}
