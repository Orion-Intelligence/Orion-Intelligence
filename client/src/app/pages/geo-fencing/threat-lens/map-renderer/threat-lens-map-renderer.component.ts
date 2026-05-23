import { AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { loadModules, setDefaultOptions } from 'esri-loader';
import { ThreatCountryCount, ThreatLensCategoryMapData, ThreatLensLegendItem } from '../../models/geo-fencing.models';
import { ThreatLensService } from '../threat.lens.service';
import { buildThreatLensCategoryCountryCounts, buildThreatLensLegend, getThreatLensSelectedCountryBreakdown } from '../utils/threat-lens-geo.utils';
import { ThreatLensArcRenderer } from './renderers/threat-lens-arc.renderer';
import { ThreatLensCountryLayerRenderer } from './renderers/threat-lens-country-layer.renderer';
import { ThreatLensIpMarkerRenderer } from './renderers/threat-lens-ip-marker.renderer';
import { ThreatLensTooltipRenderer } from './renderers/threat-lens-tooltip.renderer';
import { ThreatLensArcRenderResult, ThreatLensCoordinates, ThreatLensCountrySelection, ThreatLensIpRecord } from './threat-lens-map.types';

@Component({
  selector: 'app-threat-lens-map-renderer',
  standalone: true,
  templateUrl: './threat-lens-map-renderer.component.html',
})
export class ThreatLensMapRendererComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) private mapContainer?: ElementRef<HTMLDivElement>;
  private view: any | null = null;
  private countryRenderer = new ThreatLensCountryLayerRenderer();
  private tooltipRenderer = new ThreatLensTooltipRenderer();
  private arcRenderer: ThreatLensArcRenderer | null = null;
  private ipMarkerRenderer: ThreatLensIpMarkerRenderer | null = null;
  private newsGraphicsLayer: any | null = null;
  private arcGraphicsLayer: any | null = null;
  private arcSurfaceGraphicsLayer: any | null = null;
  private animatedArcGraphicsLayer: any | null = null;
  private ipScanGraphicsLayer: any | null = null;
  private mapClickHandle: { remove: () => void } | null = null;
  private pointerMoveHandle: { remove: () => void } | null = null;
  private viewScaleWatchHandle: { remove: () => void } | null = null;
  private viewZoomWatchHandle: { remove: () => void } | null = null;
  private mapResizeObserver: ResizeObserver | null = null;
  private mapResizeFrame: number | null = null;
  private hoveredCountryKey = '';
  private activeBasemapId = '';
  private destroyed = false;
  private categoryLegend: ThreatLensLegendItem[] = [];
  private countryNewsCountByKey = new Map<string, number>();
  private categoryCountryNewsCountByKey = new Map();
  private readonly threatBasemapId = 'dark-gray-vector';
  private readonly streetBasemapId = 'streets-night-vector';
  private readonly streetBasemapMinZoom = 6;

  @Output() mapReady = new EventEmitter<void>();
  @Output() mapError = new EventEmitter<string>();
  @Output() countrySelected = new EventEmitter<ThreatLensCountrySelection>();
  @Output() emptySelection = new EventEmitter<void>();
  @Output() ipSelected = new EventEmitter<string>();
  @Output() arcCountChange = new EventEmitter<number>();

  constructor(private ngZone: NgZone, private threatLensService: ThreatLensService) {}

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      void this.initializeMap();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.mapClickHandle?.remove();
    this.pointerMoveHandle?.remove();
    this.viewScaleWatchHandle?.remove();
    this.viewZoomWatchHandle?.remove();
    this.mapResizeObserver?.disconnect();
    this.arcRenderer?.destroy();
    this.ipMarkerRenderer?.clear();
    this.countryRenderer.destroy();
    this.tooltipRenderer.destroy();

    if (this.mapResizeFrame !== null) {
      cancelAnimationFrame(this.mapResizeFrame);
      this.mapResizeFrame = null;
    }

    this.view?.destroy();
    this.view = null;
  }

  hasCountryKey(countryKey: string): boolean {
    return this.countryRenderer.hasCountryKey(countryKey);
  }

  getCountryName(countryKey: string): string {
    return this.countryRenderer.getCountryName(countryKey);
  }

  renderThreatData(categoryData: ThreatLensCategoryMapData[], countryCounts: ThreatCountryCount[], activeCountryFilterKey: string): ThreatLensArcRenderResult {
    this.countryNewsCountByKey = new Map(countryCounts.map((item) => [this.toCountryKey(item.country), item.count]));
    this.categoryCountryNewsCountByKey = buildThreatLensCategoryCountryCounts(categoryData, (value) => this.toCountryKey(value));
    const arcResult = this.arcRenderer?.render(categoryData, activeCountryFilterKey) ?? { totalArcCount: 0, arcCountByCategory: new Map() };
    this.categoryLegend = buildThreatLensLegend(categoryData, arcResult.arcCountByCategory);
    this.renderNewsIntensity();
    return arcResult;
  }

  getSelectedCountryBreakdown(countryKey: string): ThreatLensCountrySelection['breakdown'] {
    return getThreatLensSelectedCountryBreakdown(countryKey, this.categoryLegend, this.categoryCountryNewsCountByKey);
  }

  async focusCountryByKey(countryKey: string): Promise<ThreatLensCountrySelection | null> {
    if (!this.view || !countryKey) {
      return null;
    }

    const graphic = this.countryRenderer.getFeature(countryKey);
    if (!graphic) {
      return null;
    }

    const selection = this.buildCountrySelection(graphic);
    this.countryRenderer.applyHighlight(graphic);
    const geometryToFocus = graphic.geometry?.extent ?? graphic.geometry;

    if (geometryToFocus) {
      await this.view.goTo(geometryToFocus, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
    }

    return selection;
  }

  renderIpScanMarkers(records: ThreatLensIpRecord[], center: ThreatLensCoordinates, radiusKm: number): void {
    this.ipMarkerRenderer?.render(records, center, radiusKm);
  }

  clearIpScanMarkers(): void {
    this.ipMarkerRenderer?.clear();
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapContainer?.nativeElement) {
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

      const countryLayer = this.countryRenderer.createLayer(FeatureLayer);
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
        basemap: this.threatBasemapId,
        ground: 'world-elevation',
        layers: [
          countryLayer,
          this.newsGraphicsLayer,
          this.arcSurfaceGraphicsLayer,
          this.arcGraphicsLayer,
          this.animatedArcGraphicsLayer,
          this.ipScanGraphicsLayer,
        ],
      });

      this.view = new SceneView({
        container: this.mapContainer.nativeElement,
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

      this.view.ui.components = ['zoom'];
      this.updateBasemapForZoom();
      await this.countryRenderer.init(this.view,
        (value) => this.threatLensService.normalizeCountryLabel(value),
        (value) => this.toCountryKey(value),);

      if (this.destroyed) {
        return;
      }

      this.arcRenderer = new ThreatLensArcRenderer(this.ngZone,
        this.countryRenderer,
        this.arcGraphicsLayer,
        this.arcSurfaceGraphicsLayer,
        this.animatedArcGraphicsLayer,
        geometryEngine,
        webMercatorUtils,
        (value) => this.toCountryKey(value),
        (count) => this.arcCountChange.emit(count),);
      this.ipMarkerRenderer = new ThreatLensIpMarkerRenderer(this.view, this.ipScanGraphicsLayer);

      this.tooltipRenderer.init();
      this.observeMapResize();
      this.scheduleMapResize();
      window.setTimeout(() => this.view?.resize?.(), 150);
      this.registerViewScaleWatcher();
      this.registerBasemapWatcher();
      this.registerClickHandler();
      this.registerHoverHandler();
      this.ngZone.run(() => this.mapReady.emit());
    }
    catch (error) {
      console.error('Failed to initialize threat lens map', error);
      this.ngZone.run(() => this.mapError.emit('Failed to initialize threat lens map.'));
    }
  }

  private registerClickHandler(): void {
    if (!this.view || !this.countryRenderer.layer) {
      return;
    }

    this.mapClickHandle = this.view.on('click', async (event: any) => {
      if (!this.view || !this.countryRenderer.layer) {
        return;
      }

      const hit = await this.view.hitTest(event, { include: [this.ipScanGraphicsLayer, this.countryRenderer.layer].filter(Boolean) });
      const ipGraphic = hit.results.find((result: any) => this.ipMarkerRenderer?.isMarkerGraphic(result.graphic))?.graphic;

      if (ipGraphic) {
        const ip = typeof ipGraphic.attributes?.ip === 'string' ? ipGraphic.attributes.ip : '';
        if (ip) {
          this.tooltipRenderer.hide();
          this.clearHoverHighlight();
          this.ngZone.run(() => this.ipSelected.emit(ip));
        }
        return;
      }

      const countryGraphic = hit.results.find((result: any) => result.graphic?.layer === this.countryRenderer.layer)?.graphic;

      if (!countryGraphic) {
        this.countryRenderer.clearHighlight();
        this.ngZone.run(() => this.emptySelection.emit());
        return;
      }

      const selection = this.buildCountrySelection(countryGraphic);
      this.ngZone.run(() => this.countrySelected.emit(selection));
      this.countryRenderer.applyHighlight(countryGraphic);
      const geometryToFocus = countryGraphic.geometry?.extent ?? countryGraphic.geometry;

      if (geometryToFocus) {
        await this.view.goTo(geometryToFocus, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
      }
    });
  }

  private registerHoverHandler(): void {
    if (!this.view || !this.countryRenderer.layer) {
      return;
    }

    this.pointerMoveHandle = this.view.on('pointer-move', async (event: any) => {
      if (!this.view || !this.countryRenderer.layer) {
        return;
      }

      const hit = await this.view.hitTest(event, {
        include: [
          this.ipScanGraphicsLayer,
          this.animatedArcGraphicsLayer,
          this.arcGraphicsLayer,
          this.arcSurfaceGraphicsLayer,
          this.countryRenderer.layer,
        ].filter(Boolean),
      });

      const ipGraphic = hit.results.find((result: any) => this.ipMarkerRenderer?.isMarkerGraphic(result.graphic))?.graphic;
      if (ipGraphic) {
        this.clearHoverHighlight();
        this.tooltipRenderer.showIpScan(event, ipGraphic.attributes || {});
        return;
      }

      const arcGraphic = hit.results.find((result: any) => this.arcRenderer?.isTooltipGraphic(result.graphic))?.graphic;
      if (arcGraphic) {
        this.clearHoverHighlight();
        this.tooltipRenderer.showArc(event, arcGraphic.attributes || {});
        return;
      }

      const countryGraphic = hit.results.find((result: any) => result.graphic?.layer === this.countryRenderer.layer)?.graphic;
      if (!countryGraphic) {
        this.clearHoverHighlight();
        this.tooltipRenderer.hide();
        return;
      }

      const selection = this.buildCountrySelection(countryGraphic);
      if (this.hoveredCountryKey === selection.key) {
        this.tooltipRenderer.move(event);
        return;
      }

      this.clearHoverHighlight();
      this.hoveredCountryKey = selection.key;
      this.countryRenderer.applyHoverHighlight(countryGraphic);
      this.tooltipRenderer.showCountry(event, selection.name, selection.count, selection.breakdown);
    });
  }

  private buildCountrySelection(countryGraphic: any): ThreatLensCountrySelection {
    const name = this.countryRenderer.extractCountryName(countryGraphic?.attributes);
    const key = this.toCountryKey(name);
    return {
      name,
      key,
      count: this.countryNewsCountByKey.get(key) || 0,
      breakdown: this.getSelectedCountryBreakdown(key),
    };
  }

  private registerViewScaleWatcher(): void {
    if (!this.view?.watch) {
      return;
    }

    this.viewScaleWatchHandle?.remove();
    this.viewScaleWatchHandle = this.view.watch('scale', () => this.ipMarkerRenderer?.updateSymbols());
  }

  private registerBasemapWatcher(): void {
    if (!this.view?.watch) {
      return;
    }

    this.viewZoomWatchHandle?.remove();
    this.viewZoomWatchHandle = this.view.watch('zoom', () => this.updateBasemapForZoom());
  }

  private updateBasemapForZoom(): void {
    if (!this.view?.map) {
      return;
    }

    const nextBasemapId = (this.view.zoom ?? 0) >= this.streetBasemapMinZoom ? this.streetBasemapId : this.threatBasemapId;
    if (nextBasemapId === this.activeBasemapId) {
      return;
    }

    this.activeBasemapId = nextBasemapId;
    this.view.map.basemap = nextBasemapId;
  }

  private observeMapResize(): void {
    const element = this.mapContainer?.nativeElement;
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

  private clearHoverHighlight(): void {
    this.countryRenderer.clearHoverHighlight();
    this.hoveredCountryKey = '';
  }

  private renderNewsIntensity(): void {
    this.newsGraphicsLayer?.removeAll();
  }

  private toCountryKey(value: string): string {
    const normalized = this.threatLensService.normalizeCountryLabel(value);
    return this.threatLensService.toCountryKey(normalized);
  }
}
