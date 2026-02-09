import { Component, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, HostListener, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ActivatedRoute } from '@angular/router';
import { HeatmapReportComponent } from "./heatmap-report/heatmap-report.component";
import { AppService } from '../../../services/core/app/app.service';

type CountryData = {
  id: string;
  name: string;
  value: number;
}

@Component({
  selector: 'app-world-heatmap',
  imports: [NgIf, HeatmapReportComponent],
  standalone: true,
  templateUrl: './world-heatmap.component.html',
  styleUrls: ['./world-heatmap.component.css']
})
export class WorldHeatmapComponent implements AfterViewInit, OnChanges, OnInit {
  @ViewChild('mapContainer') private chartContainer!: ElementRef;

  lowColor: string = '#e0f3f8';
  highColor: string = '#084594';
  neutralColor: string = '#f5f5f5';

  public activeCountryName: string = '';
  public leakCountryReports: any;
  public selectedCountryReports: any;
  public mapData: CountryData[] = []
  public isOpenCountryReport: boolean = false;

  private svg: any;
  private projection: any;
  private path: any;
  private tooltip: any;
  private worldData: any;

  constructor(private route: ActivatedRoute, private appService: AppService) { }
  ngOnInit(): void {
    const data = this.route.snapshot.data['insights'];
    this.leakCountryReports = data.country_insight
    this.mapData = this.gettingUniqueCountrys();
  }
  async ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && !changes['data'].firstChange) {
      this.updateColors();
    }
  }


  private createChart() {
    this.worldData = this.appService.worldJson();
    if (!this.worldData) return;
    const element = this.chartContainer.nativeElement;
    const width = element.offsetWidth;
    const height = width * 0.5;

    d3.select(element).selectAll('*').remove();

    this.svg = d3.select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g');

    this.projection = d3.geoMercator()
      .scale(width / (2 * Math.PI))
      .translate([width / 2, height / 1.5]);

    this.path = d3.geoPath().projection(this.projection);

    this.tooltip = d3.select('body').append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0);

    const countries = topojson.feature(this.worldData, this.worldData.objects.countries) as any;

    this.svg.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', 'country')
      .style('stroke', '#fff')
      .style('stroke-width', '0.5px')
      .on('mousemove', (event: any, d: any) => {
        const countryName = d.properties.name;
        const countryId = d.id;
        const record = this.mapData.find(item => item.name === countryName || item.id === countryId);

        this.tooltip.transition().duration(100).style('opacity', 1);
        this.tooltip.html(`
          <strong>${countryName}</strong><br/>
          Value: ${record ? record.value : 'N/A'}
        `)
          .style('left', (event.pageX + 15) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(300).style('opacity', 0);
      })
      .on('click', (event: any, d: any) => {
        const name = d.properties.name;
        this.openCountryReport(name);
      });

    this.updateColors();
  }

  private updateColors() {
    if (!this.svg || this.mapData.length === 0) return;

    const values = this.mapData.map(d => d.value);
    const min = d3.min(values) || 0;
    const max = d3.max(values) || 100;

    const colorScale = d3.scaleLinear<string>()
      .domain([min, max])
      .range([this.lowColor, this.highColor]);

    this.svg.selectAll('path')
      .transition()
      .duration(750)
      .style('fill', (d: any) => {
        const record = this.mapData.find(item => item.name === d.properties.name);
        return record ? colorScale(record.value) : this.neutralColor;
      });
  }

  @HostListener('window:resize')
  onResize() {
    this.createChart();
  }

  private gettingUniqueCountrys(): CountryData[] {
    const documents = this.leakCountryReports as { m_country?: string[] }[];

    const countryCounts: Record<string, number> = {};

    documents.forEach(doc => {
      if (doc.m_country && Array.isArray(doc.m_country)) {
        doc.m_country.forEach((countryString: string) => {
          if (countryString) {
            const countries = countryString.split(',').map((c: string) => c.trim());
            countries.forEach((country: string) => {
              if (country) {
                countryCounts[country] = (countryCounts[country] || 0) + 1;
              }
            });
          }
        });
      }
    });

    const mapData: CountryData[] = Object.entries(countryCounts).map(
      ([country, count]: [string, number]) => ({
        id: country,
        name: country,
        value: count
      })
    );

    return mapData;
  }
  private openCountryReport(name: string) {
    this.selectedCountryReports = this.getReportsByCountry(name);
    this.isOpenCountryReport = true;
  }
  getReportsByCountry(country: string): any[] {

    const reports = this.leakCountryReports ?? [];

    if (!country) return [];

    const searchCountry = country.toLowerCase();

    return reports.filter((report: any) => {

      const mCountry = report?.m_country;

      if (!mCountry) return false;

      if (Array.isArray(mCountry)) {

        return mCountry.some((c: any) => {

          return String(c)
            .split(',')
            .some((part: string) =>
              part.trim().toLowerCase() === searchCountry
            );

        });

      }
      if (typeof mCountry === 'string') {

        return mCountry
          .split(',')
          .some((part: string) =>
            part.trim().toLowerCase() === searchCountry
          );
      }

      return false;
    });
  }
  closeCountryReport() {
    this.isOpenCountryReport = false;
  }
}