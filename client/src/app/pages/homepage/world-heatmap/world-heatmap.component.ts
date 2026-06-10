import { Component, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, HostListener, OnInit, OnDestroy, input } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ActivatedRoute } from '@angular/router';
import { HeatmapReportComponent } from './heatmap-report/heatmap-report.component';
import { AppService } from '../../../services/core/app/app.service';
import { ApiService } from '../../../shared/services/api.service';
import { InsightCacheService } from '../../../shared/services/insight-cache.service';
import { CountryData, CountryInsightPageResponse } from '../../../shared/model/homepage/country-insight.model';
import { MapLoadingBadgesComponent } from '../../../shared/partials/map-loading-badges/map-loading-badges.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-world-heatmap',
  imports: [HeatmapReportComponent, MapLoadingBadgesComponent, TranslatePipe],
  standalone: true,
  templateUrl: './world-heatmap.component.html',
})
export class WorldHeatmapComponent implements AfterViewInit, OnChanges, OnInit, OnDestroy {
  @ViewChild('mapContainer') private chartContainer!: ElementRef;
  private allCategoryReports: any;
  private rotationTimer: any;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private mapG!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private projection!: d3.GeoProjection;
  private path!: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private worldData: any;
  private categoryOrder = [ 'leak', 'generic', 'exploit', 'chat', 'social', 'defacement' ];
  private valueByName = new Map<string, number>();
  private selectedName: string | null = null;
  private neutralFill = 'rgba(23,34,53,0.45)';
  private readonly tooltipBaseClass = 'heatmap-tooltip pointer-events-none absolute z-[5] max-w-[240px] rounded-[8px] border border-[rgb(239_68_68_/18%)] bg-[#0b1a2e] px-[10px] py-[6px] text-[12px] leading-[1.25] text-[#fecaca] shadow-[0_18px_46px_rgb(0_0_0_/45%)] [backdrop-filter:blur(6px)] [body.light-theme_&]:border-[#d7e2ee] [body.light-theme_&]:bg-[rgb(255_255_255_/95%)] [body.light-theme_&]:text-[#172235] [body.light-theme_&]:shadow-[0_8px_20px_rgb(16_24_40_/12%)] [body.light-theme_&]:[backdrop-filter:none]';
  private readonly tooltipHiddenClass = `${this.tooltipBaseClass} opacity-0`;
  private readonly tooltipVisibleClass = `${this.tooltipBaseClass} heatmap-tooltip-visible opacity-100`;
  private readonly countryClass = 'country [stroke:rgb(255_255_255_/14%)] [stroke-width:0.7px] transition-[opacity] duration-200 ease-in-out hover:opacity-90 hover:[stroke:rgb(255_255_255_/50%)] [&.hovered]:opacity-90 [&.hovered]:[stroke:rgb(255_255_255_/50%)] [body.light-theme_&]:[stroke:rgb(23_34_53_/18%)] [body.light-theme_&:hover]:[stroke:rgb(23_34_53_/38%)] [body.light-theme_&.hovered]:[stroke:rgb(23_34_53_/38%)]';
  private readonly pixelGridLineClass = 'pointer-events-none [stroke:rgb(255_255_255_/4%)] [stroke-width:0.5px] [body.light-theme_&]:[stroke:rgb(23_34_53_/7%)]';
  private selectedCountryPage = 1;
  private readonly countryReportLimit = 20;

  readonly canOpenReports = input<boolean>(true);
  public activeCountryReports: any;
  public activeCategoryKey: string | null = null;
  public selectedCountryReports: any[] = [];
  public mapData: CountryData[] = [];
  public isOpenCountryReport = false;
  public isCountryReportLoading = false;
  public isCountryReportLoadingMore = false;
  public hasMoreCountryReports = false;
  public isMapLoading = true;

  private isLightTheme(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }
    return document.body.classList.contains('light-theme') || document.documentElement.classList.contains('light-theme');
  }

  private getLegendColors(): { title: string; tick: string; tickLabel: string; border: string } {
    if (this.isLightTheme()) {
      return {
        title: '#0f172a',
        tick: 'rgba(15, 23, 42, 0.45)',
        tickLabel: '#1f2e47',
        border: 'rgba(15, 23, 42, 0.22)',
      };
    }

    return {
      title: 'rgba(226, 232, 240, 0.96)',
      tick: 'rgba(226, 232, 240, 0.52)',
      tickLabel: '#ffffff',
      border: 'rgba(255, 255, 255, 0.24)',
    };
  }

  constructor(private route: ActivatedRoute, private appService: AppService, private apiService: ApiService, private insightCacheService: InsightCacheService) {
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data['insights'];
    if (data) {
      this.applyInsightData(data);
      return;
    }
    this.insightCacheService.getInsight().subscribe(data => {
      this.applyInsightData(data); 
    });
  }

  ngAfterViewInit(): void {
    window.requestAnimationFrame(() => {
      this.appService.loadWorldJson();
      this.waitForWorldJsonAndRender();
    });
  }

  ngOnDestroy(): void {
    this.tooltip?.remove();
    this.stopCategoryRotation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.buildIndex();
      if (!this.mapG || !this.svg) {
        return;
      }
      this.refreshMapPresentation(false);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.appService.worldJson()) {
      return;
    }
    this.createChart();
  }

  private waitForWorldJsonAndRender(): void {
    if (this.appService.worldJson()) {
      this.createChart();
      this.startCategoryRotation();
      this.isMapLoading = false;
      return;
    }
    window.setTimeout(() => {
      this.waitForWorldJsonAndRender(); 
    }, 50);
  }

  private getAvailableCategories(): string[] {
    return this.categoryOrder.filter(cat => this.allCategoryReports?.[cat] &&
          this.allCategoryReports[cat].length > 0);
  }

  private applyInsightData(data: any): void {
    this.allCategoryReports = data.country_insight;
    this.activeCategoryKey = null;
    this.buildIndex();
    if (this.mapG && this.svg) {
      this.startCategoryRotation();
    }
  }

  private buildIndex(): void {
    this.valueByName.clear();
    for (const d of this.mapData) {
      const key = d.name?.toLowerCase().trim();
      if (key) {
        this.valueByName.set(key, d.value);
      }
    }
  }

  private startCategoryRotation(): void {
    const available = this.getAvailableCategories();
    if (!available.length) {
      return;
    }
    this.stopCategoryRotation();
    let index = 0;
    const switchCategory = () => {
      this.activeCategoryKey = available[index];
      this.activeCountryReports = this.allCategoryReports[this.activeCategoryKey];
      this.mapData = this.gettingUniqueCountrys();
      this.buildIndex();
      this.refreshMapPresentation(true);
      index = (index + 1) % available.length;
    };
    switchCategory();
    this.rotationTimer = setInterval(() => {
      switchCategory();
    }, 8000);
  }

  private ensureLegendDefs(): void {
    if (!this.svg) {
      return;
    }
    const defs = this.svg.select('defs').empty()
      ? this.svg.append('defs')
      : this.svg.select('defs');
    defs.select('#legend-gradient').remove();
    const grad = defs.append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    const stops = [
      { offset: '0%', color: '#4a2530' },
      { offset: '25%', color: '#682636' },
      { offset: '50%', color: '#8a273d' },
      { offset: '75%', color: '#b22945' },
      { offset: '100%', color: '#df2d4f' },
    ];
    for (const stop of stops) {
      grad.append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color);
    }
  }

  private updateLegend(): void {
    if (!this.svg || !this.chartContainer) {
      return;
    }
    const chartContainerElement = this.chartContainer.nativeElement as HTMLElement;
    const width = chartContainerElement.offsetWidth || 800;
    const isMobile = width <= 768;
    this.ensureLegendDefs();
    const legendColors = this.getLegendColors();
    const values = this.mapData.map(d => d.value).filter(v => v != null);
    const max = Math.max(...values, 1);
    const legend = this.svg.selectAll<SVGGElement, any>('g.legend').data([0]).join('g').attr('class', 'legend');
    const pad = isMobile ? 16 : 14;
    const barW = isMobile ? 128 : 180;
    const barH = isMobile ? 8 : 10;
    const legendX = isMobile ? 35 : width - pad - barW - 25;
    const legendY = isMobile ? 44 : pad + 6;
    const titleSize = isMobile ? 10 : 11;
    const tickSize = isMobile ? 10 : 11;
    legend.attr('transform', `translate(${legendX},${legendY})`);
    const title = legend.selectAll<SVGTextElement, any>('text.legend-title')
      .data([this.activeCategoryKey])
      .join('text')
      .attr('class', 'legend-title')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', titleSize)
      .attr('font-weight', 600)
      .attr('fill', legendColors.title);
    title
      .transition()
      .duration(400)
      .attr('opacity', 0)
      .transition()
      .duration(400)
      .attr('opacity', 1)
      .text(d => d?.toUpperCase() ?? '');
    legend.selectAll<SVGRectElement, any>('rect.legend-bar')
      .data([0])
      .join('rect')
      .attr('class', 'legend-bar')
      .attr('x', 0)
      .attr('y', 8)
      .attr('width', barW)
      .attr('height', barH)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', legendColors.border)
      .attr('stroke-width', 1)
      .attr('fill', 'url(#legend-gradient)');
    const ticks = [0, Math.round(max * 0.33), Math.round(max * 0.66), max];
    const tickSelection = legend
      .selectAll<SVGLineElement, number>('line.legend-tick')
      .data(ticks);
    tickSelection.join(enter => enter.append('line')
      .attr('class', 'legend-tick')
      .attr('y1', 8 + barH)
      .attr('y2', 8 + barH + 6)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('stroke', legendColors.tick)
      .attr('stroke-width', 1)
      .transition()
      .duration(600)
      .attr('x1', d => (d / max) * barW)
      .attr('x2', d => (d / max) * barW), update => update
      .attr('stroke', legendColors.tick)
      .attr('stroke-width', 1)
      .transition()
      .duration(600)
      .attr('x1', d => (d / max) * barW)
      .attr('x2', d => (d / max) * barW), exit => exit.remove());
    legend.selectAll<SVGTextElement, number>('text.legend-tick-label')
      .data(ticks)
      .join(enter => enter.append('text')
        .attr('class', 'legend-tick-label')
        .attr('y', 8 + barH + 18)
        .attr('font-size', tickSize)
        .attr('font-weight', 500)
        .attr('text-anchor', 'middle')
        .attr('fill', legendColors.tickLabel)
        .attr('opacity', 1)
        .attr('opacity', 0)
        .transition()
        .duration(600)
        .attr('opacity', 1)
        .attr('x', d => (d / max) * barW)
        .text(d => String(d)), update => update
        .attr('fill', legendColors.tickLabel)
        .attr('opacity', 1)
        .attr('font-size', tickSize)
        .attr('font-weight', 500)
        .transition()
        .duration(600)
        .attr('x', d => (d / max) * barW)
        .text(d => String(d)), exit => exit.remove());
  }

  private updateActiveCategoryLabel(): void {
    if (!this.svg || !this.chartContainer) {
      return;
    }
    const chartContainerElement = this.chartContainer.nativeElement as HTMLElement;
    const width = chartContainerElement.offsetWidth || 800;
    const isMobile = width <= 768;
    const labelX = isMobile ? 35 : 33;
    const labelY = isMobile ? 22 : 28;
    const labelSize = isMobile ? 12 : 14;
    const labelSpacing = isMobile ? 0.6 : 0.8;
    const labelG = this.svg.selectAll<SVGGElement, any>('g.map-type').data([0]).join('g').attr('class', 'map-type');
    labelG.attr('transform', `translate(${labelX},${labelY})`).attr('pointer-events', 'none');
    labelG.selectAll<SVGTextElement, any>('text.map-type-text')
      .data([this.activeCategoryKey])
      .join('text')
      .attr('class', 'map-type-text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', labelSize)
      .attr('font-weight', 700)
      .attr('letter-spacing', labelSpacing)
      .attr('fill', 'var(--color-text1)')
      .text(d => `HEATMAP: ${(d ?? '').toUpperCase()}`);
  }

  private createChart(): void {
    this.worldData = this.appService.worldJson();
    if (!this.worldData) {
      return;
    }
    const chartContainerElement = this.chartContainer.nativeElement as HTMLElement;
    const width = chartContainerElement.offsetWidth || 800;
    const height = chartContainerElement.offsetHeight || Math.min(Math.max(Math.round(width * 0.52), 400), Math.round(window.innerHeight * 0.8));
    d3.select(chartContainerElement).selectAll('*').remove();
    this.tooltip = d3
      .select(chartContainerElement)
      .append<HTMLDivElement>('div')
      .attr('class', this.tooltipHiddenClass);
    this.svg = d3
      .select(chartContainerElement)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`);
    this.mapG = this.svg.append('g');
    this.projection = d3
      .geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.55]);
    this.path = d3.geoPath(this.projection);
    const countries = topojson.feature(this.worldData, this.worldData.objects.countries) as any;
    this.mapG
      .selectAll<SVGPathElement, any>('path.country')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', this.path as any)
      .attr('class', this.countryClass)
      .classed('can-open-reports', this.canOpenReports())
      .classed('has-data', (d: any) => this.getValueForFeature(d) != null)
      .on('mousemove', (event: MouseEvent, d: any) => {
        this.onHoverMove(event, d); 
      })
      .on('mouseleave', (event: MouseEvent) => {
        this.onHoverOut(event); 
      })
      .on('click', (_: MouseEvent, d: any) => {
        if (this.getValueForFeature(d) == null) {
          return;
        }
        this.onCountryClick(d);
      });
    const gridSize = 24;
    const gridG = this.mapG.append('g').attr('class', 'pixel-grid');
    for (let x = 0; x <= width; x += gridSize) {
      gridG.append('line')
        .attr('class', this.pixelGridLineClass)
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      gridG.append('line')
        .attr('class', this.pixelGridLineClass)
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y);
    }
    this.refreshMapPresentation(false);
  }

  private getValueForFeature(d: any): number | null {
    const name = d?.properties?.name?.toLowerCase().trim();
    return name ? this.valueByName.get(name) ?? null : null;
  }

  private getColorScale() {
    const values = this.mapData.map(d => d.value).filter(v => v != null).sort(d3.ascending);
    const q = d3.scaleQuantile<number, number>()
      .domain(values)
      .range(d3.range(0, 7));
    const ramp = ['#4a2530', '#5a2533', '#6d2637', '#82273b', '#9a2840', '#b62a46', '#d92d4d'];
    return (v: number) => {
      const index = q(v);
      return ramp[index];
    };
  }

  private updateColors(): void {
    const color = this.getColorScale();
    this.mapG.selectAll<SVGPathElement, any>('path.country')
      .classed('can-open-reports', this.canOpenReports())
      .classed('has-data', (d: any) => this.getValueForFeature(d) != null)
      .classed('is-clickable', (d: any) => this.canOpenReports() && this.getValueForFeature(d) != null)
      .attr('fill', (d: any) => {
        const v = this.getValueForFeature(d);
        return v == null ? this.neutralFill : color(v);
      });
  }

  private onHoverMove(event: MouseEvent, d: any): void {
    const name = d?.properties?.name ?? '';
    const v = this.getValueForFeature(d);
    this.mapG.selectAll('path.country').classed('hovered', false);
    d3.select(event.currentTarget as SVGPathElement).classed('hovered', true);
    this.tooltip.selectAll('*').remove();
    this.tooltip.append('div').text(name);
    this.tooltip.append('div').text(`Leaks: ${v ?? 'N/A'}`);
    const chartContainerElement = this.chartContainer.nativeElement as HTMLElement;
    const rect = chartContainerElement.getBoundingClientRect();
    const tooltipElement = this.tooltip.node() as HTMLDivElement | null;
    const tipW = tooltipElement?.offsetWidth ?? 160;
    const tipH = tooltipElement?.offsetHeight ?? 44;
    let x = event.clientX - rect.left + 12;
    let y = event.clientY - rect.top + 12;
    if (x + tipW > rect.width - 8) {
      x = event.clientX - rect.left - tipW - 12;
    }
    if (y + tipH > rect.height - 8) {
      y = event.clientY - rect.top - tipH - 12;
    }
    if (x < 8) {
      x = 8;
    }
    if (y < 8) {
      y = 8;
    }
    const left = this.normalizePositionValue(x);
    const top = this.normalizePositionValue(y);
    this.tooltip
      .attr('class', this.tooltipVisibleClass)
      .attr('data-left', String(left))
      .attr('data-top', String(top));
  }

  private onHoverOut(event: MouseEvent): void {
    d3.select(event.currentTarget as SVGPathElement).classed('hovered', false);
    this.tooltip
      .attr('class', this.tooltipHiddenClass);
  }

  private onCountryClick(d: any): void {
    if (!this.canOpenReports()) {
      return;
    }
    const name = d?.properties?.name;
    if (!name) {
      return;
    }
    this.selectedName = name.toLowerCase();
    this.openCountryReport();
  }

  public getReportsByCountry(country: string): any[] {
    const normalizedTarget = (country || '').trim().toLowerCase();
    if (!normalizedTarget || !Array.isArray(this.activeCountryReports)) {
      return [];
    }

    return this.activeCountryReports.filter((report: any) => {
      const countries = Array.isArray(report?.m_country) ? report.m_country : [];
      return countries.some((entry: string) => String(entry || '')
        .split(',')
        .map((part) => part.trim().toLowerCase())
        .includes(normalizedTarget));
    });
  }

  private gettingUniqueCountrys(): CountryData[] {
    const counts: Record<string, number> = {};
    this.activeCountryReports?.forEach((doc: any) => {
      doc?.m_country?.forEach((c: string) => {
        c.split(',').map(x => x.trim()).forEach(cc => {
          counts[cc] = (counts[cc] || 0) + 1;
        });
      });
    });
    return Object.entries(counts).map(([name, value]) => ({
      id: name,
      name,
      value
    }));
  }

  private openCountryReport(): void {
    this.isOpenCountryReport = true;
    this.resetCountryReportState();
    void this.fetchCountryReportsPage(1, false);
  }

  closeCountryReport(): void {
    this.isOpenCountryReport = false;
    this.selectedName = null;
    this.resetCountryReportState();
    this.setCountryReportLoadingState(false, false);
  }

  async loadMoreCountryReports(): Promise<void> {
    if (!this.hasMoreCountryReports || this.isCountryReportLoadingMore || !this.selectedName) {
      return;
    }
    await this.fetchCountryReportsPage(this.selectedCountryPage + 1, true);
  }

  private async fetchCountryReportsPage(page: number, append: boolean): Promise<void> {
    if (!this.selectedName || !this.activeCategoryKey) {
      return;
    }
    this.setCountryReportLoadingState(append, true);

    try {
      const params = new HttpParams()
        .set('category', this.activeCategoryKey)
        .set('country', this.selectedName)
        .set('page', String(page))
        .set('limit', String(this.countryReportLimit));
      const response = await firstValueFrom(this.apiService.get<CountryInsightPageResponse>('insight/country', { params }));
      const incomingItems = Array.isArray(response?.items) ? response.items : [];
      this.selectedCountryReports = append ? [...this.selectedCountryReports, ...incomingItems] : incomingItems;
      this.selectedCountryPage = response?.page ?? page;
      this.hasMoreCountryReports = Boolean(response?.has_more);
    }
    catch {
      if (!append) {
        this.selectedCountryReports = [];
      }
      this.hasMoreCountryReports = false;
    }
    finally {
      this.setCountryReportLoadingState(append, false);
    }
  }

  private animateMapTransition(): void {
    if (!this.mapG) {
      return;
    }
    const color = this.getColorScale();
    const getValueForFeature = this.getValueForFeature.bind(this);
    const neutralFill = this.neutralFill;
    const countries = this.mapG.selectAll<SVGPathElement, any>('path.country');
    countries
      .classed('can-open-reports', this.canOpenReports())
      .classed('has-data', (d: any) => getValueForFeature(d) != null)
      .classed('is-clickable', (d: any) => this.canOpenReports() && getValueForFeature(d) != null)
      .transition()
      .duration(1100)
      .ease(d3.easeCubicInOut)
      .attrTween('fill', function (this: SVGPathElement, d: any) {
        const v = getValueForFeature(d);
        const nextFill = v == null ? neutralFill : color(v);
        const currentFill = d3.select(this).attr('fill') || neutralFill;
        const interpolateFill = d3.interpolateRgb(currentFill, nextFill);
        return (t: number) => interpolateFill(t);
      });
  }

  private stopCategoryRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }
  }

  private refreshMapPresentation(animate: boolean): void {
    if (animate) {
      this.animateMapTransition();
    }
    else {
      this.updateColors();
    }
    this.updateLegend();
    this.updateActiveCategoryLabel();
  }

  private resetCountryReportState(): void {
    this.selectedCountryReports = [];
    this.selectedCountryPage = 1;
    this.hasMoreCountryReports = false;
  }

  private setCountryReportLoadingState(append: boolean, isLoading: boolean): void {
    if (append) {
      this.isCountryReportLoadingMore = isLoading;
      return;
    }
    this.isCountryReportLoading = isLoading;
  }

  private normalizePositionValue(rawValue: number): number {
    const step = 2;
    const rounded = Math.round(rawValue / step) * step;
    return Math.max(0, Math.min(4000, rounded));
  }
}
