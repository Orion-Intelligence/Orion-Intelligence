import { NgZone } from '@angular/core';
import { AnimatedArcDescriptor, ThreatLensCategoryMapData, ThreatLensCategoryModelKey } from '../../models/geo-fencing.models';
import { ThreatLensMapUtils } from '../map-utils/threat-lens-map.utils';
import { ArcCategoryBatch, ThreatLensArcBatchStatus, ThreatLensArcRenderResult } from '../models/threat-lens-map.types';
import { ThreatLensCountryLayerRenderer } from './threat-lens-country-layer.renderer';

export class ThreatLensArcRenderer {
  private animatedArcs: AnimatedArcDescriptor[] = [];
  private arcBatches: ArcCategoryBatch[] = [];
  private animationFrame: number | null = null;
  private lastAnimationTick = 0;
  private batchAnimationStartTime = 0;
  private visibleBatchIndex = -1;
  private animationPaused = false;
  private activeCategoryKey: ThreatLensCategoryModelKey | null = null;
  private movingDotGraphics: any[] = [];
  private startMarkerGraphics: any[] = [];
  private endMarkerGraphics: any[] = [];
  private readonly maxArcCount = 1000;
  private readonly minArcWeight = 1;
  private arcBatchSize = 10;
  private readonly arcBatchDuration = 10000;
  private readonly movingDotBaseSize = 5;

  constructor( private ngZone: NgZone, private countryRenderer: ThreatLensCountryLayerRenderer, private arcGraphicsLayer: any, private arcSurfaceGraphicsLayer: any, private animatedArcGraphicsLayer: any, private geometryEngine: any, private webMercatorUtils: any, private toCountryKey: (value: string) => string, private onVisibleArcCountChange: (count: number) => void, private onBatchStatusChange: (status: ThreatLensArcBatchStatus | null) => void, ) {}

  render(categoryData: ThreatLensCategoryMapData[], activeCountryFilterKey: string): ThreatLensArcRenderResult {
    if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer || !this.animatedArcGraphicsLayer) {
      return { totalArcCount: 0, arcCountByCategory: new Map() };
    }

    this.stop();
    this.arcGraphicsLayer.removeAll();
    this.arcSurfaceGraphicsLayer.removeAll();
    this.animatedArcGraphicsLayer.removeAll();
    this.animatedArcs = [];
    this.arcBatches = [];
    this.visibleBatchIndex = -1;
    this.batchAnimationStartTime = 0;

    const arcCountByCategory = new Map();
    let totalArcCount = 0;

    for (const category of categoryData) {
      const pairs = ThreatLensMapUtils.collectArcPairs(category.documentCountryGroups,
        this.toCountryKey,
        this.countryRenderer.featureIndex,
        this.maxArcCount,
        this.minArcWeight,);
      const visiblePairs = activeCountryFilterKey
        ? pairs.filter((pair) => pair.countryAKey === activeCountryFilterKey || pair.countryBKey === activeCountryFilterKey)
        : pairs;

      let renderedArcCount = 0;

      for (const pair of visiblePairs) {
        const featureA = this.countryRenderer.getFeature(pair.countryAKey);
        const featureB = this.countryRenderer.getFeature(pair.countryBKey);
        const start = ThreatLensMapUtils.getFeatureAnchor(featureA, this.geometryEngine, this.webMercatorUtils);
        const end = ThreatLensMapUtils.getFeatureAnchor(featureB, this.geometryEngine, this.webMercatorUtils);

        if (!start || !end) {
          continue;
        }

        const arcPoints = ThreatLensMapUtils.buildArcPathPoints(start, end, pair.weight);
        const arcPaths = [arcPoints];
        const surfacePaths = ThreatLensMapUtils.buildSurfacePath(start, end);
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
          countryAName: this.countryRenderer.extractCountryName(featureA?.attributes),
          countryBName: this.countryRenderer.extractCountryName(featureB?.attributes),
          animationOffset: renderedArcCount * 0.11,
          animationDuration: Math.max(1800, 3300 - Math.min(1200, pair.weight * 110)),
        });

        renderedArcCount += 1;
      }

      arcCountByCategory.set(category.categoryKey, renderedArcCount);
      totalArcCount += renderedArcCount;
    }

    this.rebuildBatches();
    this.renderBatch(0);
    this.start();

    const firstVisibleBatch = this.getVisibleBatchSequence()[0];
    return {
      totalArcCount: firstVisibleBatch?.items.length ?? Math.min(totalArcCount, this.arcBatchSize),
      arcCountByCategory,
    };
  }

  setBatchSize(size: number): void {
    const nextSize = Math.max(1, Math.min(50, Math.round(Number(size) || this.arcBatchSize)));
    if (nextSize === this.arcBatchSize) {
      return;
    }

    this.arcBatchSize = nextSize;
    this.rebuildBatches();
    this.resetBatchRotation();
    this.renderBatch(0);
  }

  setActiveCategory(categoryKey: ThreatLensCategoryModelKey | null): void {
    if (categoryKey === this.activeCategoryKey) {
      return;
    }

    this.activeCategoryKey = categoryKey;
    this.resetBatchRotation();
    this.renderBatch(0);
  }

  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.animatedArcGraphicsLayer?.removeAll();
    this.lastAnimationTick = 0;
    this.batchAnimationStartTime = 0;
    this.visibleBatchIndex = -1;
    this.onBatchStatusChange(null);
  }

  destroy(): void {
    this.stop();
    this.arcGraphicsLayer?.removeAll();
    this.arcSurfaceGraphicsLayer?.removeAll();
    this.animatedArcGraphicsLayer?.removeAll();
    this.animatedArcs = [];
    this.arcBatches = [];
    this.movingDotGraphics = [];
  }

  isTooltipGraphic(graphic: any): boolean {
    const role = graphic?.attributes?.role;
    return role === 'arc' || role === 'arc-surface' || role === 'arc-start' || role === 'arc-end' || role === 'arc-traveler';
  }

  setAnimationPaused(paused: boolean): void {
    this.animationPaused = paused;
  }

  private start(): void {
    if (!this.animatedArcGraphicsLayer || !this.animatedArcs.length) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const animate = (timestamp: number) => {
        if (!this.animatedArcGraphicsLayer) {
          this.animationFrame = null;
          return;
        }

        if (!this.batchAnimationStartTime) {
          this.batchAnimationStartTime = timestamp;
        }

        if (this.animationPaused) {
          this.animationFrame = requestAnimationFrame(animate);
          return;
        }

        if (this.lastAnimationTick && (timestamp - this.lastAnimationTick) < 40) {
          this.animationFrame = requestAnimationFrame(animate);
          return;
        }

        this.lastAnimationTick = timestamp;
        const batch = this.getCurrentBatch(timestamp);

        if (batch.index !== this.visibleBatchIndex) {
          this.renderBatch(batch.index, batch.batch);
        }

        let index = 0;
        for (const arc of batch.batch?.items ?? []) {
          const progress = ((timestamp + (arc.animationOffset * arc.animationDuration)) % arc.animationDuration) / arc.animationDuration;
          const point = ThreatLensMapUtils.getArcPointAtProgress(arc.arcPoints, progress);
          const graphic = this.movingDotGraphics[index];

          if (point && graphic) {
            const [lon, lat] = point;
            graphic.geometry = {
              type: 'point',
              longitude: lon,
              latitude: lat,
              spatialReference: { wkid: 4326 },
            };
          }

          index += 1;
        }

        this.animationFrame = requestAnimationFrame(animate);
      };

      this.animationFrame = requestAnimationFrame(animate);
    });
  }

  private getCurrentBatch(timestamp: number): { index: number; batch: ArcCategoryBatch | null } {
    const batches = this.getVisibleBatchSequence();
    if (!batches.length) {
      return { index: -1, batch: null };
    }

    const elapsed = Math.max(0, timestamp - this.batchAnimationStartTime);
    const index = Math.floor(elapsed / this.arcBatchDuration) % batches.length;
    return {
      index,
      batch: batches[index],
    };
  }

  private renderBatch(index: number, batchOverride?: ArcCategoryBatch | null): void {
    if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer) {
      return;
    }

    this.startMarkerGraphics = [];
    this.endMarkerGraphics = [];
    const batches = this.getVisibleBatchSequence();
    const batch = batchOverride ?? (index >= 0 ? batches[index] ?? null : null);
    const items = batch?.items ?? [];
    this.visibleBatchIndex = index;
    this.arcGraphicsLayer.removeAll();
    this.arcSurfaceGraphicsLayer.removeAll();

    if (!items.length) {
      this.ngZone.run(() => this.onVisibleArcCountChange(0));
      this.emitBatchStatus(null);
      return;
    }

    this.arcGraphicsLayer.addMany(items.map((arc) => this.buildArcGraphic(arc)));
    this.arcSurfaceGraphicsLayer.addMany(items.map((arc) => this.buildSurfaceGraphic(arc)));
    this.ngZone.run(() => this.onVisibleArcCountChange(items.length));
    this.emitBatchStatus(batch);
    this.movingDotGraphics = [];

    for (const arc of items) {
      this.startMarkerGraphics.push(this.buildEndpointGraphic(arc, arc.arcPoints[0], 'arc-start', 98000, 1));
      this.endMarkerGraphics.push(this.buildEndpointGraphic(arc, arc.arcPoints[arc.arcPoints.length - 1], 'arc-end', 98000, 0.88));
      this.movingDotGraphics.push(this.buildMovingDotGraphic(arc, arc.arcPoints[0]));
    }

    this.animatedArcGraphicsLayer.removeAll();
    this.animatedArcGraphicsLayer.addMany([
      ...this.startMarkerGraphics,
      ...this.endMarkerGraphics,
      ...this.movingDotGraphics,
    ]);

    const layerGraphics = this.animatedArcGraphicsLayer.graphics?.toArray?.() ?? [];
    this.startMarkerGraphics = layerGraphics.filter((graphic: any) => graphic?.attributes?.role === 'arc-start');
    this.endMarkerGraphics = layerGraphics.filter((graphic: any) => graphic?.attributes?.role === 'arc-end');
    this.movingDotGraphics = layerGraphics.filter((graphic: any) => graphic?.attributes?.role === 'arc-traveler');
  }

  private rebuildBatches(): void {
    const categoryGroups = new Map<ThreatLensCategoryModelKey, AnimatedArcDescriptor[]>();

    for (const arc of this.animatedArcs) {
      const existing = categoryGroups.get(arc.categoryKey) ?? [];
      existing.push(arc);
      categoryGroups.set(arc.categoryKey, existing);
    }

    const nextBatches: ArcCategoryBatch[] = [];
    for (const items of categoryGroups.values()) {
      const firstArc = items[0];
      if (!firstArc) {
        continue;
      }

      const categoryBatchCount = Math.ceil(items.length / this.arcBatchSize);
      for (let index = 0; index < categoryBatchCount; index += 1) {
        const start = index * this.arcBatchSize;
        nextBatches.push({
          categoryKey: firstArc.categoryKey,
          categoryLabel: firstArc.categoryLabel,
          categoryArcCount: items.length,
          categoryStartIndex: start,
          categoryBatchIndex: index,
          categoryBatchCount,
          items: items.slice(start, start + this.arcBatchSize),
        });
      }
    }

    this.arcBatches = nextBatches;
  }

  private getVisibleBatchSequence(): ArcCategoryBatch[] {
    if (!this.activeCategoryKey) {
      return this.arcBatches;
    }

    return this.arcBatches.filter((batch) => batch.categoryKey === this.activeCategoryKey);
  }

  private resetBatchRotation(): void {
    this.batchAnimationStartTime = 0;
    this.visibleBatchIndex = -1;
    this.lastAnimationTick = 0;
  }

  private emitBatchStatus(batch: ArcCategoryBatch | null): void {
    const status = batch
      ? {
        categoryKey: batch.categoryKey,
        categoryLabel: batch.categoryLabel,
        visibleCount: batch.items.length,
        categoryArcCount: batch.categoryArcCount,
        start: batch.categoryStartIndex + 1,
        end: batch.categoryStartIndex + batch.items.length,
        batchIndex: batch.categoryBatchIndex + 1,
        batchCount: batch.categoryBatchCount,
        isCategoryLocked: Boolean(this.activeCategoryKey),
      }
      : null;

    this.ngZone.run(() => this.onBatchStatusChange(status));
  }

  private buildArcGraphic(arc: AnimatedArcDescriptor): any {
    return {
      geometry: {
        type: 'polyline',
        paths: arc.surfacePaths,
        spatialReference: { wkid: 4326 },
      },
      attributes: this.buildArcAttributes(arc, 'arc'),
      symbol: {
        type: 'simple-line',
        color: [...arc.color, 0.92],
        width: 1,
        cap: 'round',
        join: 'round',
      },
    };
  }

  private buildSurfaceGraphic(arc: AnimatedArcDescriptor): any {
    return {
      geometry: {
        type: 'polyline',
        paths: arc.surfacePaths,
        spatialReference: { wkid: 4326 },
      },
      attributes: this.buildArcAttributes(arc, 'arc-surface'),
      symbol: {
        type: 'simple-line',
        color: [...arc.color, 0.58],
        width: Math.min(3.2, 1.5 + (arc.weight * 0.18)),
      },
    };
  }

  private buildEndpointGraphic(arc: AnimatedArcDescriptor, point: [number, number, number], role: string, size: number, opacity: number): any {
    return {
      geometry: {
        type: 'point',
        longitude: point[0],
        latitude: point[1],
        spatialReference: { wkid: 4326 },
      },
      attributes: this.buildArcAttributes(arc, role),
      symbol: {
        type: 'picture-marker',
        url:'/assets/images/shared/flag.svg',
        width: '18px',
        height: '18px',
        color: [...arc.color, opacity],
        outline: {
          color: [255, 255, 255, 0.84],
          width: 1.2,
        },
      },
    };
  }

  private buildMovingDotGraphic(arc: AnimatedArcDescriptor, point: [number, number, number]): any {
    const movingDotSize = Math.min(16, this.movingDotBaseSize + (arc.weight * 0.32));

    return {
      geometry: {
        type: 'point',
        longitude: point[0],
        latitude: point[1],
        spatialReference: { wkid: 4326 },
      },
      attributes: this.buildArcAttributes(arc, 'arc-traveler'),
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        size: movingDotSize,
        color: [255, 255, 255, 0.96],
        outline: {
          color: [...arc.color, 1],
          width: 0.75,
        },
      },
    };
  }

  private buildArcAttributes(arc: AnimatedArcDescriptor, role: string): Record<string, unknown> {
    return {
      role,
      category: arc.categoryKey,
      category_label: arc.categoryLabel,
      country_a: arc.countryAKey,
      country_b: arc.countryBKey,
      start_country: arc.countryAName,
      end_country: arc.countryBName,
      weight: arc.weight,
    };
  }
}
