import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { loadModules, setDefaultOptions } from 'esri-loader';
import { buildArcPath, buildArcPathPoints, buildCountryFeatureIndex, buildSurfacePath, collectArcPairs, getFeatureAnchor, getArcPointAtProgress } from './threat-lens-map.utils';
import { SidebarService } from '../../shared/services/sidebar.service';
import { FilterModel } from '../../shared/model/filter/filter.model';
import { FiltersComponent } from "../../shared/partials/filters/filters.component";
import { threat_lens_filters } from '../../shared/constants/filters';
import { AnimatedArcDescriptor, SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensDisplayFeedItem, ThreatLensFeedItem, ThreatLensFeedRange, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, } from './threat.lens.model';
import { ThreatLensService } from './threat.lens.service';

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltersComponent],
  templateUrl: './threat-lens.html',
})
export class ThreatLensComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewNode?: ElementRef<HTMLDivElement>;
  @ViewChild('newsFeedScroller') private newsFeedScroller?: ElementRef<HTMLDivElement>;
  @ViewChild('archiveFeedScroller') private archiveFeedScroller?: ElementRef<HTMLDivElement>;
  private view: any | null = null;
  private countryLayer: any | null = null;
  private newsGraphicsLayer: any | null = null;
  private arcGraphicsLayer: any | null = null;
  private arcSurfaceGraphicsLayer: any | null = null;
  private animatedArcGraphicsLayer: any | null = null;
  private countryLayerView: any | null = null;
  private highlightHandle: { remove: () => void } | null = null;
  private mapClickHandle: { remove: () => void } | null = null;
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
  private newsFeedAutoScrollTimer: number | null = null;
  private archiveFeedAutoScrollTimer: number | null = null;
  private newsFeedAutoScrollPaused = false;
  private archiveFeedAutoScrollPaused = false;
  private newsFeedResumeTimer: number | null = null;
  private archiveFeedResumeTimer: number | null = null;
  private allNewsFeedItems: ThreatLensDisplayFeedItem[] = [];
  private allArchiveFeedItems: ThreatLensDisplayFeedItem[] = [];
  private destroyed = false;

  protected readonly filterModel: FilterModel = threat_lens_filters;
  protected readonly feedRanges: Array<{ key: ThreatLensFeedRange; label: string }> = [{ key: '1d', label: '1 Day' }, { key: '7d', label: '1 Week' }, { key: 'all', label: 'All Time' }];

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
  selectedFeedRange: ThreatLensFeedRange = 'all';
  newsFeedItems: ThreatLensDisplayFeedItem[] = [];
  archiveFeedItems: ThreatLensDisplayFeedItem[] = [];

  constructor(private ngZone: NgZone, private threatLensService: ThreatLensService, protected sidebarService: SidebarService) {
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
    this.clearHighlight();
    this.stopArcAnimation();

    if (this.view) {
      this.view.destroy();
      this.view = null;
    }

    this.stopFeedAutoScroll('news');
    this.stopFeedAutoScroll('archive');
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
            color: [29, 45, 71, 1],
            outline: {
              color: [255, 255, 255, 0.1],
              width: 0.8,
            },
          },
        },
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

      const map = new EsriMap({
        basemap: 'oceans',
        ground: 'world-elevation',
        layers: [this.countryLayer, this.newsGraphicsLayer, this.arcSurfaceGraphicsLayer, this.arcGraphicsLayer, this.animatedArcGraphicsLayer],
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
      await this.loadThreatLensData('');
    }
    catch (error) {
      console.error('Failed to initialize threat lens map', error);
      this.ngZone.run(() => {
        this.isLoading = false;
        this.statusMessage = 'Failed to initialize threat lens map.';
      });
    }
  }

  private registerClickHandler(): void {
    if (!this.view || !this.countryLayer) {
      return;
    }

    this.mapClickHandle = this.view.on('click', async (event: any) => {
      if (!this.view || !this.countryLayer) {
        return;
      }

      const hit = await this.view.hitTest(event, { include: [this.countryLayer] });
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
      });

      this.applyHighlight(countryGraphic);
      const geometryToFocus = countryGraphic.geometry?.extent ?? countryGraphic.geometry;

      if (geometryToFocus) {
        await this.view.goTo(geometryToFocus, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
      }
    });
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
      this.isLoading = true;
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
        this.allNewsFeedItems = [];
        this.allArchiveFeedItems = [];
        this.newsFeedItems = [];
        this.archiveFeedItems = [];
        this.statusMessage = activeQuery
          ? `Failed to load threat lens data for "${activeQuery}" from /api/threat/lens.`
          : 'Failed to load threat lens data from /api/threat/lens.';
        this.isLoading = false;
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
      this.setFeedCollections(stats.feedItems);
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
        this.isLoading = false;
        return;
      }

      this.statusMessage = totalArcCount > 0
        ? this.activeArcCountryFilterKey
          ? `Loaded ${stats.totalResults} records${queryLabel}. Showing only arc connections linked to ${this.selectedCountryName || activeQuery}, rotating in batches of up to ${this.arcBatchSize}.`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries. Showing rotating arc batches of up to ${this.arcBatchSize} at a time. Most active: ${mostActive.country} (${mostActive.count}).`
        : this.activeArcCountryFilterKey
          ? `Loaded ${stats.totalResults} records${queryLabel}, but no arc connections were found for ${this.selectedCountryName || activeQuery}.`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries, but no multi-country co-occurrence was found for arcs.`;
      this.isLoading = false;
    });

    if (this.activeArcCountryFilterKey) {
      await this.focusCountryByKey(this.activeArcCountryFilterKey);
    }

    this.restartFeedAutoScroll();
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
          color: category.color,
          weight: pair.weight,
          arcPoints,
          arcPaths,
          surfacePaths,
          countryAKey: pair.countryAKey,
          countryBKey: pair.countryBKey,
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

  setFeedRange(range: ThreatLensFeedRange): void {
    if (this.selectedFeedRange === range) {
      return;
    }

    this.selectedFeedRange = range;
    this.applyFeedRangeFilter();
    this.resetFeedScrollPositions();
  }

  onFeedHover(feedType: 'news' | 'archive', paused: boolean): void {
    this.setFeedAutoScrollPaused(feedType, paused);
  }

  onFeedInteract(feedType: 'news' | 'archive'): void {
    this.pauseFeedAutoScrollTemporarily(feedType);
  }

  openFeedItem(item: ThreatLensDisplayFeedItem): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }
    const safeUrl = this.toSafeHttpUrl(item.link);
    if (!safeUrl) {
      return;
    }

    window.open(safeUrl, '_blank', 'noopener,noreferrer');
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
        category: arc.categoryKey,
        country_a: arc.countryAKey,
        country_b: arc.countryBKey,
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
        category: arc.categoryKey,
        country_a: arc.countryAKey,
        country_b: arc.countryBKey,
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
    this.animatedArcGraphicsLayer.addMany(this.movingDotGraphics);

  }

  private setFeedCollections(feedItems: ThreatLensFeedItem[]): void {
    const normalizedItems = feedItems.map((item) => ({
      ...item,
      displayDate: this.formatFeedDate(item.date),
      colorHex: this.toHexColor(item.color),
    }));

    this.allNewsFeedItems = normalizedItems.filter((item) => item.categoryKey === 'news_model');
    this.allArchiveFeedItems = normalizedItems.filter((item) => item.categoryKey !== 'news_model');
    this.applyFeedRangeFilter();
    this.resetFeedScrollPositions();
  }

  private applyFeedRangeFilter(): void {
    const minTimestamp = this.getFeedRangeMinTimestamp();
    this.newsFeedItems = this.filterFeedItemsByRange(this.allNewsFeedItems, minTimestamp);
    this.archiveFeedItems = this.filterFeedItemsByRange(this.allArchiveFeedItems, minTimestamp);
  }

  private filterFeedItemsByRange(items: ThreatLensDisplayFeedItem[], minTimestamp: number): ThreatLensDisplayFeedItem[] {
    if (!minTimestamp) {
      return items;
    }

    return items.filter((item) => item.timestamp >= minTimestamp);
  }

  private getFeedRangeMinTimestamp(): number {
    if (this.selectedFeedRange === 'all') {
      return 0;
    }

    const dayCount = Number.parseInt(this.selectedFeedRange, 10);
    if (!Number.isFinite(dayCount)) {
      return 0;
    }

    return Date.now() - (dayCount * 24 * 60 * 60 * 1000);
  }

  private formatFeedDate(value: string): string {
    if (!value) {
      return 'Date unavailable';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  private restartFeedAutoScroll(): void {
    this.stopFeedAutoScroll('news');
    this.stopFeedAutoScroll('archive');
    this.startFeedAutoScroll('news');
    this.startFeedAutoScroll('archive');
  }

  private startFeedAutoScroll(feedType: 'news' | 'archive'): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    const timer = window.setInterval(() => {
      const container = this.getFeedScroller(feedType)?.nativeElement;
      const isPaused = feedType === 'news' ? this.newsFeedAutoScrollPaused : this.archiveFeedAutoScrollPaused;

      if (!container || isPaused) {
        return;
      }

      const maxScrollTop = container.scrollHeight - container.clientHeight;
      if (maxScrollTop <= 0) {
        return;
      }

      if (container.scrollTop >= maxScrollTop - 1) {
        container.scrollTop = 0;
        return;
      }

      container.scrollTop += 1;
    }, 45);

    if (feedType === 'news') {
      this.newsFeedAutoScrollTimer = timer;
      return;
    }

    this.archiveFeedAutoScrollTimer = timer;
  }

  private stopFeedAutoScroll(feedType: 'news' | 'archive'): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    const activeTimer = feedType === 'news' ? this.newsFeedAutoScrollTimer : this.archiveFeedAutoScrollTimer;
    if (activeTimer !== null) {
      window.clearInterval(activeTimer);
    }

    if (feedType === 'news') {
      this.newsFeedAutoScrollTimer = null;
      if (this.newsFeedResumeTimer !== null) {
        window.clearTimeout(this.newsFeedResumeTimer);
        this.newsFeedResumeTimer = null;
      }
      return;
    }

    this.archiveFeedAutoScrollTimer = null;
    if (this.archiveFeedResumeTimer !== null) {
      window.clearTimeout(this.archiveFeedResumeTimer);
      this.archiveFeedResumeTimer = null;
    }
  }

  private setFeedAutoScrollPaused(feedType: 'news' | 'archive', paused: boolean): void {
    if (feedType === 'news') {
      this.newsFeedAutoScrollPaused = paused;
      if (paused && this.newsFeedResumeTimer !== null) {
        window.clearTimeout(this.newsFeedResumeTimer);
        this.newsFeedResumeTimer = null;
      }
      return;
    }

    this.archiveFeedAutoScrollPaused = paused;
    if (paused && this.archiveFeedResumeTimer !== null) {
      window.clearTimeout(this.archiveFeedResumeTimer);
      this.archiveFeedResumeTimer = null;
    }
  }

  private pauseFeedAutoScrollTemporarily(feedType: 'news' | 'archive'): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    this.setFeedAutoScrollPaused(feedType, true);

    const resumeTimer = window.setTimeout(() => {
      this.setFeedAutoScrollPaused(feedType, false);
    }, 2500);

    if (feedType === 'news') {
      if (this.newsFeedResumeTimer !== null) {
        window.clearTimeout(this.newsFeedResumeTimer);
      }
      this.newsFeedResumeTimer = resumeTimer;
      return;
    }

    if (this.archiveFeedResumeTimer !== null) {
      window.clearTimeout(this.archiveFeedResumeTimer);
    }
    this.archiveFeedResumeTimer = resumeTimer;
  }

  private getFeedScroller(feedType: 'news' | 'archive'): ElementRef<HTMLDivElement> | undefined {
    return feedType === 'news' ? this.newsFeedScroller : this.archiveFeedScroller;
  }

  private resetFeedScrollPositions(): void {
    if (!this.isBrowserEnvironment()) {
      return;
    }

    window.setTimeout(() => {
      this.newsFeedScroller?.nativeElement.scrollTo({ top: 0 });
      this.archiveFeedScroller?.nativeElement.scrollTo({ top: 0 });
    });
  }

  private isActiveRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.loadRequestId;
  }

  private isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined';
  }

  private toSafeHttpUrl(value: string): string {
    const input = String(value || '').trim();
    if (!input || !this.isBrowserEnvironment()) {
      return '';
    }

    try {
      const url = new URL(input, window.location.origin);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.toString();
      }
    }
    catch {
    }

    return '';
  }
}
