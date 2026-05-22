import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { loadModules, setDefaultOptions } from 'esri-loader';
import { buildArcPath, buildArcPathPoints, buildCountryFeatureIndex, buildSurfacePath, collectArcPairs, getFeatureAnchor, getArcPointAtProgress } from './threat-lens-map.utils';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { FilterModel } from '../../../shared/model/filter/filter.model';
import { FiltersComponent } from "../../../shared/partials/filters/filters.component";
import { threat_lens_filters } from '../../../shared/constants/filters';
import { GeoCameraResponse } from '../../../shared/model/network-intel/network-intel-api.models';
import { CameraInfo } from '../../../shared/model/network-intel/network-intel.model';
import { AnimatedArcDescriptor, SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensCoordinate, ThreatLensFeedItem, ThreatLensIotMarkerCluster, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, ThreatLensVisibleArea, } from './threat.lens.model';
import { ThreatLensService } from './threat.lens.service';
import { ThreatLensFeedPanelComponent } from './threat-lens-feed-panel/threat-lens-feed-panel';
import { ThreatLensIpDetailPopupComponent } from './threat-lens-ip-detail-popup/threat-lens-ip-detail-popup';


@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltersComponent, ThreatLensFeedPanelComponent, ThreatLensIpDetailPopupComponent],
  templateUrl: './threat-lens.html',
  host: { class: 'block h-full min-h-0 w-full' },
})
export class ThreatLensComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewNode?: ElementRef<HTMLDivElement>;
  private view: any | null = null;
  private countryLayer: any | null = null;
  private newsGraphicsLayer: any | null = null;
  private iotGraphicsLayer: any | null = null;
  private arcGraphicsLayer: any | null = null;
  private arcSurfaceGraphicsLayer: any | null = null;
  private animatedArcGraphicsLayer: any | null = null;
  private countryLayerView: any | null = null;
  private highlightHandle: { remove: () => void } | null = null;
  private mapClickHandle: { remove: () => void } | null = null;
  private mapStationaryHandle: { remove: () => void } | null = null;
  private mapHoverHandle: { remove: () => void } | null = null;
  private countryFeatureIndex = new Map<string, any>();
  private countryLandGeometries: any[] = [];
  private countryNewsCountByKey = new Map<string, number>();
  private categoryCountryNewsCountByKey = new Map<ThreatLensCategoryModelKey, Map<string, number>>();
  private geometryEngine: any | null = null;
  private webMercatorUtils: any | null = null;
  private animatedArcs: AnimatedArcDescriptor[] = [];
  private arcAnimationFrame: number | null = null;
  private lastAnimationTick = 0;
  private batchAnimationStartTime = 0;
  private visibleBatchIndex = -1;
  private readonly maxArcCount = 80;
  private readonly minArcWeight = 1;
  private readonly arcBatchSize = 5;
  private readonly arcBatchDuration = 6000;
  private readonly movingDotBaseSize = 90000;
  private readonly countryNameFields = ['COUNTRY', 'COUNTRYAFF', 'NAME', 'ADMIN', 'SOVEREIGNT'];
  private movingDotGraphics: any[] = [];
  private activeArcCountryFilterKey = '';
  private loadRequestId = 0;
  private destroyed = false;
  private hoverHighlightHandle: { remove: () => void } | null = null;
  private hoverTooltipEl: HTMLDivElement | null = null;
  private hoveredCountryKey = '';
  private mapResizeObserver: ResizeObserver | null = null;
  private mapResizeFrame: number | null = null;
  private startMarkerGraphics: any[] = [];
  private endMarkerGraphics: any[] = [];
  private iotMarkerGraphics: any[] = [];
  private iotPulseAnimationFrame: number | null = null;
  private iotPulseTick = 0;
  private iotScanTimer: number | null = null;
  private iotScanRequestId = 0;
  private currentIotScanKey = '';
  private hasUserMovedMap = false;
  private readonly iotDebounceMs = 5000;
  private readonly iotMinScanRadiusKm = 25;
  private readonly iotMaxScanRadiusKm = 20015;
  private readonly iotScanMaxIps = 200;
  private readonly earthRadiusKm = 6371;

  protected readonly filterModel: FilterModel = threat_lens_filters;

  isFilterOpen$: Observable<boolean>;
  searchTerm = '';
  currentQuery = '';
  selectedCountryName = '';
  statusMessage = 'Loading threat lens results...';
  isLoading = true;
  topCountries: ThreatCountryCount[] = [];
  arcCount = 0;
  categoryLegend: ThreatLensLegendItem[] = [];
  selectedCountryBreakdown: SelectedCountryCategoryCount[] = [];
  feedItems: ThreatLensFeedItem[] = [];
  isSearchPanelCollapsed = false;
  isThreatPanelCollapsed = false;
  iotScanningEnabled = false;
  iotIsScanning = false;
  iotStatusMessage = 'IP scanning is off.';
  iotResultCount = 0;
  selectedIotIp = '';

  @Input() showFilterButton = true;

  @Output() loadingChange = new EventEmitter<boolean>();

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef, private threatLensService: ThreatLensService, protected sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadRequestId += 1;
    this.iotScanRequestId += 1;
    this.cancelPendingIotScan();
    this.mapClickHandle?.remove();
    this.mapClickHandle = null;
    this.mapStationaryHandle?.remove();
    this.mapStationaryHandle = null;
    this.mapHoverHandle?.remove();
    this.mapHoverHandle = null;
    this.clearHighlight();
    this.stopArcAnimation();
    this.stopIotPulseAnimation();
    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = null;

    if (this.mapResizeFrame !== null) {
      cancelAnimationFrame(this.mapResizeFrame);
      this.mapResizeFrame = null;
    }

    if (this.view) {
      this.view.destroy();
      this.view = null;
    }

    this.clearHoverHighlight();

    if (this.hoverTooltipEl) {
      this.hoverTooltipEl.remove();
      this.hoverTooltipEl = null;
    }
  }

  async onSearch(): Promise<void> {
    await this.loadThreatLensData(this.searchTerm.trim());
  }

  async onTopCountrySelect(country: string): Promise<void> {
    const normalizedCountry = this.threatLensService.normalizeCountryLabel(country);
    this.searchTerm = normalizedCountry;
    await this.loadThreatLensData(normalizedCountry);
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapViewNode?.nativeElement) {
      return;
    }

    try {
      setDefaultOptions({ version: '4.34' });

      const [
        EsriMap,
        SceneView,
        FeatureLayer,
        GraphicsLayer,
        geometryEngine,
        webMercatorUtils,
      ] = await loadModules([
        'esri/Map',
        'esri/views/SceneView',
        'esri/layers/FeatureLayer',
        'esri/layers/GraphicsLayer',
        'esri/geometry/geometryEngine',
        'esri/geometry/support/webMercatorUtils',
      ]);

      if (this.destroyed) {
        return;
      }

      this.geometryEngine = geometryEngine;
      this.webMercatorUtils = webMercatorUtils;

      this.countryLayer = new FeatureLayer({
        url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0',
        outFields: ['*'],
        popupEnabled: false,
        opacity: 1,

        renderer: {
          type: 'simple',
          symbol: {
            type: 'simple-fill',
            color: [29, 45, 71, 0],
            outline: {
              color: [255, 255, 255, 0.1],
              width: 0.8,
            },
          },
        },
        labelsVisible: true,
      });

      this.newsGraphicsLayer = new GraphicsLayer({ title: 'Threat Lens Intensity' });
      this.iotGraphicsLayer = new GraphicsLayer({
        title: 'Threat Lens IoT Exposure',
        elevationInfo: { mode: 'relative-to-ground' },
      });
      this.arcGraphicsLayer = new GraphicsLayer({
        title: 'Threat Lens Country Arcs',
        elevationInfo: { mode: 'absolute-height' },
      });
      this.animatedArcGraphicsLayer = new GraphicsLayer({
        title: 'Threat Lens Animated Arcs',
        elevationInfo: { mode: 'absolute-height' },
      });
      this.arcSurfaceGraphicsLayer = new GraphicsLayer({ title: 'Threat Lens Country Arc Connectors' });

      const map = new EsriMap({
        basemap: 'streets-vector',
        ground: 'world-elevation',
        layers: [this.countryLayer, this.newsGraphicsLayer, this.iotGraphicsLayer, this.arcSurfaceGraphicsLayer, this.arcGraphicsLayer, this.animatedArcGraphicsLayer],
      });

      this.view = new SceneView({
        container: this.mapViewNode.nativeElement,
        map,
        qualityProfile: 'high',
        viewingMode: 'global',
        camera: {
          position: { longitude: -10, latitude: 30, z: 17000000 },
          tilt: 0,
        },
        environment: {
          atmosphereEnabled: false,
          starsEnabled: true,
        },
      });

      await this.view.when();
      this.observeMapResize();
      this.scheduleMapResize();
      window.setTimeout(() => this.view?.resize?.(), 150);
      this.createTooltip();
      if (this.destroyed) {
        return;
      }

      this.view.ui.components = [];
      this.countryLayerView = await this.view.whenLayerView(this.countryLayer);
      await this.buildCountryFeatureIndex();
      if (this.destroyed) {
        return;
      }

      this.registerClickHandler();
      this.registerHoverHandler();
      this.registerIotMovementHandler();
      await this.loadThreatLensData('');
    }
    catch (error) {
      console.error('Failed to initialize threat lens map', error);
      this.ngZone.run(() => {
        this.setLoading(false);
        this.statusMessage = 'Failed to initialize threat lens map.';
      });
    }
  }

  private observeMapResize(): void {
    const element = this.mapViewNode?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = new ResizeObserver(() => this.scheduleMapResize());
    this.mapResizeObserver.observe(element);
  }

  private scheduleMapResize(): void {
    if (this.mapResizeFrame !== null || typeof requestAnimationFrame !== 'function') {
      return;
    }

    this.mapResizeFrame = requestAnimationFrame(() => {
      this.mapResizeFrame = null;
      this.view?.resize?.();
    });
  }

  private registerIotMovementHandler(): void {
    this.mapStationaryHandle?.remove();
    this.mapStationaryHandle = this.view.watch('stationary', (isStationary: boolean) => {
      if (this.destroyed) {
        return;
      }

      if (!isStationary) {
        this.hasUserMovedMap = true;
        this.cancelPendingIotScan();
        if (this.iotScanningEnabled) {
          this.ngZone.run(() => {
            this.iotStatusMessage = 'Waiting for globe movement to settle...';
            this.cdr.detectChanges();
          });
        }
        return;
      }

      if (this.hasUserMovedMap && this.iotScanningEnabled) {
        this.scheduleIotScanForCurrentView();
      }
    });
  }

  private scheduleIotScanForCurrentView(): void {
    if (!this.iotScanningEnabled) {
      return;
    }

    const visibleArea = this.getVisibleIotArea();
    if (!visibleArea) {
      return;
    }

    const scanKey = this.buildIotScanKey(visibleArea);
    if (scanKey === this.currentIotScanKey) {
      return;
    }

    this.cancelPendingIotScan();
    const requestId = ++this.iotScanRequestId;

    this.iotScanTimer = window.setTimeout(() => {
      this.iotScanTimer = null;
      void this.runIotScan(visibleArea, scanKey, requestId);
    }, this.iotDebounceMs);

    this.ngZone.run(() => {
      this.iotStatusMessage = 'Scanning visible area shortly...';
      this.cdr.detectChanges();
    });
  }

  private cancelPendingIotScan(): void {
    if (this.iotScanTimer !== null) {
      clearTimeout(this.iotScanTimer);
      this.iotScanTimer = null;
    }
  }

  private async runIotScan(visibleArea: ThreatLensVisibleArea, scanKey: string, requestId: number): Promise<void> {
    if (!this.iotScanningEnabled || !this.isActiveIotRequest(requestId)) {
      return;
    }

    const requestCoordinates = `${visibleArea.center.lat},${visibleArea.center.lng}`;
    const radiusKm = Math.ceil(visibleArea.radiusKm);

    this.ngZone.run(() => {
      this.iotIsScanning = true;
      this.iotStatusMessage = `Scanning visible area (${radiusKm} km range)...`;
      this.cdr.detectChanges();
    });

    try {
      const result = await firstValueFrom(this.threatLensService.detectIotThreats(requestCoordinates, radiusKm, this.iotScanMaxIps));
      if (!this.iotScanningEnabled || !this.isActiveIotRequest(requestId)) {
        return;
      }
      const response = result.result ?? result;
      const markers = this.buildIotResponseMarkers(response, visibleArea);
      const landMarkers = this.filterIotMarkersOnLand(markers);
      this.currentIotScanKey = scanKey;
      this.renderIotMarkers(this.clusterIotCameras(landMarkers));

      this.ngZone.run(() => {
        this.iotResultCount = landMarkers.length;
        this.iotStatusMessage = landMarkers.length
          ? `Detected ${landMarkers.length} land-based IoT result(s) across the visible ${radiusKm} km range.`
          : `No exposed IoT results found across the visible ${radiusKm} km range.`;
        this.iotIsScanning = false;
        this.cdr.detectChanges();
      });
    }
    catch (error) {
      console.error('Failed to scan visible area for IoT exposure', error);
      if (!this.iotScanningEnabled || !this.isActiveIotRequest(requestId)) {
        return;
      }

      this.ngZone.run(() => {
        this.iotIsScanning = false;
        this.iotStatusMessage = 'IoT scan failed for the visible area.';
        this.cdr.detectChanges();
      });
    }
  }

  private getMapCenterCoordinates(): { lat: number; lng: number } | null {
    const point = this.view?.center || this.view?.camera?.position;
    if (!point) {
      return null;
    }

    return this.toGeographicCoordinates(point);
  }

  private getVisibleIotArea(): ThreatLensVisibleArea | null {
    const center = this.getMapCenterCoordinates();
    if (!center) {
      return null;
    }

    const sampledPoints = this.collectVisibleMapCoordinates();
    const points = this.dedupeCoordinates([center, ...sampledPoints]);
    const bounds = this.calculateCoordinateBounds(points);
    const radiusKm = this.calculateVisibleRadiusKm(center, points);

    return {
      center,
      bounds,
      radiusKm,
      sampledPoints: points,
    };
  }

  private collectVisibleMapCoordinates(): ThreatLensCoordinate[] {
    if (!this.view?.toMap) {
      return this.collectExtentCoordinates();
    }

    const width = Number(this.view.width || this.mapViewNode?.nativeElement?.clientWidth || 0);
    const height = Number(this.view.height || this.mapViewNode?.nativeElement?.clientHeight || 0);
    if (!width || !height) {
      return this.collectExtentCoordinates();
    }

    const points: ThreatLensCoordinate[] = [];
    const sampleStops = [0, 0.25, 0.5, 0.75, 1];
    const maxX = Math.max(0, width - 1);
    const maxY = Math.max(0, height - 1);

    for (const yRatio of sampleStops) {
      for (const xRatio of sampleStops) {
        try {
          const mapPoint = this.view.toMap({
            x: Math.round(maxX * xRatio),
            y: Math.round(maxY * yRatio),
          });
          const coordinate = this.toGeographicCoordinates(mapPoint);
          if (coordinate) {
            points.push(coordinate);
          }
        }
        catch {
          // Some sky/globe edge samples do not intersect the ground in SceneView.
        }
      }
    }

    const extentPoints = points.length >= 3 ? [] : this.collectExtentCoordinates();
    return this.dedupeCoordinates([...points, ...extentPoints]);
  }

  private collectExtentCoordinates(): ThreatLensCoordinate[] {
    const extent = this.view?.extent;
    if (!extent) {
      return [];
    }

    return this.dedupeCoordinates([
      this.toGeographicCoordinates({ x: extent.xmin, y: extent.ymin }),
      this.toGeographicCoordinates({ x: extent.xmin, y: extent.ymax }),
      this.toGeographicCoordinates({ x: extent.xmax, y: extent.ymin }),
      this.toGeographicCoordinates({ x: extent.xmax, y: extent.ymax }),
      this.toGeographicCoordinates(extent.center),
    ].filter((point): point is ThreatLensCoordinate => Boolean(point)));
  }

  private toGeographicCoordinates(point: any): ThreatLensCoordinate | null {
    const longitude = typeof point.longitude === 'number' ? point.longitude : point.x;
    const latitude = typeof point.latitude === 'number' ? point.latitude : point.y;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return null;
    }

    const coordinates = Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90
      ? [longitude, latitude]
      : this.webMercatorUtils?.xyToLngLat
        ? this.webMercatorUtils.xyToLngLat(longitude, latitude)
        : [longitude, latitude];

    if (!Number.isFinite(coordinates?.[0]) || !Number.isFinite(coordinates?.[1])) {
      return null;
    }

    return {
      lat: this.roundCoordinate(Math.max(-90, Math.min(90, coordinates[1]))),
      lng: this.roundCoordinate(this.normalizeLongitude(coordinates[0])),
    };
  }

  private dedupeCoordinates(points: ThreatLensCoordinate[]): ThreatLensCoordinate[] {
    const seen = new Set<string>();
    const result: ThreatLensCoordinate[] = [];

    for (const point of points) {
      const key = `${point.lat.toFixed(5)}:${point.lng.toFixed(5)}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(point);
      }
    }

    return result;
  }

  private calculateCoordinateBounds(points: ThreatLensCoordinate[]): ThreatLensVisibleArea['bounds'] {
    const lats = points.map((point) => point.lat);
    const lngBounds = this.calculateLongitudeBounds(points.map((point) => point.lng));

    return {
      minLat: this.roundCoordinate(Math.min(...lats)),
      maxLat: this.roundCoordinate(Math.max(...lats)),
      westLng: lngBounds.westLng,
      eastLng: lngBounds.eastLng,
    };
  }

  private calculateLongitudeBounds(longitudes: number[]): { westLng: number; eastLng: number } {
    if (!longitudes.length) {
      return { westLng: 0, eastLng: 0 };
    }

    const sorted = Array.from(new Set(longitudes.map((lng) => (this.normalizeLongitude(lng) + 360) % 360))).sort((a, b) => a - b);
    if (sorted.length === 1) {
      const longitude = this.roundCoordinate(this.normalizeLongitude(sorted[0]));
      return { westLng: longitude, eastLng: longitude };
    }

    let largestGap = -1;
    let gapStartIndex = 0;
    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      const next = sorted[(index + 1) % sorted.length] + (index === sorted.length - 1 ? 360 : 0);
      const gap = next - current;
      if (gap > largestGap) {
        largestGap = gap;
        gapStartIndex = index;
      }
    }

    const west = sorted[(gapStartIndex + 1) % sorted.length];
    const east = sorted[gapStartIndex];
    return {
      westLng: this.roundCoordinate(this.normalizeLongitude(west)),
      eastLng: this.roundCoordinate(this.normalizeLongitude(east)),
    };
  }

  private calculateVisibleRadiusKm(center: ThreatLensCoordinate, points: ThreatLensCoordinate[]): number {
    const maxDistance = Math.max(0, ...points.map((point) => this.haversineDistanceKm(center, point)));
    const bufferedDistance = Math.ceil(maxDistance * 1.08);
    return Math.max(this.iotMinScanRadiusKm, Math.min(this.iotMaxScanRadiusKm, bufferedDistance));
  }

  private haversineDistanceKm(start: ThreatLensCoordinate, end: ThreatLensCoordinate): number {
    const toRadians = (value: number) => value * Math.PI / 180;
    const latitudeDelta = toRadians(end.lat - start.lat);
    const longitudeDelta = toRadians(this.normalizeLongitude(end.lng - start.lng));
    const startLatitude = toRadians(start.lat);
    const endLatitude = toRadians(end.lat);
    const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * this.earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  }

  private buildIotScanKey(visibleArea: ThreatLensVisibleArea): string {
    const { center, bounds, radiusKm } = visibleArea;
    return [
      center.lat.toFixed(4),
      center.lng.toFixed(4),
      bounds.minLat.toFixed(3),
      bounds.maxLat.toFixed(3),
      bounds.westLng.toFixed(3),
      bounds.eastLng.toFixed(3),
      Math.ceil(radiusKm),
    ].join(':');
  }

  private roundCoordinate(value: number): number {
    return Number(value.toFixed(6));
  }

  private normalizeLongitude(value: number): number {
    let longitude = value;
    while (longitude > 180) {
      longitude -= 360;
    }
    while (longitude < -180) {
      longitude += 360;
    }
    return longitude;
  }

  private registerClickHandler(): void {
    console.log('Registering click handler');
    if (!this.view || !this.countryLayer) {
      console.log('1st return');
      return;
    }

    this.mapClickHandle = this.view.on('click', async (event: any) => {
      if (!this.view || !this.countryLayer) {
        console.log('2nd return');
        return;
      }

      const hit = await this.view.hitTest(event, { include: [this.iotGraphicsLayer, this.countryLayer].filter(Boolean) });
      const iotGraphic = hit.results.find((result: any) => this.isIotTooltipGraphic(result.graphic))?.graphic;

      if (iotGraphic) {
        this.clearHoverHighlight();
        this.hideTooltip();
        const ip = this.getPrimaryIotIp(iotGraphic.attributes || {});
        if (ip) {
          this.selectedIotIp = ip;
          this.cdr.detectChanges();
        }
        else {
          this.showIotTooltip(event, iotGraphic.attributes || {});
        }
        return;
      }

      const countryGraphic = hit.results.find((result: any) => result.graphic?.layer === this.countryLayer)?.graphic;

      if (!countryGraphic) {
        this.clearHighlight();
        this.ngZone.run(() => {
          this.selectedCountryName = '';
          this.selectedCountryBreakdown = [];
          this.statusMessage = 'No country detected at clicked point.';
        });
        console.log('3rd return');
        return;
      }

      const name = this.extractCountryName(countryGraphic.attributes);
      const countryKey = this.toCountryKey(name);
      const countryCount = this.countryNewsCountByKey.get(countryKey) || 0;

      this.ngZone.run(() => {
        this.selectedCountryName = name;
        this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(countryKey);
        this.statusMessage = name
          ? `${name}: ${countryCount} related threat result(s).`
          : 'Country selected.';
        this.cdr.detectChanges();
      });

      this.applyHighlight(countryGraphic);
      const geometryToFocus = countryGraphic.geometry?.extent ?? countryGraphic.geometry;

      if (geometryToFocus) {
        await this.view.goTo(geometryToFocus, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
      }
    });
  }

  private registerHoverHandler(): void {
    if (!this.view || !this.countryLayer) {
      return;
    }
    this.clearHighlight();
    this.mapHoverHandle = this.view.on('pointer-move', async (event: any) => {
      if (!this.view || !this.countryLayer) {
        return;
      }

      const hit = await this.view.hitTest(event, {
        // include: [this.countryLayer]
        include: [
          this.iotGraphicsLayer,
          this.animatedArcGraphicsLayer,
          this.arcGraphicsLayer,
          this.arcSurfaceGraphicsLayer,
          this.countryLayer
        ].filter(Boolean)
      });

      const iotGraphic = hit.results.find((result: any) => this.isIotTooltipGraphic(result.graphic))?.graphic;

      if (iotGraphic) {
        if (this.selectedIotIp) {
          this.hideTooltip();
          return;
        }
        this.clearHoverHighlight();
        this.showIotTooltip(event, iotGraphic.attributes || {});
        return;
      }

      const arcGraphic = hit.results.find((result: any) => this.isArcTooltipGraphic(result.graphic))?.graphic;

      if (arcGraphic) {
        this.clearHoverHighlight();
        this.showArcTooltip(event, arcGraphic.attributes || {});
        return;
      }

      const countryGraphic = hit.results.find((result: any) => result.graphic?.layer === this.countryLayer)?.graphic;

      if (!countryGraphic) {
        this.clearHoverHighlight();
        this.hideTooltip();
        return;
      }

      const countryName = this.extractCountryName(countryGraphic.attributes);
      const countryKey = this.toCountryKey(countryName);

      // Prevent unnecessary rerender
      if (this.hoveredCountryKey === countryKey) {
        this.moveTooltip(event);
        return;
      }

      this.hoveredCountryKey = countryKey;

      this.clearHoverHighlight();

      this.hoverHighlightHandle =
        this.countryLayerView?.highlight(countryGraphic);

      const threatCount =
    this.countryNewsCountByKey.get(countryKey) || 0;

      const breakdown = this.getSelectedCountryBreakdown(countryKey);

      this.showTooltip(event,countryName,threatCount, breakdown);
    });
  }

  private isArcTooltipGraphic(graphic: any): boolean {
    const role = graphic?.attributes?.role;

    return (
      role === 'arc' ||
      role === 'arc-surface' ||
      role === 'arc-start' ||
      role === 'arc-end' ||
      role === 'arc-traveler'
    );
  }

  private isIotTooltipGraphic(graphic: any): boolean {
    return graphic?.attributes?.role === 'iot-marker';
  }

  private getPrimaryIotIp(attributes: Record<string, unknown>): string {
    if (Array.isArray(attributes['ips'])) {
      const ip = attributes['ips'].map((value) => String(value || '').trim()).find(Boolean);
      if (ip) {
        return ip;
      }
    }

    return String(attributes['ip'] || '').trim();
  }

  closeIotIpDetail(): void {
    this.selectedIotIp = '';
  }

  private showIotTooltip(event: any, attributes: Record<string, unknown>): void {
    if (!this.hoverTooltipEl) {
      return;
    }

    this.hoveredCountryKey = '';

    const ips = Array.isArray(attributes['ips'])
      ? attributes['ips'].map((ip) => String(ip)).filter(Boolean)
      : [String(attributes['ip'] || '')].filter(Boolean);
    const count = typeof attributes['count'] === 'number' ? attributes['count'] : ips.length;
    const city = typeof attributes['city'] === 'string' ? attributes['city'] : '';
    const country = typeof attributes['country'] === 'string' ? attributes['country'] : '';
    const service = typeof attributes['service'] === 'string' ? attributes['service'] : '';
    const title = typeof attributes['title'] === 'string' ? attributes['title'] : '';

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--iot';

    const heading = document.createElement('div');
    heading.className = 'threat-lens-tooltip__arc-title';
    heading.textContent = count > 1 ? `${count} IoT results` : 'IoT result';

    tooltipContent.append(heading);

    if (ips.length) {
      tooltipContent.append(this.buildTooltipRow(count > 1 ? 'IPs' : 'IP', ips.slice(0, 8).join(', ')));
    }

    if (ips.length > 8) {
      tooltipContent.append(this.buildTooltipRow('More', `${ips.length - 8} hidden`));
    }

    if (service) {
      tooltipContent.append(this.buildTooltipRow('Service', service));
    }

    if (title) {
      tooltipContent.append(this.buildTooltipRow('Title', title));
    }

    if (city || country) {
      tooltipContent.append(this.buildTooltipRow('Location', [city, country].filter(Boolean).join(', ')));
    }

    this.hoverTooltipEl.replaceChildren(tooltipContent);
    this.hoverTooltipEl.hidden = false;

    this.moveTooltip(event);
  }

  private showArcTooltip( event: any, attributes: Record<string, unknown> ): void {

    if (!this.hoverTooltipEl) {
      return;
    }

    this.hoveredCountryKey = '';

    const startCountry =
      typeof attributes['start_country'] === 'string'
        ? attributes['start_country']
        : 'Unknown start';

    const endCountry =
      typeof attributes['end_country'] === 'string'
        ? attributes['end_country']
        : 'Unknown end';

    const category =
      typeof attributes['category_label'] === 'string'
        ? attributes['category_label']
        : 'Threat';

    const weight =
      typeof attributes['weight'] === 'number'
        ? attributes['weight']
        : Number(attributes['weight'] || 0);

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--arc';

    const title = document.createElement('div');
    title.className = 'threat-lens-tooltip__arc-title';
    title.textContent = 'Arc Route';

    tooltipContent.append(title, this.buildTooltipRow('Start', startCountry), this.buildTooltipRow('End', endCountry), this.buildTooltipRow('Category', category), this.buildTooltipRow('Records', String(weight)));

    this.hoverTooltipEl.replaceChildren(tooltipContent);
    this.hoverTooltipEl.hidden = false;

    this.moveTooltip(event);
  }

  private buildTooltipRow(label: string, value: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'threat-lens-tooltip__row';

    const labelEl = document.createElement('span');
    labelEl.className = 'threat-lens-tooltip__label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'threat-lens-tooltip__value';
    valueEl.textContent = value;

    row.append(labelEl, valueEl);

    return row;
  }

  private clearHoverHighlight(): void {
    if (this.hoverHighlightHandle) {
      this.hoverHighlightHandle.remove();
      this.hoverHighlightHandle = null;
    }

    this.hoveredCountryKey = '';
  }

  private createTooltip(): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    this.hoverTooltipEl = document.createElement('div');
    this.hoverTooltipEl.className = 'threat-lens-tooltip';
    this.hoverTooltipEl.hidden = true;

    document.body.appendChild(this.hoverTooltipEl);
  }

  private showTooltip( event: any, countryName: string, threatCount: number, breakdown: SelectedCountryCategoryCount[] ): void {

    if (!this.hoverTooltipEl) {
      return;
    }

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--country';

    const countryTitle = document.createElement('div');
    countryTitle.className = 'threat-lens-tooltip__country-title';
    countryTitle.textContent = countryName;

    const totalRow = document.createElement('div');
    totalRow.className = 'threat-lens-tooltip__total-row';

    const totalLabel = document.createElement('span');
    totalLabel.className = 'threat-lens-tooltip__total-label';
    totalLabel.textContent = 'Total Threats';

    const totalValue = document.createElement('span');
    totalValue.className = 'threat-lens-tooltip__total-value';
    totalValue.textContent = String(threatCount);

    totalRow.append(totalLabel, totalValue);
    tooltipContent.append(countryTitle, totalRow);

    for (const item of breakdown) {
      tooltipContent.append(this.buildBreakdownTooltipRow(item));
    }

    this.hoverTooltipEl.replaceChildren(tooltipContent);
    this.hoverTooltipEl.hidden = false;

    this.moveTooltip(event);
  }

  private moveTooltip(event: any): void {
    if (!this.hoverTooltipEl) {
      return;
    }

    this.hoverTooltipEl.setAttribute('style', `left:${event.x - 16}px;top:${event.y - 16}px`);
  }

  private hideTooltip(): void {
    if (this.hoverTooltipEl) {
      this.hoverTooltipEl.hidden = true;
    }
  }

  private buildBreakdownTooltipRow(item: SelectedCountryCategoryCount): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'threat-lens-tooltip__breakdown-row';

    const labelWrap = document.createElement('div');
    labelWrap.className = 'threat-lens-tooltip__breakdown-label-wrap';

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dot.setAttribute('viewBox', '0 0 12 12');
    dot.setAttribute('aria-hidden', 'true');
    dot.setAttribute('color', item.colorHex);
    dot.classList.add('threat-lens-tooltip__breakdown-dot');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '6');
    circle.setAttribute('cy', '6');
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', item.colorHex);

    dot.append(circle);

    const label = document.createElement('span');
    label.className = 'threat-lens-tooltip__breakdown-label';
    label.textContent = item.label;

    const count = document.createElement('span');
    count.className = 'threat-lens-tooltip__breakdown-count';
    count.textContent = String(item.count);

    labelWrap.append(dot, label);
    row.append(labelWrap, count);

    return row;
  }

  private async buildCountryFeatureIndex(): Promise<void> {
    if (!this.countryLayer) {
      return;
    }

    const query = this.countryLayer.createQuery();
    query.where = '1=1';
    query.returnGeometry = true;
    query.outFields = ['*'];
    query.outSpatialReference = { wkid: 4326 };

    const response = await this.countryLayer.queryFeatures(query);
    this.countryLandGeometries = (response.features || []).map((feature: any) => feature?.geometry).filter(Boolean);
    this.countryFeatureIndex = buildCountryFeatureIndex(response.features, this.countryNameFields, (value) => this.threatLensService.normalizeCountryLabel(value), (value) => this.toCountryKey(value));
  }

  private async loadThreatLensData(query: string): Promise<void> {
    const requestId = ++this.loadRequestId;
    const activeQuery = query.trim();
    this.currentQuery = activeQuery;
    this.activeArcCountryFilterKey = this.getSearchedCountryKey(activeQuery);

    this.ngZone.run(() => {
      this.setLoading(true);
      this.statusMessage = activeQuery
        ? `Searching threat lens results for "${activeQuery}"...`
        : 'Loading complete threat lens dataset...';
    });

    const loadAllPages = false;
    let statsResult: { ok: true; stats: ThreatLensMapData } | { ok: false; stats: null };
    try {
      const stats = await firstValueFrom(this.threatLensService.getThreatLensMapData(this.buildSearchPayload(activeQuery), loadAllPages),);
      statsResult = { ok: true, stats };
    }
    catch (error) {
      console.error('Failed to load threat lens data', error);
      statsResult = { ok: false, stats: null };
    }

    if (!this.isActiveRequest(requestId)) {
      return;
    }

    if (!statsResult.ok || !statsResult.stats) {
      await this.renderCountryArcs([]);
      this.arcCount = 0;

      if (!this.isActiveRequest(requestId)) {
        return;
      }

      this.ngZone.run(() => {
        this.topCountries = [];
        this.categoryLegend = [];
        this.selectedCountryBreakdown = [];
        this.feedItems = [];
        this.statusMessage = activeQuery
          ? `Failed to load threat lens data for "${activeQuery}" from /api/threat/lens.`
          : 'Failed to load threat lens data from /api/threat/lens.';
        this.setLoading(false);
      });
      return;
    }

    const stats = statsResult.stats;
    this.countryNewsCountByKey.clear();
    this.categoryCountryNewsCountByKey.clear();

    for (const item of stats.countryCounts) {
      this.countryNewsCountByKey.set(this.toCountryKey(item.country), item.count);
    }

    for (const category of stats.categoryData) {
      const countsByCountry = new Map<string, number>();
      for (const item of category.countryCounts) {
        countsByCountry.set(this.toCountryKey(item.country), item.count);
      }
      this.categoryCountryNewsCountByKey.set(category.categoryKey, countsByCountry);
    }

    await this.renderNewsIntensity(stats.countryCounts, stats.maxCount);
    const { totalArcCount, arcCountByCategory } = await this.renderCountryArcs(stats.categoryData);

    if (!this.isActiveRequest(requestId)) {
      return;
    }

    this.arcCount = totalArcCount;

    const mostActive = stats.countryCounts[0];
    const queryLabel = activeQuery ? ` for "${activeQuery}"` : '';

    this.ngZone.run(() => {
      this.feedItems = stats.feedItems;
      this.topCountries = stats.countryCounts.slice(0, 8);
      this.categoryLegend = stats.categoryData.map((category) => ({
        categoryKey: category.categoryKey,
        label: category.categoryLabel,
        colorHex: this.toHexColor(category.color),
        countryCount: category.countryCounts.length,
        arcCount: arcCountByCategory.get(category.categoryKey) || 0,
        totalResults: category.totalResults,
      }));

      if (this.selectedCountryName) {
        this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(this.toCountryKey(this.selectedCountryName));
      }

      if (this.activeArcCountryFilterKey && this.countryFeatureIndex.has(this.activeArcCountryFilterKey)) {
        const activeCountryName = this.extractCountryName(this.countryFeatureIndex.get(this.activeArcCountryFilterKey)?.attributes);
        this.selectedCountryName = activeCountryName || this.selectedCountryName;
        this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(this.activeArcCountryFilterKey);
      }

      if (!mostActive) {
        this.statusMessage = `Loaded ${stats.totalResults} records${queryLabel}, but no country metadata was found.`;
        this.setLoading(false);
        return;
      }

      this.statusMessage = totalArcCount > 0
        ? this.activeArcCountryFilterKey
          ? `Loaded ${stats.totalResults} records${queryLabel}. Showing only arc connections linked to ${this.selectedCountryName || activeQuery}, rotating in batches of up to ${this.arcBatchSize}.`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries. Showing rotating arc batches of up to ${this.arcBatchSize} at a time. Most active: ${mostActive.country} (${mostActive.count}).`
        : this.activeArcCountryFilterKey
          ? `Loaded ${stats.totalResults} records${queryLabel}, but no arc connections were found for ${this.selectedCountryName || activeQuery}.`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries, but no multi-country co-occurrence was found for arcs.`;
      this.setLoading(false);
    });

    if (this.activeArcCountryFilterKey) {
      await this.focusCountryByKey(this.activeArcCountryFilterKey);
    }

  }

  private setLoading(value: boolean): void {
    if (this.isLoading === value) {
      return;
    }

    this.isLoading = value;
    this.loadingChange.emit(value);
  }

  private async renderCountryArcs(categoryData: ThreatLensCategoryMapData[]): Promise<{
    totalArcCount: number;
    arcCountByCategory: Map<ThreatLensCategoryModelKey, number>;
  }> {
    if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer || !this.animatedArcGraphicsLayer) {
      return { totalArcCount: 0, arcCountByCategory: new Map() };
    }

    this.stopArcAnimation();
    this.arcGraphicsLayer.removeAll();
    this.arcSurfaceGraphicsLayer.removeAll();
    this.animatedArcGraphicsLayer.removeAll();
    this.animatedArcs = [];
    this.visibleBatchIndex = -1;
    this.batchAnimationStartTime = 0;

    const arcCountByCategory = new Map<ThreatLensCategoryModelKey, number>();
    let totalArcCount = 0;

    for (const category of categoryData) {
      const pairs = collectArcPairs(category.documentCountryGroups, (value) => this.toCountryKey(value), this.countryFeatureIndex, this.maxArcCount, this.minArcWeight);
      const visiblePairs = this.activeArcCountryFilterKey
        ? pairs.filter((pair) => pair.countryAKey === this.activeArcCountryFilterKey || pair.countryBKey === this.activeArcCountryFilterKey)
        : pairs;

      let renderedArcCount = 0;

      for (const pair of visiblePairs) {
        const featureA = this.countryFeatureIndex.get(pair.countryAKey);
        const featureB = this.countryFeatureIndex.get(pair.countryBKey);
        const start = getFeatureAnchor(featureA, this.geometryEngine, this.webMercatorUtils);
        const end = getFeatureAnchor(featureB, this.geometryEngine, this.webMercatorUtils);

        if (!start || !end) {
          continue;
        }

        const arcPoints = buildArcPathPoints(start, end, pair.weight);
        const arcPaths = buildArcPath(start, end, pair.weight);
        const surfacePaths = buildSurfacePath(start, end);
        if (!arcPaths.length || !surfacePaths.length || arcPoints.length < 2) {
          continue;
        }

        this.animatedArcs.push({
          categoryKey: category.categoryKey,
          categoryLabel: category.categoryLabel,
          color: category.color,
          weight: pair.weight,
          arcPoints,
          arcPaths,
          surfacePaths,
          countryAKey: pair.countryAKey,
          countryBKey: pair.countryBKey,
          countryAName: this.extractCountryName(featureA.attributes),
          countryBName: this.extractCountryName(featureB.attributes),
          animationOffset: renderedArcCount * 0.11,
          animationDuration: Math.max(1800, 3300 - Math.min(1200, pair.weight * 110)),
        });

        renderedArcCount += 1;
      }

      arcCountByCategory.set(category.categoryKey, renderedArcCount);
      totalArcCount += renderedArcCount;
    }

    this.renderArcBatch(0);
    this.startArcAnimation();
    return {
      totalArcCount: Math.min(totalArcCount, this.arcBatchSize),
      arcCountByCategory,
    };
  }

  private async renderNewsIntensity(_countryCounts: ThreatCountryCount[], _maxCount: number): Promise<void> {
    if (!this.newsGraphicsLayer) {
      return;
    }

    this.newsGraphicsLayer.removeAll();
  }

  private buildIotResponseMarkers(response: GeoCameraResponse['result'] | GeoCameraResponse, visibleArea: ThreatLensVisibleArea): CameraInfo[] {
    const cameras = Array.isArray(response?.cameras) ? response.cameras : [];
    if (cameras.length) {
      return cameras
        .map((camera, index) => this.normalizeIotCamera(camera, visibleArea, index, cameras.length))
        .filter((camera): camera is CameraInfo => Boolean(camera));
    }

    const ips = Array.isArray(response?.ips) ? response.ips : [];
    return this.buildIpListMarkers(ips, visibleArea);
  }

  private normalizeIotCamera(camera: any, visibleArea: ThreatLensVisibleArea, index: number, total: number): CameraInfo | null {
    const ip = String(camera?.ip || '').trim();
    const latitude = this.getOptionalNumericValue(camera?.latitude, camera?.lat);
    const longitude = this.getOptionalNumericValue(camera?.longitude, camera?.lng, camera?.lon);
    const hasCoordinate = latitude !== null && longitude !== null && Math.abs(latitude) <= 90;
    const fallbackCoordinate = hasCoordinate ? null : this.getIotLandMarkerCoordinates(visibleArea, index, total);

    if (!hasCoordinate && !fallbackCoordinate) {
      return null;
    }

    return {
      ...camera,
      ip,
      latitude: hasCoordinate ? this.roundCoordinate(Math.max(-90, Math.min(90, latitude as number))) : fallbackCoordinate?.lat,
      longitude: hasCoordinate ? this.roundCoordinate(this.normalizeLongitude(longitude as number)) : fallbackCoordinate?.lng,
      service: camera?.service || 'iot',
    };
  }

  private buildIpListMarkers(ips: string[], visibleArea: ThreatLensVisibleArea): CameraInfo[] {
    const uniqueIps = Array.from(new Set(ips.map((ip) => String(ip || '').trim()).filter(Boolean)));

    return uniqueIps.flatMap((ip, index) => {
      const coordinate = this.getIotLandMarkerCoordinates(visibleArea, index, uniqueIps.length);
      if (!coordinate) {
        return [];
      }

      return {
        ip,
        latitude: coordinate.lat,
        longitude: coordinate.lng,
        service: 'iot',
      };
    });
  }

  private getIotLandMarkerCoordinates(visibleArea: ThreatLensVisibleArea, index: number, total: number): ThreatLensCoordinate | null {
    const attemptCount = Math.max(72, total * 4);
    const candidateIndexes = [index, ...Array.from({ length: attemptCount }, (_, attempt) => index + ((attempt + 1) * Math.max(1, total)))];

    for (const candidateIndex of candidateIndexes) {
      const [latitude, longitude] = this.getIotIpMarkerCoordinates(visibleArea.center, candidateIndex, total + attemptCount, visibleArea.radiusKm);
      const coordinate = { lat: latitude, lng: longitude };
      if (this.isCoordinateOnLand(coordinate)) {
        return coordinate;
      }
    }

    const landSample = visibleArea.sampledPoints.find((point) => this.isCoordinateOnLand(point));
    return landSample || null;
  }

  private getIotIpMarkerCoordinates(center: { lat: number; lng: number }, index: number, total: number, radiusKm: number): [number, number] {
    if (total <= 1) {
      return [center.lat, center.lng];
    }

    const angle = index * 2.399963229728653;
    const radius = Math.sqrt((index + 0.5) / total) * (radiusKm * 0.92);
    const latitudeDelta = (Math.sin(angle) * radius) / 111.32;
    const longitudeDelta = (Math.cos(angle) * radius) / (111.32 * Math.max(0.2, Math.cos(center.lat * Math.PI / 180)));
    const latitude = Math.max(-90, Math.min(90, center.lat + latitudeDelta));
    const longitude = this.normalizeLongitude(center.lng + longitudeDelta);
    return [Number(latitude.toFixed(6)), Number(longitude.toFixed(6))];
  }

  private clusterIotCameras(cameras: CameraInfo[]): ThreatLensIotMarkerCluster[] {
    return cameras.map((camera, index) => ({
      id: `${camera.ip || 'iot'}:${camera.port || ''}:${index}`,
      latitude: this.getNumericValue(camera.latitude),
      longitude: this.getNumericValue(camera.longitude),
      count: 1,
      ips: camera.ip ? [camera.ip] : [],
      cameras: [camera],
    }));
  }

  private filterIotMarkersOnLand(cameras: CameraInfo[]): CameraInfo[] {
    return cameras.filter((camera) => this.isCoordinateOnLand({
      lat: this.getNumericValue(camera.latitude),
      lng: this.getNumericValue(camera.longitude),
    }));
  }

  private isCoordinateOnLand(coordinate: ThreatLensCoordinate): boolean {
    if (!this.countryLandGeometries.length) {
      return true;
    }

    const point = {
      type: 'point',
      longitude: coordinate.lng,
      latitude: coordinate.lat,
      x: coordinate.lng,
      y: coordinate.lat,
      spatialReference: { wkid: 4326 },
    };

    return this.countryLandGeometries.some((geometry) => {
      try {
        const extent = geometry?.extent;
        if (extent && !this.isPointInsideExtent(coordinate, extent)) {
          return false;
        }

        const engineContainsPoint = this.geometryEngine && (this.geometryEngine.contains(geometry, point) || this.geometryEngine.intersects(geometry, point));
        return Boolean(engineContainsPoint || this.isPointInPolygonGeometry(coordinate, geometry));
      }
      catch {
        return this.isPointInPolygonGeometry(coordinate, geometry);
      }
    });
  }

  private isPointInPolygonGeometry(coordinate: ThreatLensCoordinate, geometry: any): boolean {
    const rings = Array.isArray(geometry?.rings) ? geometry.rings : [];
    let isInside = false;

    for (const ring of rings) {
      if (this.isPointInRing(coordinate, ring)) {
        isInside = !isInside;
      }
    }

    return isInside;
  }

  private isPointInRing(coordinate: ThreatLensCoordinate, ring: unknown): boolean {
    if (!Array.isArray(ring) || ring.length < 3) {
      return false;
    }

    let isInside = false;
    const x = coordinate.lng;
    const y = coordinate.lat;

    for (let currentIndex = 0, previousIndex = ring.length - 1; currentIndex < ring.length; previousIndex = currentIndex, currentIndex += 1) {
      const current = ring[currentIndex];
      const previous = ring[previousIndex];
      if (!Array.isArray(current) || !Array.isArray(previous)) {
        continue;
      }

      const currentX = Number(current[0]);
      const currentY = Number(current[1]);
      const previousX = Number(previous[0]);
      const previousY = Number(previous[1]);
      if (![currentX, currentY, previousX, previousY].every(Number.isFinite)) {
        continue;
      }

      const intersects = (currentY > y) !== (previousY > y)
        && x < ((previousX - currentX) * (y - currentY) / (previousY - currentY)) + currentX;
      if (intersects) {
        isInside = !isInside;
      }
    }

    return isInside;
  }

  private isPointInsideExtent(coordinate: ThreatLensCoordinate, extent: any): boolean {
    const xmin = this.getOptionalNumericValue(extent.xmin);
    const xmax = this.getOptionalNumericValue(extent.xmax);
    const ymin = this.getOptionalNumericValue(extent.ymin);
    const ymax = this.getOptionalNumericValue(extent.ymax);

    if (xmin === null || xmax === null || ymin === null || ymax === null) {
      return true;
    }

    const latitude = coordinate.lat;
    if (latitude < ymin || latitude > ymax) {
      return false;
    }

    const longitude = coordinate.lng;
    if (xmin <= xmax) {
      return longitude >= xmin && longitude <= xmax;
    }

    return longitude >= xmin || longitude <= xmax;
  }

  private getNumericValue(...values: unknown[]): number {
    for (const value of values) {
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }

    return 0;
  }

  private getOptionalNumericValue(...values: unknown[]): number | null {
    for (const value of values) {
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(numberValue)) {
        return numberValue;
      }
    }

    return null;
  }

  private renderIotMarkers(clusters: ThreatLensIotMarkerCluster[]): void {
    if (!this.iotGraphicsLayer) {
      return;
    }

    const previousGraphics = [...this.iotMarkerGraphics];
    const nextGraphics = clusters.map((cluster) => this.buildIotMarkerGraphic(cluster));
    this.iotMarkerGraphics = nextGraphics;

    if (nextGraphics.length) {
      this.iotGraphicsLayer.addMany(nextGraphics);
      this.startIotPulseAnimation();
    }

    window.setTimeout(() => {
      if (!this.iotGraphicsLayer) {
        return;
      }

      if (previousGraphics.length) {
        this.iotGraphicsLayer.removeMany(previousGraphics);
      }

      if (!nextGraphics.length) {
        this.iotGraphicsLayer.removeAll();
        this.stopIotPulseAnimation();
      }
    }, 450);
  }

  private buildIotMarkerGraphic(cluster: ThreatLensIotMarkerCluster): any {
    const primaryCamera = (cluster.cameras[0] || {}) as CameraInfo & Record<string, any>;

    return {
      geometry: {
        type: 'point',
        longitude: cluster.longitude,
        latitude: cluster.latitude,
        z: 35000,
        spatialReference: { wkid: 4326 },
      },
      attributes: {
        role: 'iot-marker',
        cluster_id: cluster.id,
        count: cluster.count,
        ip: cluster.ips[0] || '',
        ips: cluster.ips,
        port: primaryCamera.port || '',
        service: primaryCamera.service || '',
        title: primaryCamera['title'] || primaryCamera.brand || primaryCamera.model || '',
        city: primaryCamera.city || '',
        country: primaryCamera.country || '',
      },
      symbol: this.buildIotMarkerSymbol(cluster.count, 0),
    };
  }

  private buildIotMarkerSymbol(count: number, pulse: number): any {
    const size = Math.min(11, 5.5 + (Math.max(1, count) * 0.25)) + (pulse * 1.4);

    return {
      type: 'point-3d',
      symbolLayers: [
        {
          type: 'icon',
          resource: { primitive: 'circle' },
          size,
          material: { color: [34, 211, 238, 0.82] },
          outline: {
            color: [236, 254, 255, 0.84],
            size: 0.7,
          },
        },
      ],
      verticalOffset: {
        screenLength: 8,
        maxWorldLength: 45000,
        minWorldLength: 0,
      },
    };
  }

  private refreshIotMarkerSymbols(pulse = 0): void {
    for (const graphic of this.iotMarkerGraphics) {
      const count = Number(graphic.attributes?.count || 1);
      graphic.symbol = this.buildIotMarkerSymbol(count, pulse);
    }
  }

  private startIotPulseAnimation(): void {
    this.ngZone.runOutsideAngular(() => {
      const animate = (timestamp: number) => {
        if (!this.iotMarkerGraphics.length) {
          this.iotPulseAnimationFrame = null;
          return;
        }

        if (this.iotPulseTick && (timestamp - this.iotPulseTick) < 80) {
          this.iotPulseAnimationFrame = requestAnimationFrame(animate);
          return;
        }

        this.iotPulseTick = timestamp;
        const pulse = (Math.sin(timestamp / 620) + 1) / 2;

        this.refreshIotMarkerSymbols(pulse);

        this.iotPulseAnimationFrame = requestAnimationFrame(animate);
      };

      this.iotPulseAnimationFrame = requestAnimationFrame(animate);
    });
  }

  private stopIotPulseAnimation(): void {
    if (this.iotPulseAnimationFrame !== null) {
      cancelAnimationFrame(this.iotPulseAnimationFrame);
      this.iotPulseAnimationFrame = null;
    }

    this.iotPulseTick = 0;
  }

  setIotScanningEnabled(enabled: boolean): void {
    if (this.iotScanningEnabled === enabled) {
      return;
    }

    this.iotScanningEnabled = enabled;
    this.cancelPendingIotScan();

    if (!enabled) {
      this.iotScanRequestId += 1;
      this.currentIotScanKey = '';
      this.clearIotMarkers();
      this.iotIsScanning = false;
      this.iotResultCount = 0;
      this.iotStatusMessage = 'IP scanning is off.';
      this.cdr.detectChanges();
      return;
    }

    this.currentIotScanKey = '';
    this.hasUserMovedMap = true;
    this.iotStatusMessage = 'Scanning visible area shortly...';
    this.cdr.detectChanges();
    this.scheduleIotScanForCurrentView();
  }

  private clearIotMarkers(): void {
    this.iotMarkerGraphics = [];
    this.iotGraphicsLayer?.removeAll();
    this.stopIotPulseAnimation();
  }

  private toCountryKey(value: string): string {
    const normalized = this.threatLensService.normalizeCountryLabel(value);
    return this.threatLensService.toCountryKey(normalized);
  }

  private getSelectedCountryBreakdown(countryKey: string): SelectedCountryCategoryCount[] {
    return this.categoryLegend
      .map((category) => ({
        label: category.label,
        colorHex: category.colorHex,
        count: this.categoryCountryNewsCountByKey.get(category.categoryKey)?.get(countryKey) || 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  private toHexColor(color: [number, number, number]): string {
    return `#${color.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }

  togglePanel(panel: 'search' | 'threat'): void {
    if (panel === 'search') {
      this.isSearchPanelCollapsed = !this.isSearchPanelCollapsed;
      return;
    }

    this.isThreatPanelCollapsed = !this.isThreatPanelCollapsed;
  }

  private buildSearchPayload(query: string): Partial<ThreatLensRequestPayload> {
    const payload: Partial<ThreatLensRequestPayload> = { q: query };
    if (!query) {
      return payload;
    }

    const normalizedCountry = this.threatLensService.normalizeCountryLabel(query);
    const countryKey = this.toCountryKey(normalizedCountry);
    if (countryKey && this.countryFeatureIndex.has(countryKey)) {
      payload.q = '';
      payload.entity_filter = { m_country: [normalizedCountry] };
      payload.must = true;
      payload.fullsearch = false;
    }

    return payload;
  }

  private getSearchedCountryKey(query: string): string {
    if (!query) {
      return '';
    }

    const normalizedCountry = this.threatLensService.normalizeCountryLabel(query);
    const countryKey = this.toCountryKey(normalizedCountry);
    return countryKey && this.countryFeatureIndex.has(countryKey) ? countryKey : '';
  }

  private async focusCountryByKey(countryKey: string): Promise<void> {
    if (!this.view || !countryKey) {
      return;
    }

    const graphic = this.countryFeatureIndex.get(countryKey);
    if (!graphic) {
      return;
    }

    this.applyHighlight(graphic);
    const geometryToFocus = graphic.geometry?.extent ?? graphic.geometry;
    const countryName = this.extractCountryName(graphic.attributes);

    this.ngZone.run(() => {
      this.selectedCountryName = countryName;
      this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(countryKey);
      this.cdr.detectChanges();
    });

    if (geometryToFocus) {
      await this.view.goTo(geometryToFocus, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
    }


  }

  private applyHighlight(graphic: any): void {
    if (!this.countryLayerView) {
      return;
    }

    this.clearHighlight();
    this.highlightHandle = this.countryLayerView.highlight(graphic);
  }

  private clearHighlight(): void {
    if (this.highlightHandle) {
      this.highlightHandle.remove();
      this.highlightHandle = null;
    }
  }

  private extractCountryName(attributes: Record<string, unknown> | undefined): string {
    if (!attributes) {
      return '';
    }

    for (const fieldName of this.countryNameFields) {
      const value = attributes[fieldName];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return '';
  }

  private startArcAnimation(): void {
    if (!this.animatedArcGraphicsLayer || !this.animatedArcs.length) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const animate = (timestamp: number) => {
        if (!this.animatedArcGraphicsLayer) {
          this.arcAnimationFrame = null;
          return;
        }

        if (!this.batchAnimationStartTime) {
          this.batchAnimationStartTime = timestamp;
        }

        if (this.lastAnimationTick && (timestamp - this.lastAnimationTick) < 40) {
          this.arcAnimationFrame = requestAnimationFrame(animate);
          return;
        }

        this.lastAnimationTick = timestamp;

        const batch = this.getCurrentArcBatch(timestamp);

        if (batch.index !== this.visibleBatchIndex) {
          this.renderArcBatch(batch.index, batch.items);
        }

        let index = 0;

        for (const arc of batch.items) {
          const progress = ((timestamp + (arc.animationOffset * arc.animationDuration)) % arc.animationDuration) / arc.animationDuration;

          const point = getArcPointAtProgress(arc.arcPoints, progress);

          const graphic = this.movingDotGraphics[index];

          if (point && graphic) {
            const [lon, lat, z] = point;

            graphic.geometry = {
              type: 'point',
              longitude: lon,
              latitude: lat,
              z: z,
              spatialReference: { wkid: 4326 }
            };
          }

          index++;
        }

        this.arcAnimationFrame = requestAnimationFrame(animate);
      };

      this.arcAnimationFrame = requestAnimationFrame(animate);
    });
  }

  private stopArcAnimation(): void {
    if (this.arcAnimationFrame !== null) {
      cancelAnimationFrame(this.arcAnimationFrame);
      this.arcAnimationFrame = null;
    }

    this.animatedArcGraphicsLayer?.removeAll();
    this.lastAnimationTick = 0;
    this.batchAnimationStartTime = 0;
    this.visibleBatchIndex = -1;
  }

  private getCurrentArcBatch(timestamp: number): { index: number; items: AnimatedArcDescriptor[] } {
    if (!this.animatedArcs.length) {
      return { index: -1, items: [] };
    }

    const totalBatches = Math.max(1, Math.ceil(this.animatedArcs.length / this.arcBatchSize));
    const elapsed = Math.max(0, timestamp - this.batchAnimationStartTime);
    const index = Math.floor(elapsed / this.arcBatchDuration) % totalBatches;
    const start = index * this.arcBatchSize;
    return {
      index,
      items: this.animatedArcs.slice(start, start + this.arcBatchSize),
    };
  }

  private renderArcBatch(index: number, batchItems?: AnimatedArcDescriptor[]): void {
    if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer) {
      return;
    }
    this.startMarkerGraphics = [];
    this.endMarkerGraphics = [];
    const items = batchItems ?? (index >= 0 ? this.animatedArcs.slice(index * this.arcBatchSize, (index + 1) * this.arcBatchSize) : []);
    this.visibleBatchIndex = index;
    this.arcGraphicsLayer.removeAll();
    this.arcSurfaceGraphicsLayer.removeAll();

    if (!items.length) {
      this.ngZone.run(() => {
        this.arcCount = 0;
      });
      return;
    }

    this.arcGraphicsLayer.addMany(items.map((arc) => ({
      geometry: {
        type: 'polyline',
        hasZ: true,
        paths: arc.arcPaths,
        spatialReference: { wkid: 4326 },
      },
      attributes: {
        role: 'arc',

        category: arc.categoryKey,
        category_label: arc.categoryLabel,

        country_a: arc.countryAKey,
        country_b: arc.countryBKey,

        start_country: arc.countryAName,
        end_country: arc.countryBName,

        weight: arc.weight,
      },
      symbol: {
        type: 'line-3d',
        symbolLayers: [
          {
            type: 'path',
            profile: 'quad',
            width: Math.min(20, 12 + (arc.weight * 0.8)),
            cap: 'round',
            material: { color: [...arc.color, 0.18] },
            anchor: 'center',
          },
          {
            type: 'path',
            profile: 'quad',
            width: Math.min(11, 5 + (arc.weight * 0.48)),
            cap: 'round',
            material: { color: [...arc.color, 0.64] },
            anchor: 'center',
          },
        ],
      },
    })));

    this.arcSurfaceGraphicsLayer.addMany(items.map((arc) => ({
      geometry: {
        type: 'polyline',
        paths: arc.surfacePaths,
        spatialReference: { wkid: 4326 },
      },
      attributes: {
        role: 'arc-surface',

        category: arc.categoryKey,
        category_label: arc.categoryLabel,

        country_a: arc.countryAKey,
        country_b: arc.countryBKey,

        start_country: arc.countryAName,
        end_country: arc.countryBName,

        weight: arc.weight,
      },
      symbol: {
        type: 'simple-line',
        color: [...arc.color, 0.92],
        width: Math.min(3.8, 1.8 + (arc.weight * 0.24)),
      },
    })));

    this.ngZone.run(() => {
      this.arcCount = items.length;
    });
    this.movingDotGraphics = [];

    for (const arc of items) {
      const movingDotSize = Math.min(120000, this.movingDotBaseSize + (arc.weight * 2200));
      const startPoint = arc.arcPoints[0];
      const endPoint = arc.arcPoints[arc.arcPoints.length - 1];
      this.startMarkerGraphics.push({
        geometry: {
          type: 'point',
          longitude: startPoint[0],
          latitude: startPoint[1],
          z: startPoint[2],
          spatialReference: { wkid: 4326 }
        },

        attributes: {
          role: 'arc-start',

          start_country: arc.countryAName,
          end_country: arc.countryBName,

          category_label: arc.categoryLabel,
          weight: arc.weight,
        },

        symbol: {
          type: 'point-3d',

          symbolLayers: [
            {
              type: 'object',

              resource: {
                primitive: 'sphere'
              },

              width: 90000,
              height: 90000,
              depth: 90000,

              material: {
                color: [...arc.color, 1]
              }
            }
          ]
        }
      });
      this.endMarkerGraphics.push({
        geometry: {
          type: 'point',
          longitude: endPoint[0],
          latitude: endPoint[1],
          z: endPoint[2],
          spatialReference: { wkid: 4326 }
        },

        attributes: {
          role: 'arc-end',

          start_country: arc.countryAName,
          end_country: arc.countryBName,

          category_label: arc.categoryLabel,
          weight: arc.weight,
        },

        symbol: {
          type: 'point-3d',

          symbolLayers: [
            {
              type: 'object',

              resource: {
                primitive: 'sphere'
              },

              width: 120000,
              height: 120000,
              depth: 120000,

              material: {
                color: [...arc.color, 0.85]
              }
            }
          ]
        }
      });
      const graphic = {
        geometry: null,
        symbol: {
          type: 'point-3d',
          symbolLayers: [
            {
              type: 'object',
              resource: { primitive: 'sphere' },
              width: movingDotSize,
              height: movingDotSize,
              depth: movingDotSize,
              material: { color: [...arc.color, 1] },
            }
          ]
        }
      };

      this.movingDotGraphics.push(graphic);
    }

    this.animatedArcGraphicsLayer.removeAll();
    // this.animatedArcGraphicsLayer.addMany(this.movingDotGraphics);
    this.animatedArcGraphicsLayer.addMany([
      ...this.startMarkerGraphics,
      ...this.endMarkerGraphics,
      ...this.movingDotGraphics,
    ]);

  }

  private isActiveRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.loadRequestId;
  }

  private isActiveIotRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.iotScanRequestId;
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined';
  }
}
