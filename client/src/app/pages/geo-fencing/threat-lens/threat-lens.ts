import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { loadModules, setDefaultOptions } from 'esri-loader';
import { buildArcPath, buildArcPathPoints, buildCountryFeatureIndex, buildSurfacePath, collectArcPairs, getFeatureAnchor, getArcPointAtProgress } from './threat-lens-map.utils';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { parseCoordinates } from '../../../shared/utils/geo-coordinates.utils';
import { FilterModel } from '../../../shared/model/filter/filter.model';
import { FiltersComponent } from "../../../shared/partials/filters/filters.component";
import { threat_lens_filters } from '../../../shared/constants/filters';
import { GeoCameraResponse } from '../../../shared/model/network-intel/network-intel-api.models';
import { AnimatedArcDescriptor, SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensFeedItem, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, } from '../models/geo-fencing.models';
import { ThreatLensService } from './threat.lens.service';
import { ThreatLensFeedPanelComponent } from './threat-lens-feed-panel/threat-lens-feed-panel';
import { GeocodeModalComponent } from '../../../shared/partials/geocode-modal/geocode-modal.component';
import { GeoFencingGeocodeService } from '../shared/geo-fencing-geocode.service';
import { NetworkIntelScanService } from '../../../shared/services/network-intel/network-intel-scan.service';
import { IpDetailPopupComponent } from './ip-detail-popup/ip-detail-popup.component';

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltersComponent, ThreatLensFeedPanelComponent, GeocodeModalComponent, IpDetailPopupComponent],
  templateUrl: './threat-lens.html',
})
export class ThreatLensComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewNode?: ElementRef<HTMLDivElement>;
  private view: any | null = null;
  private countryLayer: any | null = null;
  private newsGraphicsLayer: any | null = null;
  private arcGraphicsLayer: any | null = null;
  private arcSurfaceGraphicsLayer: any | null = null;
  private animatedArcGraphicsLayer: any | null = null;
  private ipScanGraphicsLayer: any | null = null;
  private countryLayerView: any | null = null;
  private highlightHandle: { remove: () => void } | null = null;
  private mapClickHandle: { remove: () => void } | null = null;
  private viewScaleWatchHandle: { remove: () => void } | null = null;
  private countryFeatureIndex = new Map<string, any>();
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
  private ipScanMarkerGraphics: any[] = [];
  private ipScanSub?: Subscription;
  private ipScanWatchInterval: ReturnType<typeof setInterval> | null = null;
  private ipScanResultKey = '';

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
  showIpScanLocationModal = false;
  ipScanCoordinates = '';
  ipScanRadiusKm = 100;
  ipScanMaxIps = 200;
  ipScanStatusMessage = 'Select a location to scan for exposed IPs.';
  ipScanErrorMessage: string | null = null;
  ipScanResultCount = 0;
  selectedIp = '';
  fetchGeocodeResults = (query: string) => this.geocodeService.fetchGeocodeResults(query);

  @Input() showFilterButton = true;

  @Output() loadingChange = new EventEmitter<boolean>();

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef, private threatLensService: ThreatLensService, private networkIntelService: NetworkIntelScanService, private geocodeService: GeoFencingGeocodeService, protected sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadRequestId += 1;
    this.mapClickHandle?.remove();
    this.mapClickHandle = null;
    this.viewScaleWatchHandle?.remove();
    this.viewScaleWatchHandle = null;
    this.ipScanSub?.unsubscribe();
    this.ipScanSub = undefined;
    this.stopIpScanWatcher();
    this.clearHighlight();
    this.stopArcAnimation();
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
      this.arcGraphicsLayer = new GraphicsLayer({
        title: 'Threat Lens Country Arcs',
        elevationInfo: { mode: 'absolute-height' },
      });
      this.animatedArcGraphicsLayer = new GraphicsLayer({
        title: 'Threat Lens Animated Arcs',
        elevationInfo: { mode: 'absolute-height' },
      });
      this.arcSurfaceGraphicsLayer = new GraphicsLayer({ title: 'Threat Lens Country Arc Connectors' });
      this.ipScanGraphicsLayer = new GraphicsLayer({ title: 'Threat Lens IP Scan Markers' });

      const map = new EsriMap({
        basemap: 'streets-vector',
        ground: 'world-elevation',
        layers: [this.countryLayer, this.newsGraphicsLayer, this.arcSurfaceGraphicsLayer, this.arcGraphicsLayer, this.animatedArcGraphicsLayer, this.ipScanGraphicsLayer],
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
      this.registerViewScaleWatcher();
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

  get isIpScanRunning(): boolean {
    return this.networkIntelService.isRunning() && !this.networkIntelService.onError();
  }

  openIpScanLocation(): void {
    if (this.isIpScanRunning) {
      return;
    }
    this.ipScanErrorMessage = null;
    this.showIpScanLocationModal = true;
  }

  onIpScanCoordinatesChange(value: string): void {
    this.ipScanCoordinates = value;
    this.ipScanErrorMessage = null;
  }

  onIpScanRadiusKmChange(value: number): void {
    const radius = Number(value);
    if (Number.isFinite(radius)) {
      this.ipScanRadiusKm = Math.min(1000, Math.max(1, radius));
    }
  }

  onIpScanMaxIpsChange(value: number): void {
    const maxIps = Math.round(Number(value));
    if (Number.isFinite(maxIps)) {
      this.ipScanMaxIps = Math.min(500, Math.max(1, maxIps));
    }
  }

  onIpScanLocationApply(): void {
    const coordinates = this.ipScanCoordinates.trim();
    const center = parseCoordinates(coordinates);
    if (!center) {
      this.ipScanErrorMessage = 'Enter coordinates as latitude, longitude before applying the location.';
      return;
    }

    const radiusKm = Math.min(1000,Math.max(1, Math.round(this.ipScanRadiusKm)));
    this.showIpScanLocationModal = false;
    this.runIpScan(coordinates, center, radiusKm);
  }

  private runIpScan(coordinates: string, center: { lat: number; lon: number }, radiusKm: number): void {
    this.ipScanSub?.unsubscribe();
    this.stopIpScanWatcher();
    this.networkIntelService.resetState();
    this.clearIpScanGraphics();
    this.ipScanResultKey = '__pending__';

    this.ngZone.run(() => {
      this.ipScanErrorMessage = null;
      this.ipScanResultCount = 0;
      this.ipScanStatusMessage = `Scanning ${radiusKm} km around ${coordinates} for IP exposure...`;
      this.cdr.detectChanges();
    });

    this.ipScanSub = this.networkIntelService.scanGeoCamera(coordinates, radiusKm, this.ipScanMaxIps);
    this.watchIpScanResult(center, radiusKm);
  }

  onIpDetailPopupClose(): void {
    this.selectedIp = '';
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

  private registerViewScaleWatcher(): void {
    if (!this.view?.watch) {
      return;
    }

    this.viewScaleWatchHandle?.remove();
    this.viewScaleWatchHandle = this.view.watch('scale', () => this.updateIpMarkerSymbols());
  }

  private registerClickHandler(): void {
    if (!this.view || !this.countryLayer) {
      return;
    }

    this.mapClickHandle = this.view.on('click', async (event: any) => {
      if (!this.view || !this.countryLayer) {
        return;
      }

      const hit = await this.view.hitTest(event, { include: [this.ipScanGraphicsLayer, this.countryLayer].filter(Boolean) });
      const ipGraphic = hit.results.find((result: any) => this.isIpScanMarkerGraphic(result.graphic))?.graphic;

      if (ipGraphic) {
        const ip = typeof ipGraphic.attributes?.ip === 'string' ? ipGraphic.attributes.ip : '';
        if (ip) {
          this.hideTooltip();
          this.clearHoverHighlight();
          this.ngZone.run(() => {
            this.selectedIp = ip;
            this.cdr.detectChanges();
          });
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
    this.view.on('pointer-move', async (event: any) => {
      if (!this.view || !this.countryLayer) {
        return;
      }

      const hit = await this.view.hitTest(event, {
        include: [
          this.ipScanGraphicsLayer,
          this.animatedArcGraphicsLayer,
          this.arcGraphicsLayer,
          this.arcSurfaceGraphicsLayer,
          this.countryLayer
        ].filter(Boolean)
      });

      const ipGraphic = hit.results.find((result: any) => this.isIpScanMarkerGraphic(result.graphic))?.graphic;

      if (ipGraphic) {
        this.clearHoverHighlight();
        this.showIpScanTooltip(event, ipGraphic.attributes || {});
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

  private isIpScanMarkerGraphic(graphic: any): boolean {
    return graphic?.attributes?.role === 'ip-scan-marker';
  }

  private showIpScanTooltip(event: any, attributes: Record<string, unknown>): void {
    if (!this.hoverTooltipEl) {
      return;
    }

    this.hoveredCountryKey = '';

    const ip = typeof attributes['ip'] === 'string' ? attributes['ip'] : 'Unknown IP';
    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--ip';

    const title = document.createElement('div');
    title.className = 'threat-lens-tooltip__arc-title';
    title.textContent = 'IP Scan';

    tooltipContent.append(title, this.buildTooltipRow('IP address', ip));
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

    const response = await this.countryLayer.queryFeatures(query);
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

  private watchIpScanResult(center: { lat: number; lon: number }, radiusKm: number): void {
    const parse = () => {
      const finished = this.parseIpScanResult(center, radiusKm);
      if (finished) {
        this.stopIpScanWatcher();
      }
    };

    if (this.parseIpScanResult(center, radiusKm)) {
      return;
    }
    this.ipScanWatchInterval = setInterval(parse, 250);
  }

  private stopIpScanWatcher(): void {
    if (this.ipScanWatchInterval) {
      clearInterval(this.ipScanWatchInterval);
      this.ipScanWatchInterval = null;
    }
  }

  private parseIpScanResult(center: { lat: number; lon: number }, radiusKm: number): boolean {
    const error = this.networkIntelService.onError();
    if (error) {
      this.ngZone.run(() => {
        this.ipScanErrorMessage = error?.message || 'IP scan failed.';
        this.ipScanStatusMessage = 'IP scan failed.';
        this.cdr.detectChanges();
      });
      return true;
    }

    const done = this.networkIntelService.onDone();
    if (!done) {
      return false;
    }

    const payload = (done.result ?? done) as GeoCameraResponse & Record<string, any>;
    const status = String(payload?.status || done?.status || '').toLowerCase();
    const progress = Number(done?.result?.progress ?? done?.progress ?? this.networkIntelService.progress());

    if (status === 'pending' || status === 'busy') {
      this.ngZone.run(() => {
        this.ipScanStatusMessage = Number.isFinite(progress)
          ? `Scanning selected area... ${Math.round(progress)}%`
          : 'Scanning selected area...';
        this.cdr.detectChanges();
      });
      return false;
    }

    const records = this.extractIpScanRecords(payload);
    const resultKey = records.map((record) => record.ip).join('|');

    if (resultKey !== this.ipScanResultKey) {
      this.ipScanResultKey = resultKey;
      this.renderIpScanMarkers(records, center, radiusKm);
    }

    this.ngZone.run(() => {
      this.ipScanResultCount = records.length;
      this.ipScanStatusMessage = records.length
        ? `Rendered ${records.length} IP marker(s) inside the selected ${radiusKm} km radius.`
        : `IP scan completed for the selected ${radiusKm} km radius. No IPs returned.`;
      this.cdr.detectChanges();
    });

    return !this.networkIntelService.isRunning();
  }

  private extractIpScanRecords(payload: any): { ip: string; lat?: number; lon?: number }[] {
    const records = new Map<string, { ip: string; lat?: number; lon?: number }>();
    const addRecord = (value: any) => {
      if (typeof value === 'string') {
        const ip = value.trim();
        if (ip && !records.has(ip)) {
          records.set(ip, { ip });
        }
        return;
      }

      if (!value || typeof value !== 'object') {
        return;
      }

      const ip = String(value.ip || value.ip_address || value.host || '').trim();
      if (!ip || records.has(ip)) {
        return;
      }

      const lat = Number(value.latitude ?? value.lat);
      const lon = Number(value.longitude ?? value.lon ?? value.lng);
      records.set(ip, {
        ip,
        lat: Number.isFinite(lat) ? lat : undefined,
        lon: Number.isFinite(lon) ? lon : undefined,
      });
    };

    [
      payload?.ips,
      payload?.ip_addresses,
      payload?.data?.ips,
      payload?.result?.ips,
      payload?.cameras,
      payload?.result?.cameras,
      payload?.data?.cameras,
    ].forEach((candidate) => {
      if (Array.isArray(candidate)) {
        candidate.forEach(addRecord);
      }
    });

    return Array.from(records.values()).slice(0, 500);
  }

  private renderIpScanMarkers(records: { ip: string; lat?: number; lon?: number }[], center: { lat: number; lon: number }, radiusKm: number): void {
    if (!this.ipScanGraphicsLayer) {
      return;
    }

    this.clearIpScanGraphics();
    const markerGraphics = records.map((record, index) => {
      const point = this.resolveIpMarkerPoint(record, index, records.length, center, radiusKm);
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
        symbol: this.buildIpMarkerSymbol(this.getIpMarkerSizeForView()),
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

    this.ipScanMarkerGraphics = markerGraphics;
    this.ipScanGraphicsLayer.addMany([radiusGraphic, ...markerGraphics]);
    this.updateIpMarkerSymbols();
    this.focusIpScanArea(center, radiusKm);
  }

  private clearIpScanGraphics(): void {
    this.ipScanGraphicsLayer?.removeAll();
    this.ipScanMarkerGraphics = [];
  }

  private resolveIpMarkerPoint(record: { ip: string; lat?: number; lon?: number }, index: number, total: number, center: { lat: number; lon: number }, radiusKm: number): { lat: number; lon: number } {
    if (Number.isFinite(record.lat) && Number.isFinite(record.lon)) {
      const distance = this.getDistanceKm(center, { lat: record.lat as number, lon: record.lon as number });
      if (distance <= radiusKm * 1.05) {
        return { lat: record.lat as number, lon: record.lon as number };
      }
    }

    const hash = this.hashString(`${record.ip}:${index}:${total}`);
    const angle = ((hash % 36000) / 36000) * Math.PI * 2;
    const radialSeed = ((Math.floor(hash / 36000) % 10000) + 1) / 10001;
    const distanceKm = Math.max(0.35, radiusKm * 0.92 * Math.sqrt(radialSeed));
    const latOffset = (distanceKm * Math.cos(angle)) / 111.32;
    const lonScale = Math.max(0.12, Math.cos(center.lat * Math.PI / 180));
    const lonOffset = (distanceKm * Math.sin(angle)) / (111.32 * lonScale);

    return {
      lat: Math.max(-89.9, Math.min(89.9, center.lat + latOffset)),
      lon: this.normalizeLongitude(center.lon + lonOffset),
    };
  }

  private buildRadiusPolygon(center: { lat: number; lon: number }, radiusKm: number): any {
    const ring: number[][] = [];
    const latRad = center.lat * Math.PI / 180;
    const lonRad = center.lon * Math.PI / 180;
    const angularDistance = radiusKm / 6371.0088;

    for (let step = 0; step <= 96; step++) {
      const bearing = (step / 96) * Math.PI * 2;
      const pointLat = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing));
      const pointLon = lonRad + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat));
      ring.push([this.normalizeLongitude(pointLon * 180 / Math.PI), pointLat * 180 / Math.PI]);
    }

    return {
      type: 'polygon',
      rings: [ring],
      spatialReference: { wkid: 4326 },
    };
  }

  private updateIpMarkerSymbols(): void {
    if (!this.ipScanMarkerGraphics.length) {
      return;
    }

    const size = this.getIpMarkerSizeForView();
    for (const graphic of this.ipScanMarkerGraphics) {
      graphic.symbol = this.buildIpMarkerSymbol(size);
    }
  }

  private buildIpMarkerSymbol(size: number): any {
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

  private getIpMarkerSizeForView(): number {
    const scale = Number(this.view?.scale || 50000000);
    const logScale = Math.log10(Math.max(1, scale));
    const zoomFactor = Math.max(0, Math.min(1, (8.25 - logScale) / 4.5));
    return Math.round((6 + (zoomFactor * 9)) * 10) / 10;
  }

  private focusIpScanArea(center: { lat: number; lon: number }, radiusKm: number): void {
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

  private getDistanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
    const toRadians = (value: number) => value * Math.PI / 180;
    const dLat = toRadians(b.lat - a.lat);
    const dLon = toRadians(b.lon - a.lon);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2);
    return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  private normalizeLongitude(value: number): number {
    return ((((value + 180) % 360) + 360) % 360) - 180;
  }

  private hashString(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
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
    this.animatedArcGraphicsLayer.addMany([
      ...this.startMarkerGraphics,
      ...this.endMarkerGraphics,
      ...this.movingDotGraphics,
    ]);

  }

  private isActiveRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.loadRequestId;
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined';
  }
}
