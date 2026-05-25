import { AfterViewInit, ApplicationRef, ChangeDetectorRef, Component, ElementRef, EnvironmentInjector, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { OrionSatelliteFeature, TrackingEntityState, TrackingEntityType, TrackingSidebarBridge } from '../../models/geo-fencing.models';
import { SatelliteAircraftTrackingService } from '../map-entities/aircraft/aircraft-tracking.service';
import { EntityRenderer } from '../map-entities/entity-renderer';
import { SatelliteShipTrackingService } from '../map-entities/ships/ship-tracking.service';
import { normalizeEntityId } from '../map-utils/renderer-utils';
import { CountryBoundaryMapRenderer } from '../map-overlays/country-boundary-map-renderer';
import { SearchLocationMapRenderer } from '../map-overlays/search-location-map-renderer';

@Component({
  selector:    'app-satellite-map-renderer',
  standalone:  true,
  templateUrl: './map-renderer.component.html',
})
export class MapRendererComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static readonly WORLD_BOUNDS = [[-85.05112878, -180], [85.05112878, 180]] as const;
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('zoomLabelElement') private zoomLabelElement?: ElementRef<HTMLDivElement>;
  private leafletMap: any   = null;
  private esriLayer: any    = null;
  private esriLowResLayer: any = null;
  private osmLayer: any     = null;
  private osmLowResLayer: any = null;
  private L: any            = null;
  private moveTimer: any    = null;
  private resizeObserver: ResizeObserver | null = null;
  private entityRenderer?: EntityRenderer;
  private countryBoundaryRenderer?: CountryBoundaryMapRenderer;
  private searchLocationRenderer?: SearchLocationMapRenderer;
  private sidebarRequestToken = 0;

  selectedEntity: { type: TrackingEntityType; data: any | null } | null = null;
  sidebarVisible = false;
  sidebarLoading = false;
  sidebarError: string | null = null;
  activeEntity: TrackingEntityState | null = null;
  loadingEntity: TrackingEntityState | null = null;

  @Input() lat:              number | null = null;
  @Input() lon:              number | null = null;
  @Input() delta             = 0.05;
  @Input() selectedLayer:    'esri' | 'osm' = 'osm';
  @Input() facilitiesVisible = true;
  @Input() facilityFeatures:  OrionSatelliteFeature[] = [];
  @Input() anomalyData:      any | null = null;
  @Input() aircraftData:     SatelliteLiveAircraft[] = [];
  @Input() shipsData:        SatelliteLiveShip[]     = [];
  @Input() orionData:        OrionSatelliteFeature[] = [];
  @Input() focusedFeature:   OrionSatelliteFeature | null = null;
  @Input() topControlsInset = false;

  @Output() mapMoved  = new EventEmitter<{ lat: number; lon: number; zoom: number; trackingDelta: number }>();
  @Output() featureSelected = new EventEmitter<any>();
  @Output() featureIdsSelected = new EventEmitter<string[]>();

  constructor(private appRef: ApplicationRef, private environmentInjector: EnvironmentInjector, private aircraftTrackingService: SatelliteAircraftTrackingService, private shipTrackingService: SatelliteShipTrackingService, private cd: ChangeDetectorRef, private ngZone: NgZone) {}

  openSidebarLoading(type: TrackingEntityType, id: string, seedData: any): number {
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

  openSidebar(type: TrackingEntityType, data: any): void {
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

  openSidebarError(type: TrackingEntityType, id: string, message: string): void {
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

  closeSidebar(): void {
    this.selectedEntity = null;
    this.sidebarVisible = false;
    this.sidebarLoading = false;
    this.sidebarError = null;
    this.activeEntity = null;
    this.loadingEntity = null;
    this.entityRenderer?.clearAircraftTrack();
    this.refreshSelectionState();
    this.cd.detectChanges();
  }

  focusLocation(lat: number, lon: number, delta: number): void {
    this.lat = lat;
    this.lon = lon;
    this.delta = delta;
    this.ngZone.runOutsideAngular(() => this.updateMapView());
  }

  clearLocation(): void {
    this.lat = null;
    this.lon = null;
    this.searchLocationRenderer?.render(null, null);
    if (this.leafletMap && this.L) {
      this.leafletMap.fitBounds(this.L.latLngBounds(MapRendererComponent.WORLD_BOUNDS));
      this.updateZoomLabel();
    }
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      void this.initMap();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngZone.runOutsideAngular(() => {
      if (changes['lat'] || changes['lon'] || changes['delta']) {
        this.updateMapView();
      }
      if (changes['facilityFeatures']) {
        this.entityRenderer?.renderFacilities(this.facilityFeatures);
      }
      if (changes['anomalyData'])     {
        this.entityRenderer?.renderAnomaly(this.anomalyData);
      }
      if (changes['aircraftData']) {
        this.entityRenderer?.renderAircraft(true);
      }
      if (changes['shipsData']) {
        this.entityRenderer?.renderShips(true);
      }
      if (changes['orionData']) {
        this.entityRenderer?.renderOrionFacilities(true);
      }
      if (changes['focusedFeature']) {
        this.focusOnFeature();
        this.entityRenderer?.renderOrionFacilities(true);
      }
      if (changes['selectedLayer'])   {
        this.switchLayer();
      }
      if (changes['facilitiesVisible']) {
        this.entityRenderer?.setFacilitiesVisible(this.facilitiesVisible);
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.moveTimer);
    this.entityRenderer?.destroy();
    this.countryBoundaryRenderer?.destroy();
    this.searchLocationRenderer?.destroy();
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
        zoomControl: false,
        attributionControl: false,
        maxBounds: this.L.latLngBounds(MapRendererComponent.WORLD_BOUNDS),
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
          bounds: MapRendererComponent.WORLD_BOUNDS,
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
          bounds: MapRendererComponent.WORLD_BOUNDS,
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
          bounds: MapRendererComponent.WORLD_BOUNDS,
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
          bounds: MapRendererComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 500,
          keepBuffer: 0,
          detectRetina: false,
        },);

      this.refreshBaseLayerDetail();
      this.updateZoomLabel();

      this.countryBoundaryRenderer = new CountryBoundaryMapRenderer(this.L, this.leafletMap);
      await this.countryBoundaryRenderer.init();
      this.countryBoundaryRenderer.setFocusedFeature(this.focusedFeature);
      this.searchLocationRenderer = new SearchLocationMapRenderer(this.L, this.leafletMap);

      this.updateMinZoomToFitContainer();
      const trackingSidebar: TrackingSidebarBridge = {
        getActiveEntity: () => this.activeEntity,
        getLoadingEntity: () => this.loadingEntity,
        isCurrentRequestToken: (token: number) => token === this.sidebarRequestToken,
        openLoading: (type: TrackingEntityType, id: string, seedData: any) => this.openSidebarLoading(type, id, seedData),
        openData: (type: TrackingEntityType, data: any) => this.openSidebar(type, data),
        openError: (type: TrackingEntityType, id: string, message: string) => this.openSidebarError(type, id, message),
      };
      this.entityRenderer = new EntityRenderer({
        L: this.L,
        map: this.leafletMap,
        appRef: this.appRef,
        environmentInjector: this.environmentInjector,
        aircraftService: this.aircraftTrackingService,
        shipService: this.shipTrackingService,
        sidebar: trackingSidebar,
        getAircraftData: () => this.aircraftData,
        getShipsData: () => this.shipsData,
        getOrionData: () => this.orionData,
        getFocusedFeature: () => this.focusedFeature,
        onFeatureSelected: (feature: OrionSatelliteFeature) => this.ngZone.run(() => this.featureSelected.emit(feature)),
        onFeatureIdsSelected: (ids: string[]) => this.ngZone.run(() => this.featureIdsSelected.emit(ids)),
      });
      this.entityRenderer.init(this.facilitiesVisible);

      this.leafletMap.on('zoomstart', () => {
        this.loadingEntity = null;
      });

      this.leafletMap.on('zoomend', () => {
        const z = this.leafletMap.getZoom();
        this.updateZoomLabel();
        this.refreshMarkerSizingForZoom(z);
        this.entityRenderer?.renderViewport();
        this.scheduleViewportEmit();
      });

      this.leafletMap.on('moveend', () => {
        this.updateZoomLabel();
        this.entityRenderer?.renderViewport();
        this.scheduleViewportEmit();
      });

      if (Number.isFinite(this.lat) && Number.isFinite(this.lon)) {
        this.updateMapView();
      }
      if (this.facilityFeatures?.length) {
        this.entityRenderer?.renderFacilities(this.facilityFeatures);
      }
      if (this.anomalyData)     {
        this.entityRenderer?.renderAnomaly(this.anomalyData);
      }
      if (this.aircraftData?.length) {
        this.entityRenderer?.renderAircraft();
      }
      if (this.shipsData?.length) {
        this.entityRenderer?.renderShips();
      }
      if (this.orionData?.length) {
        this.entityRenderer?.renderOrionFacilities();
      }
      this.resizeObserver = new ResizeObserver(() => {
        this.leafletMap?.invalidateSize();
        this.updateMinZoomToFitContainer();
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
      setTimeout(() => {
        this.leafletMap?.invalidateSize();
        this.updateMinZoomToFitContainer();
        this.updateZoomLabel();
        this.scheduleViewportEmit();
      }, 0);
    }
    catch { }
  }

  private updateMapView(): void {
    if (!this.leafletMap || !Number.isFinite(this.lat) || !Number.isFinite(this.lon)) {
      return;
    }
    this.leafletMap.setView([this.lat, this.lon], this.deltaToZoom(this.delta));
    this.leafletMap.invalidateSize();
    this.searchLocationRenderer?.render(this.lat, this.lon);
    this.updateZoomLabel();
  }

  private updateMinZoomToFitContainer(): void {
    if (!this.leafletMap || !this.L) {
      return;
    }

    const worldBounds = this.L.latLngBounds(MapRendererComponent.WORLD_BOUNDS);
    const minZoom = Math.max(1, this.leafletMap.getBoundsZoom(worldBounds, true));
    this.leafletMap.setMinZoom(minZoom);

    if (this.leafletMap.getZoom() < minZoom) {
      this.leafletMap.setZoom(minZoom);
    }
    this.updateZoomLabel();
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

  private refreshSelectionState(): void {
    this.entityRenderer?.refreshSelectionState();
  }

  private getEntityId(type: TrackingEntityType, data: any): string | null {
    return normalizeEntityId(type === 'aircraft' ? data?.icao24 : data?.mmsi);
  }

  private refreshMarkerSizingForZoom(zoom: number): void {
    const bucket = Math.round(zoom * 2);
    this.entityRenderer?.setMarkerZoomBucket(bucket);
  }

  private updateZoomLabel(): void {
    if (!this.leafletMap || !this.zoomLabelElement?.nativeElement) {
      return;
    }
    const center = this.leafletMap.getCenter();
    const zoom = this.leafletMap.getZoom();
    this.zoomLabelElement.nativeElement.textContent = `zoom ${zoom.toFixed(1)}  ·  ${center.lat.toFixed(4)}°N  ${center.lng.toFixed(4)}°E`;
  }

  private scheduleViewportEmit(): void {
    clearTimeout(this.moveTimer);
    this.moveTimer = setTimeout(() => {
      if (!this.leafletMap) {
        return;
      }
      const center = this.leafletMap.getCenter();
      const viewport = {
        lat: center.lat,
        lon: center.lng,
        zoom: this.leafletMap.getZoom(),
        trackingDelta: this.getVisibleBoundsDelta(),
      };
      this.ngZone.run(() => this.mapMoved.emit(viewport));
    }, 500);
  }

  private getVisibleBoundsDelta(): number {
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return this.delta;
    }
    const latDelta = Math.abs(bounds.getNorth() - bounds.getSouth()) / 2;
    const west = bounds.getWest();
    const east = bounds.getEast();
    const lonSpan = east >= west ? east - west : east + 360 - west;
    const lonDelta = Math.min(180, Math.abs(lonSpan) / 2);
    return Math.max(0.05, Math.min(180, Math.max(latDelta, lonDelta)));
  }

  private focusOnFeature(): void {
    this.countryBoundaryRenderer?.setFocusedFeature(this.focusedFeature);
    if (!this.leafletMap || !this.L || !this.focusedFeature) {
      return;
    }
    const [lon, lat] = this.focusedFeature.coordinates;
    const currentZoom = this.leafletMap.getZoom();
    this.leafletMap.flyTo([lat, lon], Math.max(currentZoom, 8));
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
}
