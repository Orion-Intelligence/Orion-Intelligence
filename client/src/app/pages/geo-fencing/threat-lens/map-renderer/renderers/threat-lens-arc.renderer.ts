import { NgZone } from '@angular/core';
import { AnimatedArcDescriptor, ThreatLensCategoryMapData } from '../../../models/geo-fencing.models';
import { buildArcPath, buildArcPathPoints, buildSurfacePath, collectArcPairs, getArcPointAtProgress, getFeatureAnchor } from '../../utils/threat-lens-map.utils';
import { ThreatLensArcRenderResult } from '../threat-lens-map.types';
import { ThreatLensCountryLayerRenderer } from './threat-lens-country-layer.renderer';

export class ThreatLensArcRenderer {
  private animatedArcs: AnimatedArcDescriptor[] = [];
  private animationFrame: number | null = null;
  private lastAnimationTick = 0;
  private batchAnimationStartTime = 0;
  private visibleBatchIndex = -1;
  private animationPaused = false;
  private movingDotGraphics: any[] = [];
  private startMarkerGraphics: any[] = [];
  private endMarkerGraphics: any[] = [];
  private readonly maxArcCount = 80;
  private readonly minArcWeight = 1;
  private readonly arcBatchSize = 5;
  private readonly arcBatchDuration = 6000;
  private readonly movingDotBaseSize = 90000;

  constructor( private ngZone: NgZone, private countryRenderer: ThreatLensCountryLayerRenderer, private arcGraphicsLayer: any, private arcSurfaceGraphicsLayer: any, private animatedArcGraphicsLayer: any, private geometryEngine: any, private webMercatorUtils: any, private toCountryKey: (value: string) => string, private onVisibleArcCountChange: (count: number) => void, ) {}

  render(categoryData: ThreatLensCategoryMapData[], activeCountryFilterKey: string): ThreatLensArcRenderResult {
    if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer || !this.animatedArcGraphicsLayer) {
      return { totalArcCount: 0, arcCountByCategory: new Map() };
    }

    this.stop();
    this.arcGraphicsLayer.removeAll();
    this.arcSurfaceGraphicsLayer.removeAll();
    this.animatedArcGraphicsLayer.removeAll();
    this.animatedArcs = [];
    this.visibleBatchIndex = -1;
    this.batchAnimationStartTime = 0;

    const arcCountByCategory = new Map();
    let totalArcCount = 0;

    for (const category of categoryData) {
      const pairs = collectArcPairs(category.documentCountryGroups,
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

    this.renderBatch(0);
    this.start();

    return {
      totalArcCount: Math.min(totalArcCount, this.arcBatchSize),
      arcCountByCategory,
    };
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
  }

  destroy(): void {
    this.stop();
    this.arcGraphicsLayer?.removeAll();
    this.arcSurfaceGraphicsLayer?.removeAll();
    this.animatedArcGraphicsLayer?.removeAll();
    this.animatedArcs = [];
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
          this.renderBatch(batch.index, batch.items);
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
              z,
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

  private getCurrentBatch(timestamp: number): { index: number; items: AnimatedArcDescriptor[] } {
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

  private renderBatch(index: number, batchItems?: AnimatedArcDescriptor[]): void {
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
      this.ngZone.run(() => this.onVisibleArcCountChange(0));
      return;
    }

    this.arcGraphicsLayer.addMany(items.map((arc) => this.buildArcGraphic(arc)));
    this.arcSurfaceGraphicsLayer.addMany(items.map((arc) => this.buildSurfaceGraphic(arc)));
    this.ngZone.run(() => this.onVisibleArcCountChange(items.length));
    this.movingDotGraphics = [];

    for (const arc of items) {
      this.startMarkerGraphics.push(this.buildEndpointGraphic(arc, arc.arcPoints[0], 'arc-start', 98000, 1));
      this.endMarkerGraphics.push(this.buildEndpointGraphic(arc, arc.arcPoints[arc.arcPoints.length - 1], 'arc-end', 98000, 0.88));
      this.movingDotGraphics.push(this.buildMovingDotGraphic(arc));
    }

    this.animatedArcGraphicsLayer.removeAll();
    this.animatedArcGraphicsLayer.addMany([
      ...this.startMarkerGraphics,
      ...this.endMarkerGraphics,
      ...this.movingDotGraphics,
    ]);
  }

  private buildArcGraphic(arc: AnimatedArcDescriptor): any {
    return {
      geometry: {
        type: 'polyline',
        hasZ: true,
        paths: arc.arcPaths,
        spatialReference: { wkid: 4326 },
      },
      attributes: this.buildArcAttributes(arc, 'arc'),
      symbol: {
        type: 'line-3d',
        symbolLayers: [
          {
            type: 'path',
            profile: 'quad',
            width: Math.min(22, 13 + (arc.weight * 0.9)),
            cap: 'round',
            material: { color: [...arc.color, 0.14] },
            anchor: 'center',
          },
          {
            type: 'path',
            profile: 'quad',
            width: Math.min(10, 4.6 + (arc.weight * 0.44)),
            cap: 'round',
            material: { color: [...arc.color, 0.62] },
            anchor: 'center',
          },
          {
            type: 'path',
            profile: 'quad',
            width: Math.min(3.6, 2.4 + (arc.weight * 0.12)),
            cap: 'round',
            material: { color: [...arc.color, 0.92] },
            anchor: 'center',
          },
        ],
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
        z: point[2],
        spatialReference: { wkid: 4326 },
      },
      attributes: this.buildArcAttributes(arc, role),
      symbol: {
        type: 'point-3d',
        symbolLayers: [
          {
            type: 'object',
            resource: { primitive: 'sphere' },
            width: size * 1.6,
            height: size * 1.6,
            depth: size * 1.6,
            material: { color: [...arc.color, 0.18] },
          },
          {
            type: 'object',
            resource: { primitive: 'sphere' },
            width: size * 0.72,
            height: size * 0.72,
            depth: size * 0.72,
            material: { color: [...arc.color, opacity] },
          },
        ],
      },
    };
  }

  private buildMovingDotGraphic(arc: AnimatedArcDescriptor): any {
    const movingDotSize = Math.min(120000, this.movingDotBaseSize + (arc.weight * 2200));
    return {
      geometry: null,
      attributes: this.buildArcAttributes(arc, 'arc-traveler'),
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
          },
        ],
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
