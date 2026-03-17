import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { AppService } from '../../../../services/core/app/app.service';

@Component({
  selector: 'app-geo-coordinates-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geo-coordinates-modal.component.html',
})
export class GeoCoordinatesModalComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;
  private projection: d3.GeoProjection | null = null;

  readonly radiusOptions = [5, 10, 25, 50, 100];
  readonly maxIpOptions = [50, 100, 200, 500];
  readonly minZoomLevel = 1;
  readonly maxZoomLevel = 4;
  coordinateInputMode: 'map' | 'manual' = 'map';
  zoomLevel = 1;

  @Input() isOpen = false;
  @Input() isScanning = false;
  @Input() coordinates = '';
  @Input() radiusKm = 25;
  @Input() maxIps = 200;

  @Output() close = new EventEmitter<void>();
  @Output() coordinatesChange = new EventEmitter<string>();
  @Output() radiusKmChange = new EventEmitter<number>();
  @Output() maxIpsChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<void>();

  get parsedCoordinates(): { lat: number; lon: number } | null {
    return this.parseCoordinates(this.coordinates);
  }

  constructor(private appService: AppService) {
  }

  ngAfterViewInit(): void {
    this.queueRenderMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.queueRenderMap();
    }
  }

  get mapMarkerPoint(): { x: number; y: number } | null {
    const parsed = this.parsedCoordinates;
    if (!parsed || !this.projection) {
      return null;
    }

    const point = this.projection([parsed.lon, parsed.lat]);
    if (!point) {
      return null;
    }

    return { x: point[0], y: point[1] };
  }

  onClose(): void {
    this.close.emit();
  }

  onSearch(): void {
    this.search.emit();
  }

  setCoordinateInputMode(mode: 'map' | 'manual'): void {
    this.coordinateInputMode = mode;
  }

  onMapSelect(event: MouseEvent): void {
    const projection = this.projection;
    if (!projection || typeof projection.invert !== 'function' || !this.mapContainer?.nativeElement) {
      return;
    }

    const rect = this.mapContainer.nativeElement.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
    const inverted = projection.invert([x, y]);
    if (!inverted) {
      return;
    }

    const [lon, lat] = inverted;

    this.coordinatesChange.emit(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
  }

  zoomIn(): void {
    if (this.zoomLevel >= this.maxZoomLevel) {
      return;
    }
    this.zoomLevel = Math.min(this.maxZoomLevel, this.zoomLevel + 0.5);
    this.renderMap();
  }

  zoomOut(): void {
    if (this.zoomLevel <= this.minZoomLevel) {
      return;
    }
    this.zoomLevel = Math.max(this.minZoomLevel, this.zoomLevel - 0.5);
    this.renderMap();
  }

  onMapWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
      return;
    }
    this.zoomOut();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isOpen) {
      this.queueRenderMap();
    }
  }

  private parseCoordinates(value: string): { lat: number; lon: number } | null {
    const parts = value.split(',').map((part) => part.trim());
    if (parts.length !== 2) {
      return null;
    }

    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return null;
    }

    return { lat, lon };
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  private queueRenderMap(): void {
    setTimeout(() => this.renderMap(), 0);
  }

  private renderMap(): void {
    if (!this.isOpen || !this.mapContainer?.nativeElement) {
      return;
    }

    const worldData = this.appService.worldJson();
    if (!worldData) {
      setTimeout(() => this.renderMap(), 100);
      return;
    }

    const container = this.mapContainer.nativeElement;
    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 220);
    d3.select(container).selectAll('*').remove();

    const svg = d3.select(container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'h-full w-full');

    const baseScale = width / (2 * Math.PI);
    this.projection = d3
      .geoMercator()
      .scale(baseScale * this.zoomLevel)
      .translate([width / 2, height / 1.58]);

    const path = d3.geoPath(this.projection);
    const countries = topojson.feature(worldData, worldData.objects.countries) as any;

    svg.append('g')
      .selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('d', path as any)
      .attr('fill', 'rgba(87,165,235,0.16)')
      .attr('stroke', 'rgba(87,165,235,0.24)')
      .attr('stroke-width', 0.8);
  }
}
