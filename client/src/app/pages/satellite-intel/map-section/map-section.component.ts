import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, EventEmitter, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import maplibregl, { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../shared/model/satellite-intel/satellite-intel-api.models';
import { OrionSatelliteFeature } from '../model/satellite-intel.model';

interface GeoJSONFeature {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, any>;
}


@Component({
  selector: 'app-satellite-map-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-section.component.html',
  host: { 'class': 'block h-full w-full' },
})
export class MapSectionComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static readonly WORLD_BOUNDS = [[-85.05112878, -180], [85.05112878, 180]] as const;
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;
  private map: MapLibreMap | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private moveTimer: any = null;
  private mapReady = false;

  zoomLabel = 'zoom 2.5';
  isMapFeaturesHovered = false;

  @Input() isScanning = false;
  @Input() progress = 0;
  @Input() currentStep = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage: string | null = null;
  @Input() hasSearched = false;
  @Input() lat: number | null = null;
  @Input() lon: number | null = null;
  @Input() delta = 0.05;
  @Input() selectedLayer: 'esri' | 'osm' = 'esri';
  @Input() facilitiesVisible = true;
  @Input() orionData: OrionSatelliteFeature[] = [];
  @Input() focusedFeature: OrionSatelliteFeature | null = null;
  @Input() anomalyData: any | null = null;
  @Input() aircraftData: SatelliteLiveAircraft[] = [];
  @Input() shipsData: SatelliteLiveShip[] = [];

  @Output() mapMoved = new EventEmitter<{ lat: number; lon: number; zoom: number }>();
  @Output() featureSelected = new EventEmitter<OrionSatelliteFeature>();

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Loading satellite data...';
    }
    if (raw.toLowerCase().includes('queue')) {
      return 'Queued — waiting...';
    }
    return raw;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.mapReady) {
      return;
    }
    if (changes['lat'] || changes['lon'] || changes['delta']) {
      this.updateMapView();
    }
    if (changes['orionData'] || changes['facilitiesVisible']) {
      this.renderOrionData();
    }
    if (changes['focusedFeature']) {
      this.focusOnFeature();
    }
    if (changes['anomalyData']) {
      this.renderAnomaly();
    }
    if (changes['aircraftData']) {
      this.renderAircraft();
    }
    if (changes['shipsData']) {
      this.renderShips();
    }
    if (changes['selectedLayer']) {
      this.switchLayer();
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.moveTimer);
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private initMap(): void {
    if (!this.mapContainer?.nativeElement) {
      return;
    }

    const container = this.mapContainer.nativeElement;

    this.map = new maplibregl.Map({
      container,
      style: this.buildMapStyle(),
      center: [this.lon ?? 67.35, this.lat ?? 24.78],
      zoom: this.deltaToZoom(this.delta),
      minZoom: 1,
      maxZoom: 18,
      attributionControl: false,
      renderWorldCopies: true,
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    this.map.on('load', () => {
      if (!this.map) {
        return;
      }
      this.installSources();
      this.installLayers();
      this.mapReady = true;
      this.updateMapView();
    });

    this.map.on('moveend', () => {
      const center = this.map?.getCenter();
      const zoom = this.map?.getZoom();
      if (!center || zoom === undefined) {
        return;
      }

      this.zoomLabel = `zoom ${zoom.toFixed(1)}  ·  ${center.lat.toFixed(4)}°N  ${center.lng.toFixed(4)}°E`;

      clearTimeout(this.moveTimer);
      this.moveTimer = setTimeout(() => {
        this.mapMoved.emit({ lat: center.lat, lon: center.lng, zoom });
      }, 300);
    });

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        setTimeout(() => this.map?.resize(), 0);
      }
    });
    this.resizeObserver.observe(container);
  }

  private installSources(): void {
    if (!this.map) {
      return;
    }

    // WRI and facilities source with clustering
    this.map.addSource('orion-features', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 50,
      clusterMaxZoom: 8,
      promoteId: 'id',
    });

    // Focus layer (no clustering)
    this.map.addSource('focus-feature', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Anomaly zones
    this.map.addSource('anomaly-zones', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Aircraft
    this.map.addSource('aircraft-tracks', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 7,
      promoteId: 'id',
    });

    // Ships
    this.map.addSource('ship-tracks', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterRadius: 40,
      clusterMaxZoom: 7,
      promoteId: 'id',
    });
  }

  private installLayers(): void {
    if (!this.map) {
      return;
    }

    // Orion clusters
    this.map.addLayer({
      id: 'orion-clusters',
      type: 'circle',
      source: 'orion-features',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#60a5fa', 25, '#06b6d4', 100, '#3b82f6'],
        'circle-radius': ['step', ['get', 'point_count'], 18, 25, 24, 100, 30],
        'circle-opacity': 0.8,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 1.5,
      },
    });

    this.map.addLayer({
      id: 'orion-cluster-count',
      type: 'symbol',
      source: 'orion-features',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Open Sans Bold'],
        'text-size': 11,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#fff',
      },
    });

    // Individual orion features
    this.map.addLayer({
      id: 'orion-features-layer',
      type: 'circle',
      source: 'orion-features',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 3, 10, 6, 16, 8],
        'circle-color': ['coalesce', ['get', 'color'], '#3b82f6'],
        'circle-opacity': ['coalesce', ['get', 'opacity'], 0.8],
        'circle-stroke-color': '#fff',
        'circle-stroke-width': 0.5,
      },
    });

    // Anomaly zones
    this.map.addLayer({
      id: 'anomaly-zones-layer',
      type: 'fill',
      source: 'anomaly-zones',
      paint: {
        'fill-color': ['coalesce', ['get', 'color'], '#ef4444'],
        'fill-opacity': 0.1,
      },
    });

    this.map.addLayer({
      id: 'anomaly-zones-outline',
      type: 'line',
      source: 'anomaly-zones',
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#ef4444'],
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });

    // Focus feature (highlighted)
    this.map.addLayer({
      id: 'focus-feature-layer',
      type: 'circle',
      source: 'focus-feature',
      paint: {
        'circle-radius': 10,
        'circle-color': '#fff',
        'circle-opacity': 0.9,
        'circle-stroke-color': ['coalesce', ['get', 'color'], '#3b82f6'],
        'circle-stroke-width': 3,
      },
    });

    // Aircraft
    this.map.addLayer({
      id: 'aircraft-layer',
      type: 'symbol',
      source: 'aircraft-tracks',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'aircraft-icon',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 0.7, 12, 0.95],
        'icon-rotate': ['coalesce', ['get', 'heading'], 0],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });

    // Ships
    this.map.addLayer({
      id: 'ships-layer',
      type: 'symbol',
      source: 'ship-tracks',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'icon-image': 'ship-icon',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 0.7, 12, 0.95],
        'icon-rotate': ['coalesce', ['get', 'heading'], 0],
        'icon-rotation-alignment': 'map',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });

    // Click handlers
    this.map.on('click', 'orion-features-layer', (e) => {
      const feature = e.features?.[0];
      if (feature?.properties?.['orionFeature']) {
        const orionFeature = JSON.parse(feature.properties['orionFeature']);
        this.featureSelected.emit(orionFeature);
      }
    });

    this.map.on('mouseenter', 'orion-features-layer', () => {
      this.isMapFeaturesHovered = true;
    });

    this.map.on('mouseleave', 'orion-features-layer', () => {
      this.isMapFeaturesHovered = false;
    });

    // Install icons
    this.installIcons();
  }

  private installIcons(): void {
    if (!this.map) {
      return;
    }

    if (!this.map.hasImage('aircraft-icon')) {
      this.map.addImage('aircraft-icon', this.drawAircraftIcon(), { pixelRatio: 2 });
    }
    if (!this.map.hasImage('ship-icon')) {
      this.map.addImage('ship-icon', this.drawShipIcon(), { pixelRatio: 2 });
    }
  }

  private drawAircraftIcon(): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new ImageData(1, 1);
    }

    ctx.translate(36, 36);
    ctx.beginPath();
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

    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private drawShipIcon(): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return new ImageData(1, 1);
    }

    ctx.translate(36, 36);
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(14, 0);
    ctx.lineTo(12, 20);
    ctx.lineTo(0, 24);
    ctx.lineTo(-12, 20);
    ctx.lineTo(-14, 0);
    ctx.closePath();

    ctx.fillStyle = '#10b981';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private updateMapView(): void {
    if (!this.map) {
      return;
    }

    if (this.lat !== null && this.lon !== null) {
      const zoom = this.deltaToZoom(this.delta);
      this.map.easeTo({
        center: [this.lon, this.lat],
        zoom,
        duration: 600,
        essential: true,
      });
    }
  }

  private renderOrionData(): void {
    if (!this.map) {
      return;
    }

    const orionSource = this.map.getSource('orion-features') as GeoJSONSource;
    if (!orionSource) {
      return;
    }

    const features: GeoJSONFeature[] = (this.orionData || [])
      .filter(feat => this.facilitiesVisible || feat.source === 'WRI')
      .map((feat, _idx) => ({
        type: 'Feature' as const,
        id: feat.id,
        geometry: { type: 'Point' as const, coordinates: [feat.coordinates[0], feat.coordinates[1]] },
        properties: {
          id: feat.id,
          name: feat.name,
          type: feat.type,
          source: feat.source,
          color: feat.color,
          opacity: feat.source === 'WRI' ? 0.72 : 0.88,
          orionFeature: JSON.stringify(feat),
        },
      }));

    orionSource.setData({
      type: 'FeatureCollection',
      features,
    });
  }

  private focusOnFeature(): void {
    if (!this.map) {
      return;
    }

    const focusSource = this.map.getSource('focus-feature') as GeoJSONSource;
    if (!focusSource) {
      return;
    }

    if (!this.focusedFeature) {
      focusSource.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const feat = this.focusedFeature;
    const feature: GeoJSONFeature = {
      type: 'Feature',
      id: feat.id,
      geometry: { type: 'Point', coordinates: [feat.coordinates[0], feat.coordinates[1]] },
      properties: { color: feat.color, name: feat.name },
    };

    focusSource.setData({ type: 'FeatureCollection', features: [feature] });
    this.map.easeTo({
      center: [feat.coordinates[0], feat.coordinates[1]],
      zoom: Math.max((this.map.getZoom() || 3), 8),
      duration: 600,
      essential: true,
    });
  }

  private renderAnomaly(): void {
    if (!this.map || !this.anomalyData?.bbox) {
      return;
    }

    const anomalySource = this.map.getSource('anomaly-zones') as GeoJSONSource;
    if (!anomalySource) {
      return;
    }

    const [minLon, minLat, maxLon, maxLat] = this.anomalyData.bbox;
    const colorMap: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', nominal: '#22c55e', unknown: '#3b82f6' };

    const feature: GeoJSONFeature = {
      type: 'Feature',
      id: 'anomaly-1',
      geometry: {
        type: 'Point',
        coordinates: [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
      },
      properties: {
        bbox: [minLon, minLat, maxLon, maxLat],
        color: colorMap[this.anomalyData.alert_level] || '#3b82f6',
        alertLevel: this.anomalyData.alert_level,
        deltaScore: this.anomalyData.delta_score,
      },
    };

    anomalySource.setData({ type: 'FeatureCollection', features: [feature] });

    // Update anomaly zone fill feature
    const fillFeature = {
      type: 'Feature' as const,
      id: 'anomaly-fill',
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]],
      },
      properties: { color: colorMap[this.anomalyData.alert_level] || '#3b82f6' },
    };

    anomalySource.setData({ type: 'FeatureCollection', features: [fillFeature as any] });
  }

  private renderAircraft(): void {
    if (!this.map) {
      return;
    }

    const aircraftSource = this.map.getSource('aircraft-tracks') as GeoJSONSource;
    if (!aircraftSource) {
      return;
    }

    const features = (this.aircraftData || [])
      .filter(ac => typeof ac.latitude === 'number' && typeof ac.longitude === 'number')
      .map((ac) => ({
        type: 'Feature' as const,
        id: ac.icao24 || ac.callsign || `${ac.latitude}:${ac.longitude}`,
        geometry: { type: 'Point' as const, coordinates: [ac.longitude as number, ac.latitude as number] },
        properties: {
          label: ac.callsign || ac.icao24 || 'Unknown',
          heading: ac.true_track ?? 0,
          speed: ac.velocity ?? 0,
          altitude: ac.baro_altitude ?? 0,
        },
      }));

    aircraftSource.setData({ type: 'FeatureCollection', features });
  }

  private renderShips(): void {
    if (!this.map) {
      return;
    }

    const shipsSource = this.map.getSource('ship-tracks') as GeoJSONSource;
    if (!shipsSource) {
      return;
    }

    const features = (this.shipsData || [])
      .filter(sh => typeof sh.latitude === 'number' && typeof sh.longitude === 'number')
      .map((sh) => ({
        type: 'Feature' as const,
        id: sh.mmsi || sh.name || `${sh.latitude}:${sh.longitude}`,
        geometry: { type: 'Point' as const, coordinates: [sh.longitude as number, sh.latitude as number] },
        properties: {
          label: sh.name || sh.mmsi || 'Unknown',
          heading: sh.course ?? sh.true_heading ?? 0,
          speed: sh.speed ?? 0,
          destination: sh.destination ?? 'Unknown',
        },
      }));

    shipsSource.setData({ type: 'FeatureCollection', features });
  }

  private switchLayer(): void {
    if (!this.map) {
      return;
    }
    // eslint-disable-next-line no-restricted-syntax
    this.map.setStyle(this.buildMapStyle());
  }

  private buildMapStyle(): maplibregl.StyleSpecification {
    const isEsri = this.selectedLayer === 'esri';
    const tileUrl = isEsri
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png';
    const attribution = isEsri
      ? 'Tiles &copy; Esri'
      : '&copy; OpenStreetMap contributors &copy; CARTO';

    return {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        'satellite-basemap': {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          attribution,
        },
      },
      layers: [
        {
          id: 'satellite-basemap',
          type: 'raster',
          source: 'satellite-basemap',
          paint: {
            'raster-opacity': isEsri ? 1 : 0.95,
            'raster-saturation': isEsri ? 0 : -0.15,
            'raster-contrast': isEsri ? 0.05 : 0.1,
          },
        },
      ],
    };
  }

  private deltaToZoom(delta: number): number {
    if (delta <= 0.005) {
      return 17;
    }
    if (delta <= 0.01) {
      return 16;
    }
    if (delta <= 0.02) {
      return 15;
    }
    if (delta <= 0.04) {
      return 14;
    }
    if (delta <= 0.08) {
      return 13;
    }
    if (delta <= 0.15) {
      return 12;
    }
    if (delta <= 0.3) {
      return 11;
    }
    if (delta <= 0.6) {
      return 10;
    }
    return 9;
  }
}
