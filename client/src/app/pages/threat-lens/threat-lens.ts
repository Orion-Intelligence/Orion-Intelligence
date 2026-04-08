import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { loadModules, setDefaultOptions } from 'esri-loader';
import {
  ThreatCountryCount,
  ThreatLensCategoryMapData,
  ThreatLensCategoryModelKey,
  ThreatLensMiddlewareService,
} from './threat-lens-middleware.service';
import { buildArcPath, buildCountryFeatureIndex, buildSurfacePath, collectArcPairs, getFeatureAnchor } from './threat-lens-map.utils';

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

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './threat-lens.html',
})
export class ThreatLensComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewNode?: ElementRef<HTMLDivElement>;
  private view: any | null = null;
  private countryLayer: any | null = null;
  private newsGraphicsLayer: any | null = null;
  private arcGraphicsLayer: any | null = null;
  private arcSurfaceGraphicsLayer: any | null = null;
  private countryLayerView: any | null = null;
  private highlightHandle: { remove: () => void } | null = null;
  private mapClickHandle: { remove: () => void } | null = null;
  private countryFeatureIndex = new Map<string, any>();
  private countryNewsCountByKey = new Map<string, number>();
  private categoryCountryNewsCountByKey = new Map<ThreatLensCategoryModelKey, Map<string, number>>();
  private geometryEngine: any | null = null;
  private webMercatorUtils: any | null = null;
  private readonly maxArcCount = 140;
  private readonly minArcWeight = 1;
  private readonly countryNameFields = ['COUNTRY', 'COUNTRYAFF', 'NAME', 'ADMIN', 'SOVEREIGNT'];

  searchTerm = '';
  currentQuery = '';
  selectedCountryName = '';
  statusMessage = 'Loading threat lens results...';
  isLoading = true;
  topCountries: ThreatCountryCount[] = [];
  arcCount = 0;
  categoryLegend: ThreatLensLegendItem[] = [];
  selectedCountryBreakdown: SelectedCountryCategoryCount[] = [];

  constructor(private ngZone: NgZone, private threatLensMiddleware: ThreatLensMiddlewareService) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnDestroy(): void {
    this.mapClickHandle?.remove();
    this.mapClickHandle = null;
    this.clearHighlight();

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
      opacity: 0.5,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [59, 130, 246, 0.08],
          outline: {
            color: [148, 185, 255, 0.25],
            width: 0.5,
          },
        },
      },
    });

    this.newsGraphicsLayer = new GraphicsLayer({ title: 'Threat Lens Intensity' });
    this.arcGraphicsLayer = new GraphicsLayer({
      title: 'Threat Lens Country Arcs',
      elevationInfo: { mode: 'absolute-height' },
    });
    this.arcSurfaceGraphicsLayer = new GraphicsLayer({ title: 'Threat Lens Country Arc Connectors' });

    const map = new EsriMap({
      basemap: 'satellite',
      ground: 'world-elevation',
      layers: [this.countryLayer, this.newsGraphicsLayer, this.arcSurfaceGraphicsLayer, this.arcGraphicsLayer],
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
        try {
          await this.view.goTo(geometryToFocus, { duration: 750, easing: 'ease-in-out' });
        }
        catch {
        }
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
    this.countryFeatureIndex = buildCountryFeatureIndex(
      response.features,
      this.countryNameFields,
      (value) => this.threatLensMiddleware.normalizeCountryLabel(value),
      (value) => this.toCountryKey(value),
    );
  }

  private async loadThreatLensData(query: string): Promise<void> {
    const activeQuery = query.trim();
    this.currentQuery = activeQuery;

    this.ngZone.run(() => {
      this.isLoading = true;
      this.statusMessage = activeQuery
        ? `Searching threat lens results for "${activeQuery}"...`
        : 'Loading threat lens results...';
    });

    try {
      const stats = await firstValueFrom(this.threatLensMiddleware.getThreatLensMapData({ q: activeQuery }));
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
          return;
        }

        this.statusMessage = totalArcCount > 0
          ? `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries and drew ${totalArcCount} country arcs. Most active: ${mostActive.country} (${mostActive.count}).`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries, but no multi-country co-occurrence was found for arcs.`;
      });
    }
    catch {
      await this.renderCountryArcs([]);
      this.arcCount = 0;
      this.ngZone.run(() => {
        this.topCountries = [];
        this.categoryLegend = [];
        this.selectedCountryBreakdown = [];
        this.statusMessage = activeQuery
          ? `Failed to load threat lens data for "${activeQuery}" from /api/threat/lens.`
          : 'Failed to load threat lens data from /api/threat/lens.';
      });
    }
    finally {
      this.ngZone.run(() => {
        this.isLoading = false;
      });
    }
  }

  private async renderCountryArcs(categoryData: ThreatLensCategoryMapData[]): Promise<{
    totalArcCount: number;
    arcCountByCategory: Map<ThreatLensCategoryModelKey, number>;
  }> {
    if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer) {
      return { totalArcCount: 0, arcCountByCategory: new Map() };
    }

    this.arcGraphicsLayer.removeAll();
    this.arcSurfaceGraphicsLayer.removeAll();

    const arcCountByCategory = new Map<ThreatLensCategoryModelKey, number>();
    let totalArcCount = 0;

    for (const category of categoryData) {
      const pairs = collectArcPairs(
        category.documentCountryGroups,
        (value) => this.toCountryKey(value),
        this.countryFeatureIndex,
        this.maxArcCount,
        this.minArcWeight,
      );

      let renderedArcCount = 0;

      for (const pair of pairs) {
        const featureA = this.countryFeatureIndex.get(pair.countryAKey);
        const featureB = this.countryFeatureIndex.get(pair.countryBKey);
        const start = getFeatureAnchor(featureA, this.geometryEngine, this.webMercatorUtils);
        const end = getFeatureAnchor(featureB, this.geometryEngine, this.webMercatorUtils);

        if (!start || !end) {
          continue;
        }

        this.arcGraphicsLayer.add({
          geometry: {
            type: 'polyline',
            hasZ: true,
            paths: [buildArcPath(start, end, pair.weight)],
            spatialReference: { wkid: 4326 },
          },
          attributes: {
            category: category.categoryKey,
            country_a: pair.countryAKey,
            country_b: pair.countryBKey,
            weight: pair.weight,
          },
          symbol: {
            type: 'line-3d',
            symbolLayers: [
              {
                type: 'path',
                profile: 'tube',
                width: Math.min(20, 12 + (pair.weight * 0.8)),
                cap: 'round',
                material: { color: [255, 255, 255, 0.38] },
                anchor: 'center',
              },
              {
                type: 'path',
                profile: 'tube',
                width: Math.min(11, 5 + (pair.weight * 0.48)),
                cap: 'round',
                material: { color: [...category.color, 1] },
                anchor: 'center',
              },
            ],
          },
        });

        this.arcSurfaceGraphicsLayer.add({
          geometry: {
            type: 'polyline',
            paths: [buildSurfacePath(start, end)],
            spatialReference: { wkid: 4326 },
          },
          attributes: {
            category: category.categoryKey,
            country_a: pair.countryAKey,
            country_b: pair.countryBKey,
            weight: pair.weight,
          },
          symbol: {
            type: 'simple-line',
            color: [...category.color, 0.92],
            width: Math.min(3.8, 1.8 + (pair.weight * 0.24)),
          },
        });

        renderedArcCount += 1;
      }

      arcCountByCategory.set(category.categoryKey, renderedArcCount);
      totalArcCount += renderedArcCount;
    }

    return { totalArcCount, arcCountByCategory };
  }

  private async renderNewsIntensity(countryCounts: ThreatCountryCount[], maxCount: number): Promise<void> {
    if (!this.newsGraphicsLayer) {
      return;
    }

    this.newsGraphicsLayer.removeAll();
    if (!countryCounts.length || maxCount <= 0) {
      return;
    }

    for (const item of countryCounts) {
      const feature = this.countryFeatureIndex.get(this.toCountryKey(item.country));
      if (!feature?.geometry) {
        continue;
      }

      const opacity = this.getIntensityOpacity(item.count, maxCount);
      this.newsGraphicsLayer.add({
        geometry: feature.geometry,
        attributes: {
          country: item.country,
          news_count: item.count,
        },
        symbol: {
          type: 'simple-fill',
          color: [239, 68, 68, opacity],
          outline: {
            color: [248, 113, 113, Math.min(opacity + 0.12, 0.95)],
            width: 0.8,
          },
        },
      });
    }
  }

  private getIntensityOpacity(count: number, maxCount: number): number {
    if (maxCount <= 0) {
      return 0.14;
    }

    const ratio = Math.max(0, Math.min(1, count / maxCount));
    return 0.14 + (ratio * 0.68);
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
}
