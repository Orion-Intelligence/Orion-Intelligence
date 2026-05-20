import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { geoContains } from 'd3-geo';
import { feature as topojsonFeature } from 'topojson-client';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { sidebarAnimation } from '../../../../../shared/animations/sidebar.animations';
import { SatelliteIntelService } from '../../satellite-intel-service';
import { ORION_POWER_FILTERS, OrionSatelliteFilterOption } from '../../model/satellite-intel.model';

@Component({
  selector:    'app-satellite-map-section',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './map-section.component.html',
  host:        {
    'class': 'block h-full w-full',
  },
  animations: [sidebarAnimation],
})
export class MapSectionComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static readonly WORLD_BOUNDS = [[-85.05112878, -180], [85.05112878, 180]] as const;
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;
  private leafletMap: any   = null;
  private esriLayer: any    = null;
  private esriLowResLayer: any = null;
  private osmLayer: any     = null;
  private osmLowResLayer: any = null;
  private facLayer: any     = null;
  private anomalyLayer: any = null;
  private orionCluster: any = null;
  private countryBoundaryLayer: any = null;
  private countryHighlightLayer: any = null;
  private countryHoverLayer: any = null;
  private orionMarkers = new Map<string, any>();
  private orionMarkerSignatures = new Map<string, string>();
  private clickMarker: any  = null;
  private L: any            = null;
  private moveTimer: any    = null;
  private resizeObserver: ResizeObserver | null = null;
  private aircraftCluster!: any;
  private sidebarRequestToken = 0;
  private markerZoomBucket = 0;
  private aircraftRenderKey = '';
  private aircraftRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private aircraftRenderVersion = 0;
  private aircraftMarkers = new Map<string, any>();
  private aircraftMarkerTargets = new Map<string, string>();
  private aircraftTrackLine: any = null;
  private aircraftAnimationFrames = new Map<string, { marker: any; startLat: number; startLon: number; targetLat: number; targetLon: number; startedAt: number }>();
  private aircraftAnimationFrame: number | null = null;
  private readonly aircraftAnimationDurationMs = 8000;
  private shipRenderKey = '';
  private shipRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private shipRenderVersion = 0;
  private shipMarkers = new Map<string, any>();
  private shipMarkerTargets = new Map<string, string>();
  private shipAnimationFrames = new Map<string, { marker: any; startLat: number; startLon: number; targetLat: number; targetLon: number; startedAt: number }>();
  private shipAnimationFrame: number | null = null;
  private readonly shipAnimationDurationMs = 8000;
  private orionRenderKey = '';
  private orionRenderVersion = 0;
  private orionRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private shipCluster!: any;
  private worldCountryFeatures: any[] = [];
  private highlightedCountryFeature: any | null = null;
  private locationBucketCache = new Map<string, string>();

  zoomLabel = 'zoom 2.5';
  isMapFeaturesHovered = false;
  selectedEntity: { type: 'aircraft' | 'ship'; data: any | null } | null = null;
  sidebarVisible = false;
  sidebarLoading = false;
  sidebarError: string | null = null;
  activeEntity: { type: 'aircraft' | 'ship'; id: string } | null = null;
  loadingEntity: { type: 'aircraft' | 'ship'; id: string } | null = null;

  @Input() legendFilters: OrionSatelliteFilterOption[] = ORION_POWER_FILTERS;
  @Input() isScanning       = false;
  @Input() progress         = 0;
  @Input() currentStep      = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage:     string | null = null;
  @Input() hasSearched      = false;
  @Input() lat:              number | null = null;
  @Input() lon:              number | null = null;
  @Input() delta             = 0.05;
  @Input() selectedLayer:    'esri' | 'osm' = 'esri';
  @Input() facilitiesVisible = true;
  @Input() facilitiesData:   any | null = null;
  @Input() anomalyData:      any | null = null;
  @Input() aircraftData:     SatelliteLiveAircraft[] = [];
  @Input() shipsData:        SatelliteLiveShip[]     = [];
  @Input() orionData:        any[] = [];
  @Input() focusedFeature:   any = null;

  @Output() mapMoved  = new EventEmitter<{ lat: number; lon: number; zoom: number }>();
  @Output() featureSelected = new EventEmitter<any>();
  @Output() featureIdsSelected = new EventEmitter<string[]>();

  constructor(private satelliteService: SatelliteIntelService, private cd: ChangeDetectorRef, private ngZone: NgZone) {}

  openSidebarLoading(type: 'aircraft' | 'ship', id: string, seedData: any) {
    const token = ++this.sidebarRequestToken;
    this.ngZone.run(() => {
      this.selectedEntity  = { type, data: seedData ?? null };
      this.sidebarVisible  = true;
      this.sidebarLoading  = true;
      this.sidebarError    = null;
      this.activeEntity    = { type, id };
      this.loadingEntity   = { type, id };
      this.refreshSelectionState();
      this.cd.detectChanges();
    });
    return token;
  }

  openSidebar(type: 'aircraft' | 'ship', data: any) {
    this.ngZone.run(() => {
      this.selectedEntity = { type, data };
      this.sidebarVisible = true;
      this.sidebarLoading = false;
      this.sidebarError = null;
      const id = this.getEntityId(type, data);
      this.activeEntity = id ? { type, id } : this.activeEntity;
      this.loadingEntity = null;
      this.refreshSelectionState();
      this.cd.detectChanges();
    });
  }

  openSidebarError(type: 'aircraft' | 'ship', id: string, message: string) {
    this.ngZone.run(() => {
      this.selectedEntity = { type, data: null };
      this.sidebarVisible = true;
      this.sidebarLoading = false;
      this.sidebarError = message || 'Unable to load details';
      this.activeEntity = { type, id };
      this.loadingEntity = null;
      this.refreshSelectionState();
      this.cd.detectChanges();
    });
  }

  closeSidebar() {
    this.selectedEntity = null;
    this.sidebarVisible = false;
    this.sidebarLoading = false;
    this.sidebarError = null;
    this.activeEntity = null;
    this.loadingEntity = null;
    if (this.aircraftTrackLine) {
      this.leafletMap?.removeLayer(this.aircraftTrackLine);
      this.aircraftTrackLine = null;
    }
    this.refreshSelectionState();
    this.cd.detectChanges();
  }

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
    if (changes['lat'] || changes['lon'] || changes['delta']) {
      this.updateMapView();
    }
    if (changes['facilitiesData'])  {
      this.renderFacilities();
    }
    if (changes['anomalyData'])     {
      this.renderAnomaly();
    }
    if (changes['aircraftData']) {
      this.aircraftRenderKey = '';
      this.renderAircraftCluster();
    }
    if (changes['shipsData']) {
      this.shipRenderKey = '';
      this.renderShipCluster();
    }
    if (changes['orionData'] || changes['facilitiesVisible']) {
      this.orionRenderVersion += 1;
      this.scheduleOrionRender();
    }
    if (changes['focusedFeature']) {
      this.focusOnFeature();
      this.orionRenderKey = '';
      this.scheduleOrionRender();
    }
    if (changes['selectedLayer'])   {
      this.switchLayer();
    }
    if (changes['facilitiesVisible']) {
      if (this.facLayer) {
        if (this.facilitiesVisible) {
          this.facLayer.addTo(this.leafletMap);
        }
        else {
          this.leafletMap?.removeLayer(this.facLayer);
        }
      }
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.moveTimer);
    if (this.orionRenderTimer) {
      clearTimeout(this.orionRenderTimer);
      this.orionRenderTimer = null;
    }
    this.cancelAircraftRender();
    this.cancelAllAircraftAnimations();
    this.cancelShipRender();
    this.cancelAllShipAnimations();
    this.resizeObserver?.disconnect();
    this.leafletMap?.remove();
  }

  private async initMap(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const L = (await import('leaflet' as any)) as any;
      this.L = L.default || L;
      if (!this.mapContainer?.nativeElement) {
        return;
      }

      this.leafletMap = this.L.map(this.mapContainer.nativeElement, {
        center:   [this.lat ?? 24.78, this.lon ?? 67.35],
        zoom:     2.5,
        minZoom:  2,
        zoomSnap: 0.5,
        zoomControl: true,
        attributionControl: false,
        maxBounds: this.L.latLngBounds(MapSectionComponent.WORLD_BOUNDS),
        maxBoundsViscosity: 1,
        worldCopyJump: false,
        zoomAnimation: false,
        fadeAnimation: false,
        scrollWheelZoom: true,
        markerZoomAnimation: false,
        preferCanvas: true,
      });

      this.esriLayer = this.L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 20,
          maxNativeZoom: 10,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 500,
          keepBuffer: 0,
          detectRetina: false,
        },);

      this.esriLowResLayer = this.L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 20,
          maxNativeZoom: 10,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 500,
          keepBuffer: 0,
          detectRetina: false,
        },);

      this.osmLayer = this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        {
          attribution: '',
          maxZoom: 19,
          maxNativeZoom: 10,
          subdomains: 'abcd',
          opacity: 0.72,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 500,
          keepBuffer: 0,
          detectRetina: false,
        },);

      this.osmLowResLayer = this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        {
          attribution: '',
          maxZoom: 19,
          maxNativeZoom: 10,
          subdomains: 'abcd',
          opacity: 0.72,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 500,
          keepBuffer: 0,
          detectRetina: false,
        },);

      this.refreshBaseLayerDetail();

      // Create custom pane for country highlighting with high z-index
      try {
        let countryPane = this.leafletMap.getPane('countryPane');
        if (!countryPane && this.leafletMap.createPane) {
          countryPane = this.leafletMap.createPane('countryPane');
        }
        if (countryPane) {
          (countryPane as HTMLElement).setAttribute('style', 'z-index: 450 !important');
        }
      }
      catch (error) {
        console.error('[Country Highlight] Failed to create pane:', error);
      }

      await this.initCountryBoundaryLayer();

      this.updateMinZoomToFitContainer();

      this.facLayer = this.L.geoJSON(null, {
        style:        (f: any) => {
          const c = this.facColor(f?.properties?.kind); return { color: c, weight: 1.5, fillColor: c, fillOpacity: 0.18, opacity: 0.9 };
        },
        pointToLayer: (f: any, ll: any) => {
          const c = this.facColor(f?.properties?.kind); return this.L.circleMarker(ll, { radius: 5, color: c, fillColor: c, fillOpacity: 0.85, weight: 1.5 });
        },
        onEachFeature:(f: any, l: any) => {
          const p = f.properties;
          l.bindPopup(`<div style="font-size:13px;font-weight:600;margin-bottom:3px">${p.name || p.kind || 'Facility'}</div><div style="font-size:12px;color:#888">Type: ${p.kind}</div>`);
        },
      }).addTo(this.leafletMap);

      this.anomalyLayer = this.L.layerGroup().addTo(this.leafletMap);

      this.orionCluster = this.L.layerGroup().addTo(this.leafletMap);
      this.aircraftCluster = this.L.layerGroup().addTo(this.leafletMap);
      this.shipCluster = this.L.layerGroup().addTo(this.leafletMap);

      this.leafletMap.on('zoomstart', () => {
        this.loadingEntity = null;
      });

      this.leafletMap.on('zoomend', () => {
        const c = this.leafletMap.getCenter();
        const z = this.leafletMap.getZoom();
        this.zoomLabel = `zoom ${z.toFixed(1)}  ·  ${c.lat.toFixed(4)}°N  ${c.lng.toFixed(4)}°E`;
        this.refreshMarkerSizingForZoom(z);
        this.scheduleOrionRender();
      });

      this.leafletMap.on('moveend', () => {
        const c = this.leafletMap.getCenter();
        const z = this.leafletMap.getZoom();
        this.zoomLabel = `zoom ${z.toFixed(1)}  ·  ${c.lat.toFixed(4)}°N  ${c.lng.toFixed(4)}°E`;
        this.renderAircraftCluster();
        this.renderShipCluster();
        this.scheduleOrionRender();
        clearTimeout(this.moveTimer);
        this.moveTimer = setTimeout(() => {
          this.mapMoved.emit({ lat: c.lat, lon: c.lng, zoom: z });
        }, 500);
      });

      if (this.lat && this.lon) {
        this.updateMapView();
      }
      if (this.facilitiesData)  {
        this.renderFacilities();
      }
      if (this.anomalyData)     {
        this.renderAnomaly();
      }
      if (this.aircraftData?.length) {
        this.renderAircraftCluster();
      }
      if (this.shipsData?.length) {
        this.renderShipCluster();
      }
      if (this.orionData?.length) {
        this.renderOrionData();
      }
      this.resizeObserver = new ResizeObserver(() => {
        this.leafletMap?.invalidateSize();
        this.updateMinZoomToFitContainer();
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
      setTimeout(() => {
        this.leafletMap?.invalidateSize();
        this.updateMinZoomToFitContainer();
      }, 0);
    }
    catch { }
  }

  private updateMapView(): void {
    if (!this.leafletMap || !this.lat || !this.lon) {
      return;
    }
    this.leafletMap.setView([this.lat, this.lon], this.deltaToZoom(this.delta));
    this.leafletMap.invalidateSize();
    if (this.clickMarker) {
      this.leafletMap.removeLayer(this.clickMarker);
    }
    this.clickMarker = this.L.circleMarker([this.lat, this.lon], {
      radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.25, weight: 2,
    }).addTo(this.leafletMap);
  }

  private updateMinZoomToFitContainer(): void {
    if (!this.leafletMap || !this.L) {
      return;
    }

    const worldBounds = this.L.latLngBounds(MapSectionComponent.WORLD_BOUNDS);
    const minZoom = Math.max(1, this.leafletMap.getBoundsZoom(worldBounds, true));
    this.leafletMap.setMinZoom(minZoom);

    if (this.leafletMap.getZoom() < minZoom) {
      this.leafletMap.setZoom(minZoom);
    }
  }

  private switchLayer(): void {
    if (!this.leafletMap || !this.L) {
      return;
    }
    this.refreshBaseLayerDetail();
  }

  private refreshBaseLayerDetail(): void {
    if (!this.leafletMap) {
      return;
    }

    [this.esriLayer, this.esriLowResLayer, this.osmLayer, this.osmLowResLayer].forEach(layer => {
      if (layer && this.leafletMap.hasLayer(layer)) {
        this.leafletMap.removeLayer(layer);
      }
    });

    if (this.selectedLayer === 'osm') {
      this.osmLayer?.addTo(this.leafletMap);
    }
    else {
      this.esriLayer?.addTo(this.leafletMap);
    }
  }

  private async initCountryBoundaryLayer(): Promise<void> {
    if (!this.leafletMap || !this.L || this.countryBoundaryLayer) {
      this.updateCountryHighlight();
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
      this.worldCountryFeatures = Array.isArray(countryCollection?.features) ? countryCollection.features : [];
      const renderableCountryCollection = {
        ...countryCollection,
        features: this.worldCountryFeatures.map((feature: any) => this.normalizeCountryFeature(feature)),
      };
      // Create highlight and hover layers before wiring the country boundaries
      this.countryHighlightLayer = this.L.geoJSON(null, {
        interactive: false,
        pane: 'countryPane',
        noClip: true,
        style: () => this.getCountryHighlightStyle(),
      }).addTo(this.leafletMap);

      this.countryHoverLayer = this.L.geoJSON(null, {
        interactive: false,
        pane: 'countryPane',
        noClip: true,
        style: () => this.getCountryHoverStyle(),
      }).addTo(this.leafletMap);

      this.countryBoundaryLayer = this.L.geoJSON(renderableCountryCollection, {
        interactive: true,
        pane: 'countryPane',
        noClip: true,
        smoothFactor: 0,
        style: () => this.getCountryBoundaryStyle(),
        onEachFeature: (feature: any, layer: any) => {
          const countryName = feature?.properties?.name || 'Country';
          layer.bindTooltip(countryName, {
            direction: 'center',
            sticky: true,
            opacity: 0.95,
            className: 'country-hover-tooltip',
          });
          // click to highlight this country permanently
          layer.on('click', () => {
            if (this.isSameCountryFeature(feature, this.highlightedCountryFeature)) {
              this.clearCountryHighlight();
              return;
            }

            this.highlightCountryFeature(feature);
          });

          // hover: show visual highlight using a stroke-only overlay layer
          layer.on('mouseover', () => {
            try {
              if (this.countryHoverLayer) {
                this.countryHoverLayer.clearLayers();
                this.countryHoverLayer.addData(feature);
                this.countryHoverLayer.bringToFront();
              }
            }
            catch { }
          });

          // mouseout: restore base style and re-apply persistent highlight if present
          layer.on('mouseout', () => {
            try {
              if (this.countryHoverLayer) {
                this.countryHoverLayer.clearLayers();
              }
              if (this.highlightedCountryFeature && this.countryHighlightLayer) {
                this.countryHighlightLayer.clearLayers();
                this.countryHighlightLayer.addData(this.highlightedCountryFeature);
                this.countryHighlightLayer.bringToFront();
              }
            }
            catch { }
          });
        },
      }).addTo(this.leafletMap);

      this.updateCountryHighlight();
    }
    catch (error) {
      console.error('[Country Highlight] Error loading country data:', error);
      this.worldCountryFeatures = [];
    }
    finally {
      this.locationBucketCache.clear();
    }
  }

  private getCountryBoundaryStyle(): Record<string, any> {
    return {
      color:       'rgba(0,0,0,0.45)',
      weight:      0.8,
      opacity:     0.55,
      fillColor:   'rgba(0,0,0,0)',
      fillOpacity: 0,
      lineJoin:    'round',
      lineCap:     'round',
    };
  }

  private getCountryHoverStyle(): Record<string, any> {
    return {
      color:       'rgba(96,165,250,0.98)',
      weight:      2.5,
      opacity:     1,
      fillColor:   'rgba(96,165,250,0)',
      fillOpacity: 0,
      lineJoin:    'round',
      lineCap:     'round',
    };
  }

  private normalizeCountryFeature(feature: any): any {
    if (!feature?.geometry) {
      return feature;
    }

    return {
      ...feature,
      geometry: this.normalizeCountryGeometry(feature.geometry),
    };
  }

  private normalizeCountryGeometry(geometry: any): any {
    const type = geometry?.type;
    const coordinates = geometry?.coordinates;

    if (!type || !coordinates) {
      return geometry;
    }

    if (type === 'Polygon') {
      return {
        ...geometry,
        coordinates: coordinates.map((ring: any) => this.unwrapCountryRing(ring)),
      };
    }

    if (type === 'MultiPolygon') {
      return {
        ...geometry,
        coordinates: coordinates.map((polygon: any) => polygon.map((ring: any) => this.unwrapCountryRing(ring))),
      };
    }

    return geometry;
  }

  private unwrapCountryRing(ring: any[]): any[] {
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

  private getCountryHighlightStyle(): Record<string, any> {
    return {
      color:       'rgba(59,130,246,0.98)',
      weight:      2.2,
      opacity:     0.95,
      fillColor:   'rgba(56,189,248,0)',
      fillOpacity: 0,
      lineJoin:    'round',
      lineCap:     'round',
    };
  }

  private getFocusedFeatureCoordinates(): [number, number] | null {
    const coordinates = this.focusedFeature?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const [lon, lat] = coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return null;
    }

    return [lon, lat];
  }

  private updateCountryHighlight(): void {
    const coordinates = this.getFocusedFeatureCoordinates();
    this.highlightedCountryFeature = null;

    if (coordinates) {
      this.highlightedCountryFeature = this.worldCountryFeatures.find((countryFeature: any) => {
        try {
          return geoContains(countryFeature, coordinates);
        }
        catch {
          return false;
        }
      }) ?? null;
    }

    if (this.countryHighlightLayer) {
      this.countryHighlightLayer.clearLayers();
      if (this.highlightedCountryFeature) {
        this.countryHighlightLayer.addData(this.highlightedCountryFeature);
        this.countryHighlightLayer.bringToFront();
      }
    }
  }

  private highlightCountryFeature(feature: any): void {
    if (!feature) {
      return;
    }

    this.highlightedCountryFeature = feature;

    if (this.countryHighlightLayer) {
      this.countryHighlightLayer.clearLayers();
      this.countryHighlightLayer.addData(feature);
      this.countryHighlightLayer.bringToFront();
    }
  }

  private clearCountryHighlight(): void {
    this.highlightedCountryFeature = null;

    if (this.countryHighlightLayer) {
      this.countryHighlightLayer.clearLayers();
    }
  }

  private isSameCountryFeature(left: any, right: any): boolean {
    if (!left || !right) {
      return false;
    }

    const leftId = left?.id ?? left?.properties?.name ?? left?.properties?.iso_a3 ?? left?.properties?.admin;
    const rightId = right?.id ?? right?.properties?.name ?? right?.properties?.iso_a3 ?? right?.properties?.admin;
    return String(leftId || '').trim() !== '' && String(leftId) === String(rightId);
  }

  private renderAircraftCluster(): void {
    if (!this.aircraftCluster) {
      return;
    }

    const renderKey = this.getAircraftRenderKey();
    if (renderKey === this.aircraftRenderKey) {
      return;
    }
    this.aircraftRenderKey = renderKey;

    const aircraft = this.getRenderableAircraft().filter(a => Number.isFinite(a.latitude) && Number.isFinite(a.longitude));
    const visibleIds = new Set(aircraft.map(a => this.getAircraftMarkerId(a)));
    for (const [markerId, marker] of Array.from(this.aircraftMarkers.entries())) {
      if (visibleIds.has(markerId)) {
        continue;
      }
      this.stopAircraftAnimation(markerId);
      this.aircraftCluster.removeLayer(marker);
      this.aircraftMarkers.delete(markerId);
      this.aircraftMarkerTargets.delete(markerId);
    }

    this.cancelAircraftRender();
    this.renderAircraftMarkersInChunks(aircraft, ++this.aircraftRenderVersion);
  }

  private cancelAircraftRender(): void {
    this.aircraftRenderVersion += 1;
    if (this.aircraftRenderTimer) {
      clearTimeout(this.aircraftRenderTimer);
      this.aircraftRenderTimer = null;
    }
  }

  private renderAircraftMarkersInChunks(aircraft: SatelliteLiveAircraft[], renderVersion: number, startIndex = 0): void {
    if (!this.aircraftCluster || renderVersion !== this.aircraftRenderVersion) {
      return;
    }

    const chunkSize = 140;
    const endIndex = Math.min(startIndex + chunkSize, aircraft.length);
    for (let index = startIndex; index < endIndex; index += 1) {
      this.upsertAircraftMarker(aircraft[index]);
    }

    if (endIndex < aircraft.length) {
      this.aircraftRenderTimer = setTimeout(() => this.renderAircraftMarkersInChunks(aircraft, renderVersion, endIndex), 0);
    }
    else {
      this.aircraftRenderTimer = null;
    }
  }

  private getAircraftMarkerId(a: SatelliteLiveAircraft): string {
    return this.normalizeEntityId(a.icao24) ?? `${a.latitude}:${a.longitude}`;
  }

  private upsertAircraftMarker(a: SatelliteLiveAircraft): void {
    if (!this.aircraftCluster) {
      return;
    }
    const markerId = this.getAircraftMarkerId(a);
    const existing = this.aircraftMarkers.get(markerId);
    if (!existing) {
      const marker = this.createAircraftMarker(a);
      const icaoId = this.normalizeEntityId(a.icao24);
      const isSelected = !!icaoId && this.activeEntity?.type === 'aircraft' && this.activeEntity.id === icaoId;
      const isLoading = !!icaoId && this.loadingEntity?.type === 'aircraft' && this.loadingEntity.id === icaoId;
      marker.__orionAircraftIconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
      this.aircraftMarkers.set(markerId, marker);
      this.aircraftCluster.addLayer(marker);
      this.updateAircraftMarkerMotion(markerId, marker, a);
      if (isSelected && this.aircraftTrackLine && Number.isFinite(a.latitude) && Number.isFinite(a.longitude)) {
        const points = this.aircraftTrackLine.getLatLngs?.() || [];
        const last = points[points.length - 1];
        if (!last || Math.abs(last.lat - (a.latitude as number)) > 0.00001 || Math.abs(last.lng - (a.longitude as number)) > 0.00001) {
          this.aircraftTrackLine.addLatLng([a.latitude, a.longitude]);
          this.aircraftTrackLine.bringToFront?.();
        }
      }
      return;
    }

    const icaoId = this.normalizeEntityId(a.icao24);
    const isSelected = !!icaoId && this.activeEntity?.type === 'aircraft' && this.activeEntity.id === icaoId;
    const isLoading = !!icaoId && this.loadingEntity?.type === 'aircraft' && this.loadingEntity.id === icaoId;
    const iconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
    this.updateAircraftMarkerMotion(markerId, existing, a);
    if (isSelected && this.aircraftTrackLine && Number.isFinite(a.latitude) && Number.isFinite(a.longitude)) {
      const points = this.aircraftTrackLine.getLatLngs?.() || [];
      const last = points[points.length - 1];
      if (!last || Math.abs(last.lat - (a.latitude as number)) > 0.00001 || Math.abs(last.lng - (a.longitude as number)) > 0.00001) {
        this.aircraftTrackLine.addLatLng([a.latitude, a.longitude]);
        this.aircraftTrackLine.bringToFront?.();
      }
    }

    const rotationDegrees = this.getAircraftMovementRotation(existing, a);
    if (existing.__orionAircraftIconState !== iconState) {
      existing.setIcon(this.createAircraftIcon(a, isSelected, isLoading, rotationDegrees));
      existing.__orionAircraftIconState = iconState;
      return;
    }

    const iconWrap = existing.getElement?.()?.querySelector?.('.aircraft-icon-wrap') as HTMLElement | null;
    if (iconWrap) {
      const currentStyle = iconWrap.getAttribute('style') || '';
      const nextRotation = `transform:rotate(${rotationDegrees}deg)`;
      iconWrap.setAttribute('style', currentStyle.includes('transform:rotate(')
        ? currentStyle.replace(/transform:rotate\([^)]*\)/, nextRotation)
        : `${currentStyle};${nextRotation}`);
    }
  }

  private updateAircraftMarkerMotion(markerId: string, marker: any, aircraft: SatelliteLiveAircraft): void {
    const lat = aircraft.latitude as number;
    const lon = aircraft.longitude as number;
    const motionKey = [
      lat,
      lon,
      aircraft.velocity ?? '',
      aircraft.true_track ?? '',
      aircraft.on_ground ?? '',
    ].join(':');

    const isSameMotion = this.aircraftMarkerTargets.get(markerId) === motionKey;
    if (isSameMotion && this.aircraftAnimationFrames.has(markerId)) {
      return;
    }
    this.aircraftMarkerTargets.set(markerId, motionKey);

    const current = marker.getLatLng?.();
    const startLat = isSameMotion && Number.isFinite(current?.lat) ? current.lat : lat;
    const startLon = isSameMotion && Number.isFinite(current?.lng) ? current.lng : lon;
    const projectionSource = isSameMotion ? { ...aircraft, latitude: startLat, longitude: startLon } : aircraft;

    this.stopAircraftAnimation(markerId);
    marker.setLatLng([startLat, startLon]);
    const projected = this.projectAircraftPosition(projectionSource, this.aircraftAnimationDurationMs / 1000);
    if (!projected) {
      return;
    }

    this.animateAircraftMarker(markerId, marker, projected.lat, projected.lon);
  }

  private projectAircraftPosition(aircraft: SatelliteLiveAircraft, seconds: number): { lat: number; lon: number } | null {
    const lat = aircraft.latitude;
    const lon = aircraft.longitude;
    const velocity = aircraft.velocity;
    const bearing = aircraft.true_track;
    if (
      aircraft.on_ground ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isFinite(velocity) ||
      !Number.isFinite(bearing) ||
      (velocity ?? 0) <= 0
    ) {
      return null;
    }

    const distanceMeters = (velocity as number) * seconds;
    const bearingRadians = ((bearing as number) * Math.PI) / 180;
    const latRadians = ((lat as number) * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLon = Math.max(1, metersPerDegreeLat * Math.cos(latRadians));

    return {
      lat: (lat as number) + (Math.cos(bearingRadians) * distanceMeters) / metersPerDegreeLat,
      lon: (lon as number) + (Math.sin(bearingRadians) * distanceMeters) / metersPerDegreeLon,
    };
  }

  private animateAircraftMarker(markerId: string, marker: any, targetLat: number, targetLon: number): void {
    if (typeof window === 'undefined') {
      marker.setLatLng([targetLat, targetLon]);
      return;
    }

    this.stopAircraftAnimation(markerId);

    const current = marker.getLatLng();
    const startLat = current.lat;
    const startLon = current.lng;
    const deltaLat = targetLat - startLat;
    const deltaLon = targetLon - startLon;

    if (Math.abs(deltaLat) < 0.000001 && Math.abs(deltaLon) < 0.000001) {
      marker.setLatLng([targetLat, targetLon]);
      return;
    }

    this.aircraftAnimationFrames.set(markerId, {
      marker,
      startLat,
      startLon,
      targetLat,
      targetLon,
      startedAt: window.performance.now(),
    });

    if (this.aircraftAnimationFrame !== null) {
      return;
    }

    const step = (timestamp: number) => {
      for (const [id, animation] of Array.from(this.aircraftAnimationFrames.entries())) {
        const progress = Math.min(1, (timestamp - animation.startedAt) / this.aircraftAnimationDurationMs);
        animation.marker.setLatLng([
          animation.startLat + (animation.targetLat - animation.startLat) * progress,
          animation.startLon + (animation.targetLon - animation.startLon) * progress,
        ]);

        if (progress >= 1) {
          this.aircraftAnimationFrames.delete(id);
        }
      }

      if (this.aircraftAnimationFrames.size > 0) {
        this.aircraftAnimationFrame = window.requestAnimationFrame(step);
        return;
      }

      this.aircraftAnimationFrame = null;
    };

    this.aircraftAnimationFrame = window.requestAnimationFrame(step);
  }

  private stopAircraftAnimation(markerId: string): void {
    this.aircraftAnimationFrames.delete(markerId);
    if (this.aircraftAnimationFrames.size === 0 && this.aircraftAnimationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.aircraftAnimationFrame);
      this.aircraftAnimationFrame = null;
    }
  }

  private cancelAllAircraftAnimations(): void {
    this.aircraftAnimationFrames.clear();
    if (this.aircraftAnimationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.aircraftAnimationFrame);
      this.aircraftAnimationFrame = null;
    }
  }

  private createAircraftMarker(a: SatelliteLiveAircraft): any {
    const icaoId = this.normalizeEntityId(a.icao24);
    const isSelected = !!icaoId && this.activeEntity?.type === 'aircraft' && this.activeEntity.id === icaoId;
    const isLoading = !!icaoId && this.loadingEntity?.type === 'aircraft' && this.loadingEntity.id === icaoId;
    const marker = this.L.marker([a.latitude, a.longitude], {
      icon: this.createAircraftIcon(a, isSelected, isLoading),
    });
    if (icaoId) {
      marker.bindTooltip(`${this.escapeTooltipText(icaoId)}`, {
        direction: 'top',
        offset:    [0, -10],
        opacity:   0.95,
        sticky:    true,
      });
    }
    if (a.icao24) {
      marker.on('click', () => {
        const markerId = this.normalizeEntityId(a.icao24);
        if (!markerId) {
          return;
        }
        const token = this.openSidebarLoading('aircraft', markerId, a);
        this.satelliteService.pollAircraftByICAO(a.icao24).subscribe({
          next: (res) => {
            if (token !== this.sidebarRequestToken) {
              return;
            } // stale, discard
            const aircraft = this.extractAircraftDetails(res);
            const status = this.getResponseStatus(res);
            if (aircraft) {
              this.renderAircraftTrack(aircraft);
              this.ngZone.run(() => this.openSidebar('aircraft', aircraft));
            }
            else if (this.isPendingStatus(status)) {
              return;
            }
            else {
              this.openSidebarError('aircraft', markerId, 'Unable to load aircraft details');
            }
          },
          error: (err) => {
            if (token !== this.sidebarRequestToken) {
              return;
            } // stale, discard
            this.openSidebarError('aircraft', markerId, err?.error?.detail || err?.message || 'Aircraft details request failed');
          }
        });
      });
    }
    return marker;
  }

  private renderShipCluster(): void {
    if (!this.shipCluster) {
      return;
    }

    const renderKey = this.getShipRenderKey();
    if (renderKey === this.shipRenderKey) {
      return;
    }
    this.shipRenderKey = renderKey;

    const ships = this.getRenderableShips().filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude));
    const visibleIds = new Set(ships.map(s => this.getShipMarkerId(s)));
    for (const [markerId, marker] of Array.from(this.shipMarkers.entries())) {
      if (visibleIds.has(markerId)) {
        continue;
      }
      this.stopShipAnimation(markerId);
      this.shipCluster.removeLayer(marker);
      this.shipMarkers.delete(markerId);
      this.shipMarkerTargets.delete(markerId);
    }

    this.cancelShipRender();
    this.renderShipMarkersInChunks(ships, ++this.shipRenderVersion);
  }

  private cancelShipRender(): void {
    this.shipRenderVersion += 1;
    if (this.shipRenderTimer) {
      clearTimeout(this.shipRenderTimer);
      this.shipRenderTimer = null;
    }
  }

  private renderShipMarkersInChunks(ships: SatelliteLiveShip[], renderVersion: number, startIndex = 0): void {
    if (!this.shipCluster || renderVersion !== this.shipRenderVersion) {
      return;
    }

    const chunkSize = 160;
    const endIndex = Math.min(startIndex + chunkSize, ships.length);
    for (let index = startIndex; index < endIndex; index += 1) {
      this.upsertShipMarker(ships[index]);
    }

    if (endIndex < ships.length) {
      this.shipRenderTimer = setTimeout(() => this.renderShipMarkersInChunks(ships, renderVersion, endIndex), 0);
    }
    else {
      this.shipRenderTimer = null;
    }
  }

  private getShipMarkerId(s: SatelliteLiveShip): string {
    return this.normalizeEntityId(s.mmsi) ?? `${s.latitude}:${s.longitude}`;
  }

  private upsertShipMarker(s: SatelliteLiveShip): void {
    if (!this.shipCluster) {
      return;
    }
    const markerId = this.getShipMarkerId(s);
    const existing = this.shipMarkers.get(markerId);
    if (!existing) {
      const marker = this.createShipMarker(s);
      const mmsiId = this.normalizeEntityId(s.mmsi);
      const isSelected = !!mmsiId && this.activeEntity?.type === 'ship' && this.activeEntity.id === mmsiId;
      const isLoading = !!mmsiId && this.loadingEntity?.type === 'ship' && this.loadingEntity.id === mmsiId;
      marker.__orionShipIconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
      this.shipMarkers.set(markerId, marker);
      this.shipCluster.addLayer(marker);
      this.updateShipMarkerMotion(markerId, marker, s);
      return;
    }

    const mmsiId = this.normalizeEntityId(s.mmsi);
    const isSelected = !!mmsiId && this.activeEntity?.type === 'ship' && this.activeEntity.id === mmsiId;
    const isLoading = !!mmsiId && this.loadingEntity?.type === 'ship' && this.loadingEntity.id === mmsiId;
    const iconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
    this.updateShipMarkerMotion(markerId, existing, s);

    const rotationDegrees = this.getShipMovementRotation(existing, s);
    if (existing.__orionShipIconState !== iconState) {
      existing.setIcon(this.createShipIcon(s, isSelected, isLoading, rotationDegrees));
      existing.__orionShipIconState = iconState;
      return;
    }

    const iconWrap = existing.getElement?.()?.querySelector?.('.ship-icon-wrap') as HTMLElement | null;
    if (iconWrap) {
      const currentStyle = iconWrap.getAttribute('style') || '';
      const nextRotation = `transform:rotate(${rotationDegrees}deg)`;
      iconWrap.setAttribute('style', currentStyle.includes('transform:rotate(')
        ? currentStyle.replace(/transform:rotate\([^)]*\)/, nextRotation)
        : `${currentStyle};${nextRotation}`);
    }
  }

  private updateShipMarkerMotion(markerId: string, marker: any, ship: SatelliteLiveShip): void {
    const lat = ship.latitude as number;
    const lon = ship.longitude as number;
    const motionKey = [
      lat,
      lon,
      ship.speed ?? '',
      ship.course ?? ship.true_heading ?? '',
    ].join(':');

    const isSameMotion = this.shipMarkerTargets.get(markerId) === motionKey;
    if (isSameMotion && this.shipAnimationFrames.has(markerId)) {
      return;
    }
    this.shipMarkerTargets.set(markerId, motionKey);

    const current = marker.getLatLng?.();
    const startLat = isSameMotion && Number.isFinite(current?.lat) ? current.lat : lat;
    const startLon = isSameMotion && Number.isFinite(current?.lng) ? current.lng : lon;
    const projectionSource = isSameMotion ? { ...ship, latitude: startLat, longitude: startLon } : ship;

    this.stopShipAnimation(markerId);
    marker.setLatLng([startLat, startLon]);
    const projected = this.projectShipPosition(projectionSource, this.shipAnimationDurationMs / 1000);
    if (!projected) {
      return;
    }

    this.animateShipMarker(markerId, marker, projected.lat, projected.lon);
  }

  private projectShipPosition(ship: SatelliteLiveShip, seconds: number): { lat: number; lon: number } | null {
    const lat = ship.latitude;
    const lon = ship.longitude;
    const speed = ship.speed;
    const bearing = ship.course ?? ship.true_heading;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isFinite(speed) ||
      !Number.isFinite(bearing) ||
      (speed ?? 0) <= 0
    ) {
      return null;
    }

    const distanceMeters = (speed as number) * 0.514444 * seconds;
    const bearingRadians = ((bearing as number) * Math.PI) / 180;
    const latRadians = ((lat as number) * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLon = Math.max(1, metersPerDegreeLat * Math.cos(latRadians));

    return {
      lat: (lat as number) + (Math.cos(bearingRadians) * distanceMeters) / metersPerDegreeLat,
      lon: (lon as number) + (Math.sin(bearingRadians) * distanceMeters) / metersPerDegreeLon,
    };
  }

  private animateShipMarker(markerId: string, marker: any, targetLat: number, targetLon: number): void {
    if (typeof window === 'undefined') {
      marker.setLatLng([targetLat, targetLon]);
      return;
    }

    this.stopShipAnimation(markerId);

    const current = marker.getLatLng();
    const startLat = current.lat;
    const startLon = current.lng;
    const deltaLat = targetLat - startLat;
    const deltaLon = targetLon - startLon;

    if (Math.abs(deltaLat) < 0.000001 && Math.abs(deltaLon) < 0.000001) {
      marker.setLatLng([targetLat, targetLon]);
      return;
    }

    this.shipAnimationFrames.set(markerId, {
      marker,
      startLat,
      startLon,
      targetLat,
      targetLon,
      startedAt: window.performance.now(),
    });

    if (this.shipAnimationFrame !== null) {
      return;
    }

    const step = (timestamp: number) => {
      for (const [id, animation] of Array.from(this.shipAnimationFrames.entries())) {
        const progress = Math.min(1, (timestamp - animation.startedAt) / this.shipAnimationDurationMs);
        animation.marker.setLatLng([
          animation.startLat + (animation.targetLat - animation.startLat) * progress,
          animation.startLon + (animation.targetLon - animation.startLon) * progress,
        ]);

        if (progress >= 1) {
          this.shipAnimationFrames.delete(id);
        }
      }

      if (this.shipAnimationFrames.size > 0) {
        this.shipAnimationFrame = window.requestAnimationFrame(step);
        return;
      }

      this.shipAnimationFrame = null;
    };

    this.shipAnimationFrame = window.requestAnimationFrame(step);
  }

  private stopShipAnimation(markerId: string): void {
    this.shipAnimationFrames.delete(markerId);
    if (this.shipAnimationFrames.size === 0 && this.shipAnimationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.shipAnimationFrame);
      this.shipAnimationFrame = null;
    }
  }

  private cancelAllShipAnimations(): void {
    this.shipAnimationFrames.clear();
    if (this.shipAnimationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.shipAnimationFrame);
      this.shipAnimationFrame = null;
    }
  }

  private createShipMarker(s: SatelliteLiveShip): any {
    const mmsiId = this.normalizeEntityId(s.mmsi);
    const isSelected = !!mmsiId && this.activeEntity?.type === 'ship' && this.activeEntity.id === mmsiId;
    const isLoading = !!mmsiId && this.loadingEntity?.type === 'ship' && this.loadingEntity.id === mmsiId;
    const marker = this.L.marker([s.latitude!, s.longitude!], {
      icon: this.createShipIcon(s, isSelected, isLoading),
    });
    if (mmsiId) {
      marker.bindTooltip(`${this.escapeTooltipText(mmsiId)}`, {
        direction: 'top',
        offset:    [0, -10],
        opacity:   0.95,
        sticky:    true,
      });
    }
    if (s.mmsi) {
      marker.on('click', () => {
        const markerId = this.normalizeEntityId(s.mmsi);
        if (!markerId) {
          return;
        }
        const token = this.openSidebarLoading('ship', markerId, s);
        this.satelliteService.pollShipByMMSI(s.mmsi).subscribe({
          next: (res) => {
            if (token !== this.sidebarRequestToken) {
              return;
            }
            const ship = this.extractShipDetails(res);
            const status = this.getResponseStatus(res);
            if (ship) {
              this.ngZone.run(() => this.openSidebar('ship', ship));
            }
            else if (this.isPendingStatus(status)) {
              return;
            }
            else {
              this.openSidebarError('ship', markerId, 'Unable to load ship details');
            }
          },
          error: (err) => {
            if (token !== this.sidebarRequestToken) {
              return;
            }
            this.openSidebarError('ship', markerId, err?.error?.detail || err?.message || 'Ship details request failed');
          }
        });
      });
    }
    return marker;
  }

  private getAircraftMovementRotation(marker: any, aircraft: SatelliteLiveAircraft): number {
    if (Number.isFinite(aircraft.true_track)) {
      return this.toAircraftCssRotation(aircraft.true_track);
    }

    const current = marker.getLatLng?.();
    const targetLat = aircraft.latitude;
    const targetLon = aircraft.longitude;
    if (
      current &&
      Number.isFinite(current.lat) &&
      Number.isFinite(current.lng) &&
      Number.isFinite(targetLat) &&
      Number.isFinite(targetLon)
    ) {
      const bearing = this.getBearingDegrees(current.lat, current.lng, targetLat as number, targetLon as number);
      if (bearing !== null) {
        return this.toAircraftCssRotation(bearing);
      }
    }

    return this.toAircraftCssRotation(aircraft.true_track);
  }

  private getBearingDegrees(fromLat: number, fromLon: number, toLat: number, toLon: number): number | null {
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

  private toAircraftCssRotation(track: number | null | undefined): number {
    return Number.isFinite(track) ? track as number : 0;
  }

  private getShipMovementRotation(marker: any, ship: SatelliteLiveShip): number {
    if (Number.isFinite(ship.course)) {
      return ship.course as number;
    }
    if (Number.isFinite(ship.true_heading)) {
      return ship.true_heading as number;
    }

    const current = marker.getLatLng?.();
    const targetLat = ship.latitude;
    const targetLon = ship.longitude;
    if (
      current &&
      Number.isFinite(current.lat) &&
      Number.isFinite(current.lng) &&
      Number.isFinite(targetLat) &&
      Number.isFinite(targetLon)
    ) {
      const bearing = this.getBearingDegrees(current.lat, current.lng, targetLat as number, targetLon as number);
      if (bearing !== null) {
        return bearing;
      }
    }

    return 0;
  }

  private createAircraftIcon(a: SatelliteLiveAircraft, isSelected: boolean, isLoading: boolean, rotationDegrees = this.toAircraftCssRotation(a.true_track)): any {
    const size = this.getMarkerBaseSize('aircraft');
    const half = Math.round(size / 2);
    const iconSize = Math.round(size * 1.02);
    const altitudeFeet = ((a.baro_altitude ?? a.geo_altitude ?? 0) as number) * 3.28084;
    const altitudeFill = a.on_ground
      ? '#6b7280'
      : altitudeFeet < 3000
        ? '#f97316'
        : altitudeFeet < 10000
          ? '#facc15'
          : altitudeFeet < 18000
            ? '#22c55e'
            : altitudeFeet < 25000
              ? '#06b6d4'
              : altitudeFeet < 35000
                ? '#2563eb'
                : altitudeFeet < 45000
                  ? '#a855f7'
                  : '#ef4444';
    const iconFill = isSelected ? '#ef4444' : altitudeFill;
    const hoverFill = iconFill;
    const halo = isSelected ? 'drop-shadow(0 0 8px rgba(248,113,113,0.95)) drop-shadow(0 0 18px rgba(239,68,68,0.7))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))';
    const hoverHalo = isSelected
      ? 'drop-shadow(0 0 8px rgba(248,113,113,0.95)) drop-shadow(0 0 18px rgba(239,68,68,0.7))'
      : 'drop-shadow(0 0 7px rgba(56,189,248,0.9)) drop-shadow(0 0 16px rgba(56,189,248,0.55))';
    const strokeColor = isSelected ? '#fee2e2' : '#020617';
    const hoverStrokeColor = strokeColor;
    const badge = isLoading
      ? `<div style="position:absolute;top:-1px;right:-1px;width:12px;height:12px;border-radius:9999px;background:#fde68a;border:2px solid #081421;"></div>`
      : '';
    return this.L.divIcon({
      html: `
        <style>
          .aircraft-marker:hover .aircraft-icon-wrap { filter:${hoverHalo} !important; }
          .aircraft-marker:hover .aircraft-icon { fill:${hoverFill} !important; stroke:${hoverStrokeColor} !important; }
        </style>
        <div class="aircraft-marker" style="position:relative;width:${size}px;height:${size}px;">
          <div class="aircraft-icon-wrap" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${rotationDegrees}deg);filter:${halo};">
            <svg class="aircraft-icon" viewBox="0 0 24 24" style="width:${iconSize}px;height:${iconSize}px;fill:${iconFill};stroke:${strokeColor};stroke-width:1.35;paint-order:stroke fill;transition:fill 120ms ease,stroke 120ms ease;">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L12 19v-5.5L21 16z"/>
            </svg>
          </div>
          ${badge}
        </div>
      `,
      className: 'bg-transparent border-0',
      iconSize: [size, size],
      iconAnchor: [half, half],
    });
  }

  private createShipIcon(s: SatelliteLiveShip, isSelected: boolean, isLoading: boolean, rotationDegrees = Number.isFinite(s.course) ? s.course as number : Number.isFinite(s.true_heading) ? s.true_heading as number : 0): any {
    const size = this.getMarkerBaseSize('ship');
    const half = Math.round(size / 2);
    const iconSize = Math.round(size * 0.8);
    const glow = isSelected ? 'drop-shadow(0 0 8px rgba(96,165,250,0.92)) drop-shadow(0 0 18px rgba(96,165,250,0.62))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.42))';
    const badge = isLoading
      ? `<div style="position:absolute;top:1px;right:1px;width:12px;height:12px;border-radius:9999px;background:#fde68a;border:2px solid #081421;"></div>`
      : '';
    return this.L.divIcon({
      html: `
        <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
          <div class="ship-icon-wrap" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${rotationDegrees}deg);filter:${glow};">
            <svg viewBox="0 0 24 24" style="width:${iconSize}px;height:${iconSize}px;fill:#38bdf8;stroke:${isSelected ? '#dbeafe' : '#0ea5e9'};stroke-width:0.6;">
              <path d="M12 2L19 20L12 16L5 20L12 2Z"/>
            </svg>
          </div>
          ${badge}
        </div>
      `,
      className: 'bg-transparent border-0',
      iconSize: [size, size],
      iconAnchor: [half, half],
    });
  }

  private refreshSelectionState(): void {
    this.aircraftRenderKey = '';
    this.shipRenderKey = '';
    this.orionRenderKey = '';
    this.renderAircraftCluster();
    this.renderShipCluster();
  }

  private getEntityId(type: 'aircraft' | 'ship', data: any): string | null {
    return this.normalizeEntityId(type === 'aircraft' ? data?.icao24 : data?.mmsi);
  }

  private normalizeEntityId(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  private escapeTooltipText(value: string): string {
    return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[character] ?? character));
  }

  private getMarkerBaseSize(type: 'aircraft' | 'ship'): number {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const base = type === 'aircraft' ? 26 : 28;
    const growth = type === 'aircraft' ? 1.8 : 1.6;
    const cap = type === 'aircraft' ? 20 : 8;
    return base + Math.max(0, Math.min(cap, Math.round((zoom - 3) * growth)));
  }

  private getResponseStatus(res: any): string | undefined {
    return res?.result?.status || res?.status;
  }

  private isPendingStatus(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
  }

  private getClusterSize(count: number): number {
    if (count >= 1000) {
      return 52;
    }
    if (count >= 100) {
      return 48;
    }
    if (count >= 25) {
      return 44;
    }
    if (count >= 10) {
      return 40;
    }
    return 36;
  }

  private refreshMarkerSizingForZoom(zoom: number): void {
    const bucket = Math.round(zoom * 2);
    if (bucket === this.markerZoomBucket) {
      return;
    }
    this.markerZoomBucket = bucket;
    this.aircraftRenderKey = '';
    this.shipRenderKey = '';
    this.orionRenderKey = '';
    this.renderAircraftCluster();
    this.renderShipCluster();
  }

  private getAircraftRenderKey(): string {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|sel:${this.activeEntity?.id || ''}|load:${this.loadingEntity?.id || ''}|count:${this.aircraftData.length}`;
    }
    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `sel:${this.activeEntity?.id || ''}`,
      `load:${this.loadingEntity?.id || ''}`,
      `count:${this.aircraftData.length}`,
    ].join('|');
  }

  private getRenderableAircraft(): SatelliteLiveAircraft[] {
    const bounds = this.leafletMap?.getBounds?.();
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const visible = this.aircraftData.filter(a => {
      if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) {
        return false;
      }
      if (!bounds) {
        return true;
      }
      return bounds.pad(0.18).contains([a.latitude, a.longitude]);
    });
    const sampleRatio = this.getAircraftSampleRatio(zoom);
    if (sampleRatio >= 1) {
      return visible;
    }
    return this.sampleByBucket(visible, sampleRatio, a => this.getAircraftSampleBucketKey(a), a => this.normalizeEntityId(a.icao24) ?? `${a.latitude}:${a.longitude}`);
  }

  private getAircraftSampleRatio(zoom: number): number {
    if (zoom >= 8) {
      return 1;
    }
    if (zoom >= 7) {
      return 0.82;
    }
    if (zoom >= 6) {
      return 0.58;
    }
    if (zoom >= 5) {
      return 0.3;
    }
    if (zoom >= 4) {
      return 0.15;
    }
    if (zoom >= 3) {
      return 0.1;
    }
    return 0.1;
  }

  private getRenderableShips(): SatelliteLiveShip[] {
    const bounds = this.leafletMap?.getBounds?.();
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const visible = this.shipsData.filter(s => {
      if (!Number.isFinite(s.latitude) || !Number.isFinite(s.longitude)) {
        return false;
      }
      if (!bounds) {
        return true;
      }
      return bounds.pad(0.18).contains([s.latitude, s.longitude]);
    });
    const sampleRatio = this.getShipSampleRatio(zoom);
    const sampled = sampleRatio >= 1
      ? visible
      : this.sampleByBucket(visible, sampleRatio, s => this.getGridBucketKey(s.latitude!, s.longitude!), s => this.normalizeEntityId(s.mmsi) ?? `${s.latitude}:${s.longitude}`);
    const limit = this.getShipVisibleLimit(zoom);
    if (sampled.length <= limit) {
      return sampled;
    }
    return sampled.slice().sort((left, right) => {
      const leftKey = this.normalizeEntityId(left.mmsi) ?? `${left.latitude}:${left.longitude}`;
      const rightKey = this.normalizeEntityId(right.mmsi) ?? `${right.latitude}:${right.longitude}`;
      return Math.abs(this.stableHash(leftKey)) - Math.abs(this.stableHash(rightKey));
    }).slice(0, limit);
  }

  private getShipSampleRatio(zoom: number): number {
    if (zoom >= 8) {
      return 1;
    }
    if (zoom >= 7) {
      return 0.5;
    }
    if (zoom >= 6) {
      return 0.28;
    }
    if (zoom >= 5) {
      return 0.12;
    }
    if (zoom >= 4) {
      return 0.05;
    }
    if (zoom >= 3) {
      return 0.02;
    }
    return 0.02;
  }

  private getShipVisibleLimit(zoom: number): number {
    if (zoom >= 10) {
      return 3500;
    }
    if (zoom >= 8) {
      return 2200;
    }
    if (zoom >= 7) {
      return 1500;
    }
    if (zoom >= 6) {
      return 1000;
    }
    if (zoom >= 5) {
      return 650;
    }
    if (zoom >= 4) {
      return 420;
    }
    return 260;
  }

  private sampleByBucket<T>(items: T[], ratio: number, getBucketKey: (item: T) => string, getStableKey: (item: T) => string): T[] {
    const buckets = new Map<string, T[]>();

    items.forEach(item => {
      const bucketKey = getBucketKey(item);
      const bucketItems = buckets.get(bucketKey) ?? [];
      bucketItems.push(item);
      buckets.set(bucketKey, bucketItems);
    });

    const sampled: T[] = [];
    buckets.forEach(bucketItems => {
      const keepCount = this.getLocationBucketSampleCount(bucketItems.length, ratio);
      if (keepCount >= bucketItems.length) {
        sampled.push(...bucketItems);
        return;
      }

      sampled.push(...bucketItems.slice().sort((left, right) => this.stableHash(getStableKey(left)) - this.stableHash(getStableKey(right))).slice(0, keepCount));
    });

    return sampled;
  }

  private getLocationBucketSampleCount(count: number, ratio: number): number {
    if (count <= 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(count * ratio));
  }

  private getAircraftSampleBucketKey(aircraft: SatelliteLiveAircraft): string {
    const originCountry = aircraft.origin_country?.trim();
    if (originCountry) {
      return `origin:${originCountry.toLowerCase()}`;
    }

    if (Number.isFinite(aircraft.latitude) && Number.isFinite(aircraft.longitude)) {
      return this.getGridBucketKey(aircraft.latitude as number, aircraft.longitude as number);
    }

    return 'origin:unknown';
  }

  private getLocationBucketKey(latitude: number, longitude: number): string {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
    const cached = this.locationBucketCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const countryFeature = this.findCountryFeatureAt(latitude, longitude);
    const bucketKey = countryFeature
      ? `country:${this.getCountryFeatureKey(countryFeature)}`
      : this.getGridBucketKey(latitude, longitude);

    if (this.locationBucketCache.size > 20000) {
      this.locationBucketCache.clear();
    }
    this.locationBucketCache.set(cacheKey, bucketKey);

    return bucketKey;
  }

  private getGridBucketKey(latitude: number, longitude: number): string {
    return `grid:${Math.floor((latitude + 90) / 10)}:${Math.floor((longitude + 180) / 10)}`;
  }

  private findCountryFeatureAt(latitude: number, longitude: number): any | null {
    if (!this.worldCountryFeatures.length) {
      return null;
    }

    return this.worldCountryFeatures.find((countryFeature: any) => {
      try {
        return geoContains(countryFeature, [longitude, latitude]);
      }
      catch {
        return false;
      }
    }) ?? null;
  }

  private getCountryFeatureKey(feature: any): string {
    const countryId = feature?.id ?? feature?.properties?.iso_a3 ?? feature?.properties?.adm0_a3 ?? feature?.properties?.name ?? feature?.properties?.admin ?? 'unknown';
    return String(countryId);
  }

  private getShipRenderKey(): string {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|sel:${this.activeEntity?.id || ''}|load:${this.loadingEntity?.id || ''}|count:${this.shipsData.length}`;
    }
    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `sel:${this.activeEntity?.id || ''}`,
      `load:${this.loadingEntity?.id || ''}`,
      `count:${this.shipsData.length}`,
    ].join('|');
  }

  private extractAircraftDetails(res: any): SatelliteLiveAircraft | null {
    const payload = res?.result ?? res;
    if (Array.isArray(payload?.aircraft) && payload.aircraft.length > 0) {
      return payload.aircraft[0] as SatelliteLiveAircraft;
    }
    if (payload?.aircrafts && Array.isArray(payload.aircrafts) && payload.aircrafts.length > 0) {
      return payload.aircrafts[0] as SatelliteLiveAircraft;
    }
    if (payload?.aircraft && typeof payload.aircraft === 'object' && !Array.isArray(payload.aircraft)) {
      return {
        ...payload.aircraft,
        ...(payload.track ? { track: payload.track } : {}),
        ...(payload.path ? { path: payload.path } : {}),
      } as SatelliteLiveAircraft;
    }
    if (payload && typeof payload === 'object' && payload.icao24 != null) {
      return payload as SatelliteLiveAircraft;
    }
    if (res && typeof res === 'object' && res.icao24 != null) {
      return res as SatelliteLiveAircraft;
    }
    return null;
  }

  private renderAircraftTrack(aircraft: any): void {
    const path = aircraft?.track?.path || aircraft?.path;
    if (this.aircraftTrackLine) {
      this.leafletMap?.removeLayer(this.aircraftTrackLine);
      this.aircraftTrackLine = null;
    }
    if (!this.leafletMap || !this.L || !Array.isArray(path) || path.length < 2) {
      return;
    }
    let trackPane = this.leafletMap.getPane('aircraftTrackPane');
    if (!trackPane && this.leafletMap.createPane) {
      trackPane = this.leafletMap.createPane('aircraftTrackPane');
    }
    if (trackPane) {
      (trackPane as HTMLElement).setAttribute('style', 'z-index: 620 !important; pointer-events: none;');
    }
    const points = path
      .map((point: any) => Array.isArray(point) && Number.isFinite(point[1]) && Number.isFinite(point[2]) ? [point[1], point[2]] : null)
      .filter(Boolean);
    if (points.length < 2) {
      return;
    }
    this.aircraftTrackLine = this.L.polyline(points, {
      color: '#facc15',
      weight: 4,
      opacity: 0.95,
      dashArray: '10 8',
      lineCap: 'butt',
      interactive: false,
      pane: 'aircraftTrackPane',
    }).addTo(this.leafletMap);
    this.aircraftTrackLine.bringToFront?.();
  }

  private extractShipDetails(res: any): SatelliteLiveShip | null {
    const payload = res?.result ?? res;
    if (Array.isArray(payload?.ships) && payload.ships.length > 0) {
      return payload.ships[0] as SatelliteLiveShip;
    }
    if (payload?.ship && typeof payload.ship === 'object' && !Array.isArray(payload.ship)) {
      return payload.ship as SatelliteLiveShip;
    }
    if (payload?.ships && typeof payload.ships === 'object' && !Array.isArray(payload.ships)) {
      return payload.ships as SatelliteLiveShip;
    }
    if (payload && typeof payload === 'object' && payload.mmsi != null) {
      return payload as SatelliteLiveShip;
    }
    if (res && typeof res === 'object' && res.mmsi != null) {
      return res as SatelliteLiveShip;
    }
    return null;
  }

  private renderFacilities(): void {
    if (!this.facLayer) {
      return;
    }
    this.facLayer.clearLayers();
    if (this.facilitiesData?.features?.length) {
      this.facLayer.addData(this.facilitiesData);
    }
  }

  private renderAnomaly(): void {
    if (!this.anomalyLayer || !this.anomalyData?.bbox) {
      return;
    }
    this.anomalyLayer.clearLayers();
    const [mnLo, mnLa, mxLo, mxLa] = this.anomalyData.bbox;
    const C: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', nominal: '#22c55e', unknown: '#3b82f6' };
    const c = C[this.anomalyData.alert_level] || '#3b82f6';
    this.L.rectangle([[mnLa, mnLo], [mxLa, mxLo]], { color: c, weight: 2, fillColor: c, fillOpacity: 0.08, dashArray: '6 4' })
      .addTo(this.anomalyLayer)
      .bindPopup(`<b>Anomaly zone</b><br>Alert: <b>${this.anomalyData.alert_level}</b><br>NDVI delta: <b>${this.anomalyData.delta_score}%</b>`);
    this.leafletMap?.fitBounds([[mnLa, mnLo], [mxLa, mxLo]], { padding: [40, 40] });
  }

  private renderOrionData(): void {
    if (!this.orionCluster || !this.L) {
      return;
    }

    const renderKey = this.getOrionRenderKey();
    if (renderKey === this.orionRenderKey) {
      return;
    }
    this.orionRenderKey = renderKey;

    const data = this.getRenderableOrionFeatures();
    const visibleIds = new Set<string>();
    const markersToAdd: any[] = [];

    for (const feat of data) {
      const featureId = String(feat?.id || '').trim();
      if (!featureId) {
        continue;
      }

      visibleIds.add(featureId);

      const nextSignature = this.getOrionFeatureSignature(feat);
      const existing = this.orionMarkers.get(featureId);
      const previousSignature = this.orionMarkerSignatures.get(featureId);

      if (!existing) {
        const marker = this.createOrionMarker(feat);
        this.orionMarkers.set(featureId, marker);
        this.orionMarkerSignatures.set(featureId, nextSignature);
        markersToAdd.push(marker);
        continue;
      }

      if (previousSignature !== nextSignature) {
        this.orionCluster.removeLayer(existing);
        const marker = this.createOrionMarker(feat);
        this.orionMarkers.set(featureId, marker);
        this.orionMarkerSignatures.set(featureId, nextSignature);
        markersToAdd.push(marker);
      }
    }

    for (const [featureId, marker] of Array.from(this.orionMarkers.entries())) {
      if (visibleIds.has(featureId)) {
        continue;
      }
      this.orionCluster.removeLayer(marker);
      this.orionMarkers.delete(featureId);
      this.orionMarkerSignatures.delete(featureId);
    }

    if (markersToAdd.length > 0) {
      if (typeof this.orionCluster.addLayers === 'function') {
        this.orionCluster.addLayers(markersToAdd);
      }
      else {
        markersToAdd.forEach(marker => this.orionCluster.addLayer(marker));
      }
    }
  }

  private scheduleOrionRender(): void {
    if (!this.orionCluster || !this.L) {
      return;
    }
    if (this.orionRenderTimer) {
      return;
    }
    this.orionRenderTimer = setTimeout(() => {
      this.orionRenderTimer = null;
      this.renderOrionData();
    }, 80);
  }

  private getRenderableOrionFeatures(): any[] {
    const bounds = this.leafletMap?.getBounds?.();
    const paddedBounds = bounds?.pad(0.18);
    const zoom = this.leafletMap?.getZoom?.() ?? 3;

    const visibleFeatures = (this.orionData || []).filter((feat) => {
      if (!this.isValidOrionFeature(feat)) {
        return false;
      }
      if (!this.facilitiesVisible && feat.source !== 'WRI') {
        return false;
      }

      const [lon, lat] = feat.coordinates;
      if (paddedBounds && !paddedBounds.contains([lat, lon])) {
        return false;
      }

      return true;
    });

    return this.limitOrionFeaturesForZoom(visibleFeatures, zoom, paddedBounds);
  }

  private isValidOrionFeature(feat: any): boolean {
    if (!feat?.id || !Array.isArray(feat.coordinates) || feat.coordinates.length < 2) {
      return false;
    }

    const [lon, lat] = feat.coordinates;
    return feat.properties?.hasValidCoordinates !== false &&
      Number.isFinite(lon) &&
      Number.isFinite(lat) &&
      lon !== 0 &&
      lat !== 0;
  }

  private limitOrionFeaturesForZoom(features: any[], zoom: number, bounds: any): any[] {
    const limit = this.getOrionVisibleLimit(zoom);
    if (!Number.isFinite(limit) || features.length <= limit) {
      return features;
    }

    const focusedId = this.focusedFeature?.id ? String(this.focusedFeature.id) : '';
    const focusedFeature = focusedId
      ? features.find((feat) => String(feat?.id || '') === focusedId) ?? null
      : null;
    const remainingLimit = Math.max(0, limit - (focusedFeature ? 1 : 0));
    const grid = this.getOrionGridSize(zoom);
    const buckets = new Map<string, Array<{ feat: any; score: number }>>();

    for (const feat of features) {
      if (focusedFeature && String(feat?.id || '') === focusedId) {
        continue;
      }

      const bucketKey = this.getOrionGridKey(feat, bounds, grid.cols, grid.rows);
      const bucket = buckets.get(bucketKey) || [];
      bucket.push({
        feat,
        score: Math.abs(this.stableHash(String(feat?.id || `${feat?.coordinates?.[1]}:${feat?.coordinates?.[0]}`))),
      });
      buckets.set(bucketKey, bucket);
    }

    const sortedBuckets = Array.from(buckets.values())
      .map((bucket) => bucket.sort((left, right) => left.score - right.score))
      .sort((left, right) => right.length - left.length);

    const limitedFeatures: any[] = [];
    let round = 0;
    while (limitedFeatures.length < remainingLimit) {
      let addedThisRound = false;
      for (const bucket of sortedBuckets) {
        const entry = bucket[round];
        if (!entry) {
          continue;
        }
        limitedFeatures.push(entry.feat);
        addedThisRound = true;
        if (limitedFeatures.length >= remainingLimit) {
          break;
        }
      }
      if (!addedThisRound) {
        break;
      }
      round += 1;
    }

    return focusedFeature ? [focusedFeature, ...limitedFeatures] : limitedFeatures;
  }

  private getOrionVisibleLimit(zoom: number): number {
    if (zoom >= 11) {
      return Number.POSITIVE_INFINITY;
    }
    if (zoom >= 10) {
      return 8000;
    }
    if (zoom >= 9) {
      return 5200;
    }
    if (zoom >= 8) {
      return 3200;
    }
    if (zoom >= 7) {
      return 1900;
    }
    if (zoom >= 6) {
      return 1100;
    }
    if (zoom >= 5) {
      return 700;
    }
    if (zoom >= 4) {
      return 450;
    }
    return 280;
  }

  private getOrionGridSize(zoom: number): { cols: number; rows: number } {
    if (zoom >= 10) {
      return { cols: 36, rows: 24 };
    }
    if (zoom >= 8) {
      return { cols: 30, rows: 20 };
    }
    if (zoom >= 6) {
      return { cols: 24, rows: 16 };
    }
    if (zoom >= 4) {
      return { cols: 20, rows: 12 };
    }
    return { cols: 16, rows: 10 };
  }

  private getOrionGridKey(feat: any, bounds: any, cols: number, rows: number): string {
    const [lon, lat] = feat.coordinates;
    const west = bounds?.getWest?.() ?? -180;
    const east = bounds?.getEast?.() ?? 180;
    const south = bounds?.getSouth?.() ?? -85;
    const north = bounds?.getNorth?.() ?? 85;
    const lonSpan = Math.max(0.000001, east - west);
    const latSpan = Math.max(0.000001, north - south);
    const x = Math.max(0, Math.min(cols - 1, Math.floor(((lon - west) / lonSpan) * cols)));
    const y = Math.max(0, Math.min(rows - 1, Math.floor(((north - lat) / latSpan) * rows)));

    return `${x}:${y}`;
  }

  private stableHash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return hash;
  }

  private getOrionRenderKey(): string {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|count:${this.orionData.length}|v:${this.orionRenderVersion}|fac:${this.facilitiesVisible}|focus:${this.focusedFeature?.id || ''}`;
    }

    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `count:${this.orionData.length}`,
      `v:${this.orionRenderVersion}`,
      `fac:${this.facilitiesVisible}`,
      `focus:${this.focusedFeature?.id || ''}`,
    ].join('|');
  }

  private createOrionMarker(feat: any): any {
    const [lon, lat] = feat.coordinates;
    const color = feat.color || '#3b82f6';
    const marker = feat.source === 'WRI'
      ? this.L.marker([lat, lon], {
        icon: this.L.divIcon({
          html: `<div style="
            position:relative;
            width:18px;
            height:18px;
            background:${color};
            border:2px solid #ffffff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-sizing:border-box;
          ">
            <div style="
              position:absolute;
              top:50%;
              left:50%;
              width:6px;
              height:6px;
              border-radius:50%;
              background:#ffffff;
              transform:translate(-50%, -50%) rotate(45deg);
            "></div>
          </div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 18],
        }),
      })
      : this.L.circleMarker([lat, lon], {
        radius:      6,
        color:       '#ffffff',
        fillColor:   color,
        fillOpacity: 0.88,
        weight:      1.5,
      });

    const rows: string[] = [];
    const title = typeof feat.name === 'string' && feat.name.trim() ? feat.name.trim() : 'Feature';
    const properties = feat.properties && typeof feat.properties === 'object' ? feat.properties as Record<string, unknown> : {};

    rows.push(`<div style="font-size:12px;font-weight:700;line-height:1.35;margin-bottom:8px;color:#ffffff;">${title}</div>`);
    this.appendPopupRow(rows, 'Country', properties['country']);
    this.appendPopupRow(rows, 'Fuel', properties['fuel'] ?? properties['primary_fuel']);
    this.appendPopupRow(rows, 'Capacity', this.formatCapacityValue(properties['capacity_mw'] ?? feat.capacityMw));
    this.appendPopupRow(rows, 'Source', properties['source'] ?? feat.source);

    for (const [key, rawValue] of Object.entries(properties)) {
      if ([ 'name', 'country', 'fuel', 'primary_fuel', 'capacity_mw', 'source' ].includes(key)) {
        continue;
      }
      this.appendPopupRow(rows, this.humanizeFieldLabel(key), rawValue);
    }

    rows.push(this.popupRow('Coordinates', `${lat.toFixed(3)}, ${lon.toFixed(3)}`, true));

    marker.bindPopup(`<div style="width:178px;padding:8px 9px;background:#0d1627;border-radius:8px;">
      ${rows.join('')}
    </div>`, { className: 'orion-popup' });

    marker.orionFeature = feat;
    marker.on('click', () => {
      this.featureSelected.emit(feat);
      if (feat?.source === 'WRI' && feat?.id) {
        this.featureIdsSelected.emit([feat.id]);
      }
    });
    return marker;
  }

  private getOrionFeatureSignature(feat: any): string {
    const coords = Array.isArray(feat?.coordinates) ? feat.coordinates : [null, null];
    const properties = feat?.properties && typeof feat.properties === 'object' ? feat.properties : {};
    return JSON.stringify({
      id: feat?.id ?? null,
      name: feat?.name ?? null,
      source: feat?.source ?? null,
      type: feat?.type ?? null,
      rawType: feat?.rawType ?? null,
      color: feat?.color ?? null,
      capacityMw: feat?.capacityMw ?? null,
      lon: coords[0] ?? null,
      lat: coords[1] ?? null,
      properties,
    });
  }

  private popupRow(label: string, value: string, stacked = false): string {
    return `<div style="display:flex;${stacked ? 'flex-direction:column;align-items:flex-start;' : 'justify-content:space-between;align-items:flex-start;'}gap:4px;
      padding:4px 0;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;line-height:1.35;">
      <span style="color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.04em;">${label}</span>
      <span style="color:#ffffff;font-weight:600;${stacked ? '' : 'text-align:right;'}word-break:break-word;">${value}</span>
    </div>`;
  }

  private appendPopupRow(rows: string[], label: string, value: unknown): void {
    const formatted = this.formatPopupValue(value);
    if (!formatted) {
      return;
    }
    rows.push(this.popupRow(label, formatted));
  }

  mapEntityDotClass(type: string): string {
    const map: Record<string, string> = {
      hydro: 'bg-[#2563eb]',
      solar: 'bg-[#facc15]',
      wind: 'bg-[#16a34a]',
      gas: 'bg-[#f59e0b]',
      coal: 'bg-[#111827]',
      oil: 'bg-[#f97316]',
      nuclear: 'bg-[#dc2626]',
      geothermal: 'bg-[#ec4899]',
      biomass: 'bg-[#84cc16]',
      waste: 'bg-[#8b5cf6]',
      storage: 'bg-[#06b6d4]',
      cogeneration: 'bg-[#14b8a6]',
      petcoke: 'bg-[#78716c]',
      wave_and_tidal: 'bg-[#0ea5e9]',
      airport: 'bg-[#9333ea]',
      port: 'bg-[#0d9488]',
      warehouse: 'bg-[#92400e]',
      industrial: 'bg-[#6b7280]',
      military: 'bg-[#d71c1c]',
      other: 'bg-[#a3a3a3]',
    };
    return map[type] || 'bg-[#6b7280]';
  }

  private humanizeFieldLabel(key: string): string {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/^./, (char) => char.toUpperCase());
  }

  private formatPopupValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return JSON.stringify(value);
  }

  private formatCapacityValue(value: unknown): string {
    if (typeof value !== 'number') {
      return this.formatPopupValue(value);
    }
    return `${value} MW`;
  }

  private focusOnFeature(): void {
    if (!this.leafletMap || !this.L || !this.focusedFeature) {
      this.updateCountryHighlight();
      return;
    }
    const [lon, lat] = this.focusedFeature.coordinates;
    const currentZoom = this.leafletMap.getZoom();
    this.leafletMap.flyTo([lat, lon], Math.max(currentZoom, 8));
    this.updateCountryHighlight();
  }

  private deltaToZoom(d: number): number {
    if (d <= 0.005) {
      return 17;
    } if (d <= 0.01) {
      return 16;
    } if (d <= 0.02) {
      return 15;
    }
    if (d <= 0.04)  {
      return 14;
    } if (d <= 0.08) {
      return 13;
    } if (d <= 0.15) {
      return 12;
    }
    if (d <= 0.3)   {
      return 11;
    } if (d <= 0.6)  {
      return 10;
    } return 9;
  }

  private facColor(kind: string): string {
    const M: Record<string, string> = {
      industrial: '#f59e0b', port: '#ef4444', depot: '#f97316',
      warehouse: '#f59e0b', logistics: '#f97316', dock: '#38bdf8',
      boatyard: '#38bdf8', pier: '#38bdf8', crane: '#a78bfa',
      storage_tank: '#ef4444', pipeline: '#6b7280', breakwater: '#6b7280',
      hangar: '#a78bfa', factory: '#ef4444',
    };
    return M[kind] || '#6b7280';
  }
}
