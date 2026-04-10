import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable } from 'rxjs';
import { loadModules, setDefaultOptions } from 'esri-loader';
import { ThreatCountryCount, ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensMapData, ThreatLensMiddlewareService, ThreatLensRequestPayload } from './threat-lens-middleware.service';
import { buildArcPath, buildArcPathPoints, buildCountryFeatureIndex, buildSurfacePath, collectArcPairs, getFeatureAnchor, getArcPointAtProgress } from './threat-lens-map.utils';
import { SidebarService } from '../../shared/services/sidebar.service';
import { FilterModel } from '../../shared/model/filter/filter.model';
import { FiltersComponent } from "../../shared/partials/filters/filters.component";
import { consolidated_filters } from '../../shared/constants/filters';

type ThreatLensLegendItem = {
  categoryKey: ThreatLensCategoryModelKey;
  label: string;
  colorHex: string;
  countryCount: number;
  arcCount: number;
  totalResults: number;
};

type SelectedCountryCategoryCount = {
  label: string;
  colorHex: string;
  count: number;
};

type AnimatedArcDescriptor = {
  categoryKey: ThreatLensCategoryModelKey;
  color: [number, number, number];
  weight: number;
  arcPoints: [number, number, number][];
  arcPaths: [number, number, number][][];
  surfacePaths: [number, number][][];
  countryAKey: string;
  countryBKey: string;
  animationOffset: number;
  animationDuration: number;
};

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [CommonModule, FormsModule, FiltersComponent],
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
  private readonly countryNameFields = ['COUNTRY', 'COUNTRYAFF', 'NAME', 'ADMIN', 'SOVEREIGNT'];
  private activePulseGraphics: any[] = [];
  private readonly segmentCount = 6;
  private movingDotGraphics: any[] = [];

  protected readonly filterModel: FilterModel=consolidated_filters;

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

  constructor(private ngZone: NgZone, private threatLensMiddleware: ThreatLensMiddlewareService, protected sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnDestroy(): void {
    this.mapClickHandle?.remove();
    this.mapClickHandle = null;
    this.clearHighlight();
    this.stopArcAnimation();

    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  }

  async onSearch(): Promise<void> {
    await this.loadThreatLensData(this.searchTerm.trim());
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapViewNode?.nativeElement) {
      return;
    }

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
      basemap: 'dark-gray-vector',
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
        atmosphereEnabled: true,
        starsEnabled: true,
      },
    });

    await this.view.when();
    this.view.ui.components = [];
    this.countryLayerView = await this.view.whenLayerView(this.countryLayer);
    await this.buildCountryFeatureIndex();
    this.registerClickHandler();
    await this.loadThreatLensData('');
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
    this.countryFeatureIndex = buildCountryFeatureIndex(response.features, this.countryNameFields, (value) => this.threatLensMiddleware.normalizeCountryLabel(value), (value) => this.toCountryKey(value));
  }

  private async loadThreatLensData(query: string): Promise<void> {
    const activeQuery = query.trim();
    this.currentQuery = activeQuery;

    this.ngZone.run(() => {
      this.isLoading = true;
      this.statusMessage = activeQuery
        ? `Searching threat lens results for "${activeQuery}"...`
        : 'Loading complete threat lens dataset...';
    });

    const loadAllPages = false;
    let statsResult: { ok: true; stats: ThreatLensMapData } | { ok: false; stats: null };
    try {
      const stats = await firstValueFrom(this.threatLensMiddleware.getThreatLensMapData(this.buildSearchPayload(activeQuery), loadAllPages),);
      statsResult = { ok: true, stats };
    }
    catch (error) {
      console.error('Failed to load threat lens data', error);
      statsResult = { ok: false, stats: null };
    }
    console.log(statsResult);

    if (!statsResult.ok || !statsResult.stats) {
      await this.renderCountryArcs([]);
      this.arcCount = 0;
      this.ngZone.run(() => {
        this.topCountries = [];
        this.categoryLegend = [];
        this.selectedCountryBreakdown = [];
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
    this.arcCount = totalArcCount;

    const mostActive = stats.countryCounts[0];
    const queryLabel = activeQuery ? ` for "${activeQuery}"` : '';

    this.ngZone.run(() => {
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

      if (!mostActive) {
        this.statusMessage = `Loaded ${stats.totalResults} records${queryLabel}, but no country metadata was found.`;
        this.isLoading = false;
        return;
      }

      this.statusMessage = totalArcCount > 0
        ? `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries. Showing rotating arc batches of up to ${this.arcBatchSize} at a time. Most active: ${mostActive.country} (${mostActive.count}).`
        : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries, but no multi-country co-occurrence was found for arcs.`;
      this.isLoading = false;
    });
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

      let renderedArcCount = 0;

      for (const pair of pairs) {
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
    const normalized = this.threatLensMiddleware.normalizeCountryLabel(value);
    return this.threatLensMiddleware.toCountryKey(normalized);
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

  private buildSearchPayload(query: string): Partial<ThreatLensRequestPayload> {
    const payload: Partial<ThreatLensRequestPayload> = { q: query };
    if (!query) {
      return payload;
    }

    const normalizedCountry = this.threatLensMiddleware.normalizeCountryLabel(query);
    const countryKey = this.toCountryKey(normalizedCountry);
    if (countryKey && this.countryFeatureIndex.has(countryKey)) {
      payload.q = '';
      payload.entity_filter = { m_country: [normalizedCountry] };
      payload.must = true;
      payload.fullsearch = false;
    }

    return payload;
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
    this.activePulseGraphics = [];

    const totalGraphics = items.length * this.segmentCount;

    for (let i = 0; i < totalGraphics; i++) {
      this.activePulseGraphics.push({
        geometry: null,
        symbol: {
          type: 'line-3d',
          symbolLayers: [
            {
              type: 'path',
              profile: 'quad',
              width: 6,
              cap: 'round',
              material: { color: [255, 255, 255, 0.3] },
              anchor: 'center',
            }
          ],
        },
      });
    }

    this.animatedArcGraphicsLayer.removeAll();
    this.animatedArcGraphicsLayer.addMany(this.activePulseGraphics);
    this.movingDotGraphics = [];

    for (const arc of items) {
      const graphic = {
        geometry: null,
        symbol: {
          type: 'point-3d',
          symbolLayers: [
            {
              type: 'object',
              resource: { primitive: 'sphere' },
              width: 120000,
              height: 120000,
              depth: 120000,
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
}
