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
import { NgIf } from '@angular/common';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ActivatedRoute } from '@angular/router';
import { HeatmapReportComponent } from './heatmap-report/heatmap-report.component';
import { AppService } from '../../../services/core/app/app.service';

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
  ) {}

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
      .selectAll<SVGPathElement, any>('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', this.path as any)
      .attr('class', 'country')
      .on('mousemove', (event: MouseEvent, d: any) => this.onHoverMove(event, d))
      .on('mouseleave', (event: MouseEvent) => this.onHoverOut(event))
      .on('click', (_: MouseEvent, d: any) => this.onCountryClick(d));

    this.updateColors();
  }

  private getValueForFeature(d: any): number | null {
    const name = d?.properties?.name?.toLowerCase().trim();
    return name ? this.valueByName.get(name) ?? null : null;
  }

  private getColorScale() {
    const max = Math.max(...this.mapData.map(d => d.value), 1);
    return d3
      .scaleSequential(
        d3.interpolateHslLong('hsl(0,30%,20%)', 'hsl(0,55%,40%)')
      )
      .domain([0, max]);
  }

  private updateColors(): void {
    const color = this.getColorScale();
    this.mapG.selectAll<SVGPathElement, any>('path')
      .attr('fill', (d: any) => {
        const v = this.getValueForFeature(d);
        return v == null ? this.neutralFill : color(v);
      });
  }

  private onHoverMove(event: MouseEvent, d: any): void {
    const name = d?.properties?.name ?? '';
    const v = this.getValueForFeature(d);

    this.mapG.selectAll('path').classed('hovered', false);
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
