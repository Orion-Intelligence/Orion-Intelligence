import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../shared/model/satellite-intel/satellite-intel-api.models';

type TrackKind = 'aircraft' | 'ship';

interface TrackingProperties {
  id: string;
  kind: TrackKind;
  label: string;
  heading: number;
  speed: number | null;
  altitude?: number | null;
  destination?: string | null;
}

interface TrackingFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: TrackingProperties;
}

interface TrackingFeatureCollection {
  type: 'FeatureCollection';
  features: TrackingFeature[];
}

interface TrackedEntityState {
  id: string;
  kind: TrackKind;
  label: string;
  heading: number;
  speed: number | null;
  altitude?: number | null;
  destination?: string | null;
  fromLon: number;
  fromLat: number;
  toLon: number;
  toLat: number;
  renderedLon: number;
  renderedLat: number;
}

@Component({
  selector: 'app-satellite-tracking-map-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-map-section.component.html',
  host: {
    'class': 'block h-full w-full',
  },
})
export class TrackingMapSectionComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;

  @Input() lat: number | null = null;
  @Input() lon: number | null = null;
  @Input() delta = 0.05;
  @Input() aircraftData: SatelliteLiveAircraft[] = [];
  @Input() shipsData: SatelliteLiveShip[] = [];
  @Input() aircraftTrackingEnabled = false;
  @Input() shipsTrackingEnabled = false;
  @Input() globalAircraftTrackingEnabled = false;
  @Input() globalShipsTrackingEnabled = false;

  @Output() mapMoved = new EventEmitter<{ lat: number; lon: number; zoom: number }>();

  zoomLabel = 'zoom 5';
  lastAircraftUpdateLabel = 'idle';
  lastShipsUpdateLabel = 'idle';

  private map: MapLibreMap | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private aircraftStates = new Map<string, TrackedEntityState>();
  private shipStates = new Map<string, TrackedEntityState>();
  private animationFrameId: number | null = null;
  private animationStartedAt = 0;
  private readonly animationDurationMs = 1200;
  private mapReady = false;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['lat'] || changes['lon'] || changes['delta']) && this.mapReady) {
      this.syncViewport();
    }

    if (changes['aircraftData']) {
      this.aircraftStates = this.mergeAircraft(this.aircraftData);
      this.lastAircraftUpdateLabel = this.formatUpdateLabel(this.aircraftData.length, 25);
      this.kickAnimation();
    }

    if (changes['shipsData']) {
      this.shipStates = this.mergeShips(this.shipsData);
      this.lastShipsUpdateLabel = this.formatUpdateLabel(this.shipsData.length, 8);
      this.kickAnimation();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  get aircraftCount(): number {
    return this.aircraftStates.size;
  }

  get shipCount(): number {
    return this.shipStates.size;
  }

  get aircraftModeLabel(): string {
    if (!this.aircraftTrackingEnabled && !this.globalAircraftTrackingEnabled) {
      return 'aircraft idle';
    }
    return this.globalAircraftTrackingEnabled ? 'aircraft global' : 'aircraft local';
  }

  get shipsModeLabel(): string {
    if (!this.shipsTrackingEnabled && !this.globalShipsTrackingEnabled) {
      return 'ships idle';
    }
    return this.globalShipsTrackingEnabled ? 'ships global' : 'ships local';
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement || typeof window === 'undefined') {
      return;
    }

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: this.buildTrackingStyle(),
      center: [this.lon ?? 67.35, this.lat ?? 24.78],
      zoom: this.deltaToZoom(this.delta),
      minZoom: 2,
      maxZoom: 14,
      attributionControl: false,
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    this.map.on('load', () => {
      if (!this.map) {
        return;
      }

      this.installTrackImages(this.map);
      this.installSources(this.map);
      this.installLayers(this.map);
      this.mapReady = true;
      this.syncViewport();
      this.pushSourceData();
      this.updateZoomLabel();
    });

    this.map.on('moveend', () => {
      this.updateZoomLabel();
      const center = this.map?.getCenter();
      const zoom = this.map?.getZoom();
      if (!center || zoom === undefined) {
        return;
      }
      this.mapMoved.emit({ lat: center.lat, lon: center.lng, zoom });
    });

    this.resizeObserver = new ResizeObserver(() => this.map?.resize());
    this.resizeObserver.observe(this.mapContainer.nativeElement);
  }

  private installSources(map: MapLibreMap): void {
    map.addSource('aircraft-tracks', {
      type: 'geojson',
      data: this.emptyCollection(),
      cluster: true,
      clusterRadius: 42,
      clusterMaxZoom: 7,
      promoteId: 'id',
    });

    map.addSource('ship-tracks', {
      type: 'geojson',
      data: this.emptyCollection(),
      cluster: true,
      clusterRadius: 44,
      clusterMaxZoom: 7,
      promoteId: 'id',
    });
  }

  private installLayers(map: MapLibreMap): void {
    map.addLayer({
      id: 'aircraft-clusters',
      type: 'circle',
      source: 'aircraft-tracks',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#8b5cf6',
        'circle-opacity': 0.72,
        'circle-stroke-color': '#ddd6fe',
        'circle-stroke-width': 1.25,
        'circle-radius': ['step', ['get', 'point_count'], 16, 25, 20, 100, 26],
      },
    });

    map.addLayer({
      id: 'aircraft-cluster-count',
      type: 'symbol',
      source: 'aircraft-tracks',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#f5f3ff',
      },
    });

    map.addLayer({
      id: 'aircraft-points',
      type: 'symbol',
      source: 'aircraft-tracks',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'aircraft-track-icon',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 0.7, 12, 0.95],
        'icon-rotate': ['coalesce', ['get', 'heading'], 0],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {
        'icon-opacity': 0.95,
      },
    });

    map.addLayer({
      id: 'ship-clusters',
      type: 'circle',
      source: 'ship-tracks',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#06b6d4',
        'circle-opacity': 0.72,
        'circle-stroke-color': '#cffafe',
        'circle-stroke-width': 1.25,
        'circle-radius': ['step', ['get', 'point_count'], 15, 25, 19, 100, 25],
      },
    });

    map.addLayer({
      id: 'ship-cluster-count',
      type: 'symbol',
      source: 'ship-tracks',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ecfeff',
      },
    });

    map.addLayer({
      id: 'ship-points',
      type: 'symbol',
      source: 'ship-tracks',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'ship-track-icon',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.52, 7, 0.7, 12, 0.92],
        'icon-rotate': ['coalesce', ['get', 'heading'], 0],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {
        'icon-opacity': 0.92,
      },
    });
  }

  private installTrackImages(map: MapLibreMap): void {
    if (!map.hasImage('aircraft-track-icon')) {
      map.addImage('aircraft-track-icon', this.drawTrackIcon('#fbbf24', '#f59e0b', 'aircraft'), { pixelRatio: 2 });
    }
    if (!map.hasImage('ship-track-icon')) {
      map.addImage('ship-track-icon', this.drawTrackIcon('#34d399', '#059669', 'ship'), { pixelRatio: 2 });
    }
  }

  private drawTrackIcon(fill: string, stroke: string, kind: TrackKind): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new ImageData(1, 1);
    }

    ctx.translate(36, 36);
    ctx.beginPath();
    if (kind === 'aircraft') {
      ctx.moveTo(0, -26);
      ctx.lineTo(11, 2);
      ctx.lineTo(24, 7);
      ctx.lineTo(11, 10);
      ctx.lineTo(4, 26);
      ctx.lineTo(0, 14);
      ctx.lineTo(-4, 26);
      ctx.lineTo(-11, 10);
      ctx.lineTo(-24, 7);
      ctx.lineTo(-11, 2);
      ctx.closePath();
    }
    else {
      ctx.moveTo(0, -24);
      ctx.lineTo(15, -2);
      ctx.lineTo(10, 22);
      ctx.lineTo(0, 27);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-15, -2);
      ctx.closePath();
    }
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(15,23,42,0.55)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private kickAnimation(): void {
    if (!this.mapReady) {
      return;
    }

    this.animationStartedAt = performance.now();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame((timestamp) => this.animate(timestamp));
  }

  private animate(timestamp: number): void {
    const progress = Math.min(1, (timestamp - this.animationStartedAt) / this.animationDurationMs);

    this.applyInterpolatedPositions(this.aircraftStates, progress);
    this.applyInterpolatedPositions(this.shipStates, progress);
    this.pushSourceData();

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame((nextTimestamp) => this.animate(nextTimestamp));
      return;
    }

    this.animationFrameId = null;
  }

  private applyInterpolatedPositions(store: Map<string, TrackedEntityState>, progress: number): void {
    store.forEach((state) => {
      state.renderedLon = this.interpolate(state.fromLon, state.toLon, progress);
      state.renderedLat = this.interpolate(state.fromLat, state.toLat, progress);
    });
  }

  private pushSourceData(): void {
    if (!this.map) {
      return;
    }

    const aircraftSource = this.map.getSource('aircraft-tracks') as GeoJSONSource | undefined;
    const shipSource = this.map.getSource('ship-tracks') as GeoJSONSource | undefined;

    aircraftSource?.setData(this.toCollection(this.aircraftStates));
    shipSource?.setData(this.toCollection(this.shipStates));
  }

  private mergeAircraft(items: SatelliteLiveAircraft[]): Map<string, TrackedEntityState> {
    const next = new Map<string, TrackedEntityState>();

    for (const item of items || []) {
      const lon = this.roundCoord(item.longitude);
      const lat = this.roundCoord(item.latitude);
      if (lon === null || lat === null) {
        continue;
      }

      const id = (item.icao24 || item.callsign || `${lat}:${lon}`).trim();
      const previous = this.aircraftStates.get(id);
      next.set(id, {
        id,
        kind: 'aircraft',
        label: (item.callsign || item.icao24 || 'Unknown flight').trim(),
        heading: this.normalizeHeading(item.true_track),
        speed: this.roundMetric(item.velocity, 1),
        altitude: this.roundMetric(item.baro_altitude, 0),
        fromLon: previous?.renderedLon ?? lon,
        fromLat: previous?.renderedLat ?? lat,
        toLon: lon,
        toLat: lat,
        renderedLon: previous?.renderedLon ?? lon,
        renderedLat: previous?.renderedLat ?? lat,
      });
    }

    return next;
  }

  private mergeShips(items: SatelliteLiveShip[]): Map<string, TrackedEntityState> {
    const next = new Map<string, TrackedEntityState>();

    for (const item of items || []) {
      const lon = this.roundCoord(item.longitude);
      const lat = this.roundCoord(item.latitude);
      if (lon === null || lat === null) {
        continue;
      }

      const id = (item.mmsi || item.name || `${lat}:${lon}`).trim();
      const previous = this.shipStates.get(id);
      next.set(id, {
        id,
        kind: 'ship',
        label: (item.name || item.mmsi || 'Unknown vessel').trim(),
        heading: this.normalizeHeading(item.course ?? item.true_heading),
        speed: this.roundMetric(item.speed, 1),
        destination: item.destination ?? null,
        fromLon: previous?.renderedLon ?? lon,
        fromLat: previous?.renderedLat ?? lat,
        toLon: lon,
        toLat: lat,
        renderedLon: previous?.renderedLon ?? lon,
        renderedLat: previous?.renderedLat ?? lat,
      });
    }

    return next;
  }

  private toCollection(store: Map<string, TrackedEntityState>): TrackingFeatureCollection {
    const features: TrackingFeature[] = [];
    store.forEach((state) => {
      features.push({
        type: 'Feature',
        id: state.id,
        geometry: {
          type: 'Point',
          coordinates: [state.renderedLon, state.renderedLat],
        },
        properties: {
          id: state.id,
          kind: state.kind,
          label: state.label,
          heading: state.heading,
          speed: state.speed,
          altitude: state.altitude ?? null,
          destination: state.destination ?? null,
        },
      });
    });
    return { type: 'FeatureCollection', features };
  }

  private syncViewport(): void {
    if (!this.map || this.lat === null || this.lon === null) {
      return;
    }

    const nextZoom = this.deltaToZoom(this.delta);
    const currentCenter = this.map.getCenter();
    const currentZoom = this.map.getZoom();
    const centerChanged = Math.abs(currentCenter.lat - this.lat) > 0.0001 || Math.abs(currentCenter.lng - this.lon) > 0.0001;
    const zoomChanged = Math.abs(currentZoom - nextZoom) > 0.1;

    if (!centerChanged && !zoomChanged) {
      return;
    }

    this.map.easeTo({
      center: [this.lon, this.lat],
      zoom: nextZoom,
      duration: 800,
      essential: true,
    });
  }

  private updateZoomLabel(): void {
    if (!this.map) {
      return;
    }
    const center = this.map.getCenter();
    this.zoomLabel = `zoom ${this.map.getZoom().toFixed(1)}  ·  ${center.lat.toFixed(3)}°  ${center.lng.toFixed(3)}°`;
  }

  private buildTrackingStyle(): maplibregl.StyleSpecification {
    return {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'tracking-basemap': {
          type: 'raster',
          tiles: ['https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        },
      },
      layers: [
        {
          id: 'tracking-basemap',
          type: 'raster',
          source: 'tracking-basemap',
          paint: {
            'raster-opacity': 0.92,
            'raster-saturation': -0.2,
            'raster-contrast': 0.08,
          },
        },
      ],
    };
  }

  private emptyCollection(): TrackingFeatureCollection {
    return { type: 'FeatureCollection', features: [] };
  }

  private deltaToZoom(delta: number): number {
    if (delta <= 0.005) {
      return 12.8;
    }
    if (delta <= 0.01) {
      return 12.1;
    }
    if (delta <= 0.02) {
      return 11.4;
    }
    if (delta <= 0.04) {
      return 10.8;
    }
    if (delta <= 0.08) {
      return 10.2;
    }
    if (delta <= 0.15) {
      return 9.4;
    }
    if (delta <= 0.3) {
      return 8.4;
    }
    if (delta <= 0.6) {
      return 7.4;
    }
    return 5.4;
  }

  private interpolate(start: number, end: number, progress: number): number {
    return start + ((end - start) * progress);
  }

  private roundCoord(value: number | null | undefined): number | null {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }
    return Number(value.toFixed(5));
  }

  private roundMetric(value: number | null | undefined, digits: number): number | null {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }
    return Number(value.toFixed(digits));
  }

  private normalizeHeading(value: number | null | undefined): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }
    const normalized = value % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  private formatUpdateLabel(count: number, intervalSeconds: number): string {
    if (!count) {
      return 'idle';
    }
    return `${count} tracks · ~${intervalSeconds}s cadence`;
  }
}
