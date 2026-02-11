import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  OnInit,
  OnDestroy
} from '@angular/core';
import {NgIf} from '@angular/common';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import {ActivatedRoute} from '@angular/router';
import {HeatmapReportComponent} from './heatmap-report/heatmap-report.component';
import {AppService} from '../../../services/core/app/app.service';

type CountryData = { id: string; name: string; value: number };

@Component({
  selector: 'app-world-heatmap',
  imports: [NgIf, HeatmapReportComponent],
  standalone: true,
  templateUrl: './world-heatmap.component.html'
})
export class WorldHeatmapComponent
  implements AfterViewInit, OnChanges, OnInit, OnDestroy {

  @ViewChild('mapContainer') private chartContainer!: ElementRef;

  public leakCountryReports: any;
  public selectedCountryReports: any;
  public mapData: CountryData[] = [];
  public isOpenCountryReport = false;

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private mapG!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private projection!: d3.GeoProjection;
  private path!: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private worldData: any;

  private valueByName = new Map<string, number>();
  private selectedName: string | null = null;

  private neutralFill = 'rgba(23,34,53,0.45)';

  constructor(
    private route: ActivatedRoute,
    private appService: AppService
  ) {
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data['insights'];
    this.leakCountryReports = data.country_insight;
    this.mapData = this.gettingUniqueCountrys();
    this.buildIndex();
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.tooltip?.remove();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.buildIndex();
      this.updateColors();
      this.updateLegend();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.createChart();
  }

  private buildIndex(): void {
    this.valueByName.clear();
    for (const d of this.mapData) {
      const key = d.name?.toLowerCase().trim();
      if (key) this.valueByName.set(key, d.value);
    }
  }

  private ensureLegendDefs(): void {
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

    const stops: Array<{ o: number; c: string }> = [
      {o: 0, c: 'hsl(0,30%,20%)'},
      {o: 100, c: 'hsl(0,55%,40%)'}
    ];

    grad.selectAll<SVGStopElement, { o: number; c: string }>('stop')
      .data(stops)
      .join('stop')
      .attr('offset', d => `${d.o}%`)
      .attr('stop-color', d => d.c);
  }

  private updateLegend(): void {
    const el = this.chartContainer.nativeElement as HTMLElement;
    const width = el.offsetWidth || 800;
    const height = Math.round(width * 0.52);

    this.ensureLegendDefs();

    const values = this.mapData.map(d => d.value).filter(v => v != null);
    const max = Math.max(...values, 1);

    const legend = this.svg.selectAll<SVGGElement, any>('g.legend').data([0]).join('g').attr('class', 'legend');

    const pad = 14;
    const barW = 180;
    const barH = 10;

    legend.attr('transform', `translate(${width - pad - barW - 25},${pad + 6})`);

    legend.selectAll<SVGTextElement, any>('text.legend-title')
      .data([0])
      .join('text')
      .attr('class', 'legend-title')
      .attr('x', 0)
      .attr('y', 0)
      .text('Leaks');

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
      .attr('fill', 'url(#legend-gradient)');

    const ticks = [0, Math.round(max * 0.33), Math.round(max * 0.66), max];

    legend.selectAll<SVGLineElement, number>('line.legend-tick')
      .data(ticks)
      .join('line')
      .attr('class', 'legend-tick')
      .attr('x1', d => (d / max) * barW)
      .attr('x2', d => (d / max) * barW)
      .attr('y1', 8 + barH)
      .attr('y2', 8 + barH + 6);

    legend.selectAll<SVGTextElement, number>('text.legend-tick-label')
      .data(ticks)
      .join('text')
      .attr('class', 'aend-tick-label')
      .attr('x', d => (d / max) * barW)
      .attr('y', 8 + barH + 18)
      .attr('text-anchor', (d, i) => i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle')
      .text(d => String(d));
  }

  private createChart(): void {
    this.worldData = this.appService.worldJson();
    if (!this.worldData) return;

    const el = this.chartContainer.nativeElement as HTMLElement;
    const width = el.offsetWidth || 800;
    const height = Math.round(width * 0.52);

    d3.select(el).selectAll('*').remove();

    this.tooltip = d3
      .select(el)
      .append<HTMLDivElement>('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', '0');

    this.svg = d3
      .select(el)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`);

    this.mapG = this.svg.append('g');

    this.projection = d3
      .geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.55]);

    this.path = d3.geoPath(this.projection);

    const countries = topojson.feature(
      this.worldData,
      this.worldData.objects.countries
    ) as any;

    this.mapG
      .selectAll<SVGPathElement, any>('path.country')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', this.path as any)
      .attr('class', 'country')
      .classed('has-data', (d: any) => this.getValueForFeature(d) != null)
      .on('mousemove', (event: MouseEvent, d: any) => this.onHoverMove(event, d))
      .on('mouseleave', (event: MouseEvent) => this.onHoverOut(event))
      .on('click', (_: MouseEvent, d: any) => {
        if (this.getValueForFeature(d) == null) return;
        this.onCountryClick(d);
      });

    const gridSize = 24;

    const gridG = this.mapG.append('g').attr('class', 'pixel-grid');

    for (let x = 0; x <= width; x += gridSize) {
      gridG.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height);
    }

    for (let y = 0; y <= height; y += gridSize) {
      gridG.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y);
    }

    this.updateColors();
    this.updateLegend();
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

    return (v: number) => {
      const t = q(v) / 6;
      return d3.interpolateHslLong('hsl(0,30%,20%)', 'hsl(0,55%,40%)')(t);
    };
  }

  private updateColors(): void {
    const color = this.getColorScale();
    this.mapG.selectAll<SVGPathElement, any>('path.country')
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

    this.tooltip
      .style('opacity', '1')
      .style('left', `${event.offsetX + 12}px`)
      .style('top', `${event.offsetY - 28}px`);
  }

  private onHoverOut(event: MouseEvent): void {
    d3.select(event.currentTarget as SVGPathElement).classed('hovered', false);
    this.tooltip.style('opacity', '0');
  }

  private onCountryClick(d: any): void {
    const name = d?.properties?.name;
    if (!name) return;
    this.selectedName = name.toLowerCase();
    this.openCountryReport(name);
  }

  private gettingUniqueCountrys(): CountryData[] {
    const counts: Record<string, number> = {};
    this.leakCountryReports?.forEach((doc: any) => {
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

  private openCountryReport(name: string): void {
    this.selectedCountryReports = this.getReportsByCountry(name);
    this.isOpenCountryReport = true;
  }

  getReportsByCountry(country: string): any[] {
    const key = country.toLowerCase();
    return this.leakCountryReports?.filter((r: any) =>
      r?.m_country?.some((c: string) =>
        c.split(',').some(p => p.trim().toLowerCase() === key)
      )
    ) ?? [];
  }

  closeCountryReport(): void {
    this.isOpenCountryReport = false;
    this.selectedName = null;
  }
}
