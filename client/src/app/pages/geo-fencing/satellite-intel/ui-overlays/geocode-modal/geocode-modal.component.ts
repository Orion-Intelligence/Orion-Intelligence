import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Inject, Input, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SatelliteGeocodeResult } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { GeocodeService } from './geocode.service';

type GeocodeModalMode = 'satellite' | 'threatLens';

@Component({
  selector:    'app-satellite-geocode-modal',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './geocode-modal.component.html',
})
export class GeocodeModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  private searchTimer?: ReturnType<typeof setTimeout>;

  searchQuery      = '';
  searchResults:   SatelliteGeocodeResult[] = [];
  isSearching      = false;
  searchError:     string | null = null;
  manualCoords     = '';
  manualDelta      = 0.05;
  manualRadiusKm   = 100;
  manualMaxIps     = 200;
  coordsError:     string | null = null;
  coverageError:   string | null = null;
  activeInputMode: 'search' | 'coordinates' = 'search';
  hasSelectedSearchLocation = false;
  readonly maxIpsLimit = 500;
  readonly maxCoverageKmLimit = 1000;

  @Input()  isOpen      = false;
  @Input()  isScanning  = false;
  @Input()  coordinates = '';
  @Input()  delta       = 0.05;
  @Input()  allowCoverage = true;
  @Input()  mode: GeocodeModalMode = 'satellite';
  @Input()  title = 'Satellite Location';
  @Input()  radiusKm    = 100;
  @Input()  maxRadiusKm = 50000;
  @Input()  maxIps      = 200;
  @Input()  distanceMode: 'delta' | 'radius' = 'delta';

  @Output() close              = new EventEmitter<void>();
  @Output() coordinatesChange  = new EventEmitter<string>();
  @Output() deltaChange        = new EventEmitter<number>();
  @Output() radiusKmChange     = new EventEmitter<number>();
  @Output() maxIpsChange       = new EventEmitter<number>();
  @Output() search             = new EventEmitter<void>();

  constructor(private elementRef: ElementRef<HTMLElement>, private renderer: Renderer2, @Inject(DOCUMENT) private document: Document, private geocodeService: GeocodeService) {}

  ngAfterViewInit(): void {
    this.renderer.appendChild(this.document.body, this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
    if (this.document.body.contains(this.elementRef.nativeElement)) {
      this.renderer.removeChild(this.document.body, this.elementRef.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.manualCoords = this.coordinates;
      this.manualDelta = this.getInitialDelta();
      this.manualRadiusKm = this.deltaToRadiusKm(this.manualDelta);
      this.manualMaxIps = Math.min(this.maxIpsLimit, this.maxIps);
      this.searchQuery  = '';
      this.searchResults = [];
      this.searchError   = null;
      this.coordsError   = null;
      this.coverageError = null;
      this.activeInputMode = 'search';
      this.hasSelectedSearchLocation = false;
    }
  }

  @HostListener('keydown.escape')
  onEsc(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchError   = null;
    this.searchResults = [];
    this.hasSelectedSearchLocation = false;
    if (this.searchQuery.trim().length < 2) {
      return;
    }
    this.isSearching = true;
    this.searchTimer = setTimeout(() => this.runSearch(), 400);
  }

  async runSearch(): Promise<void> {
    if (!this.searchQuery.trim()) {
      return;
    }
    this.isSearching = true;
    this.searchError = null;
    try {
      const response = await this.geocodeService.fetchGeocodeOnce(this.searchQuery.trim());
      const results = response?.results ?? [];
      this.searchResults = results;
      if (!results.length) {
        this.searchError = `No results for "${this.searchQuery}"`;
      }
    }
    catch (err: any) {
      this.searchError = err?.message || 'Search failed';
    }
    finally {
      this.isSearching = false;
    }
  }

  selectResult(result: SatelliteGeocodeResult): void {
    const coords = `${result.lat}, ${result.lon}`;
    this.manualCoords  = coords;
    this.searchQuery   = result.name;
    this.searchResults = [];
    this.hasSelectedSearchLocation = true;
    this.setCoverageFromDelta(result.delta);
    this.coordinatesChange.emit(coords);
    if (this.isThreatLensMode) {
      this.radiusKmChange.emit(this.manualRadiusKm);
    }
    else {
      this.deltaChange.emit(this.manualDelta);
    }
  }

  onManualCoordsChange(): void {
    this.coordsError = this.geocodeService.validateCoordinatesInput(this.manualCoords);
  }

  onManualCoverageChange(): void {
    if (!this.allowCoverage) {
      this.coverageError = null;
      return;
    }
    const delta = Number(this.manualDelta);
    this.coverageError = this.validateCoverageDelta(delta);
    if (!this.coverageError) {
      this.manualRadiusKm = this.deltaToRadiusKm(delta);
    }
  }

  onManualMaxIpsChange(): void {
    const maxIps = Math.round(Number(this.manualMaxIps));
    if (Number.isFinite(maxIps)) {
      this.manualMaxIps = Math.min(this.maxIpsLimit, Math.max(1, maxIps));
    }
  }

  onSubmit(): void {
    this.onManualCoordsChange();
    this.onManualCoverageChange();
    if (this.coordsError || this.coverageError) {
      return;
    }
    if (!this.manualCoords.trim()) {
      return;
    }
    this.coordinatesChange.emit(this.manualCoords.trim());
    if (this.allowCoverage && this.isThreatLensMode) {
      this.radiusKmChange.emit(this.deltaToRadiusKm(this.manualDelta));
      this.maxIpsChange.emit(Math.min(this.maxIpsLimit, Math.max(1, Math.round(this.manualMaxIps))));
    }
    if (this.allowCoverage && !this.isThreatLensMode) {
      this.deltaChange.emit(this.manualDelta);
    }
    this.search.emit();
  }

  get isThreatLensMode(): boolean {
    return this.mode === 'threatLens' || this.distanceMode === 'radius';
  }

  get showMaxIps(): boolean {
    return this.isThreatLensMode;
  }

  get effectiveMaxCoverageKm(): number {
    return this.isThreatLensMode ? Math.min(this.maxCoverageKmLimit, this.maxRadiusKm) : this.maxCoverageKmLimit;
  }

  get effectiveMaxDelta(): number {
    return Number((this.effectiveMaxCoverageKm / 111.32).toFixed(4));
  }

  get minDelta(): number {
    return 0.001;
  }

  get coverageLabelValue(): string {
    const coverageKm = this.deltaToCoverageKm(this.manualDelta);
    if (!Number.isFinite(coverageKm)) {
      return '';
    }
    const rounded = Number(coverageKm.toFixed(1));
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} km`;
  }

  get canApplyLocation(): boolean {
    if (!this.manualCoords.trim()) {
      return false;
    }
    return this.activeInputMode === 'coordinates' || this.hasSelectedSearchLocation;
  }

  private getInitialDelta(): number {
    if (this.isThreatLensMode) {
      return this.coverageKmToDelta(this.radiusKm);
    }
    return this.clampDelta(this.delta);
  }

  private setCoverageFromDelta(delta: number): void {
    this.manualDelta = this.clampDelta(delta);
    this.manualRadiusKm = this.deltaToRadiusKm(this.manualDelta);
  }

  private deltaToRadiusKm(delta: number): number {
    const coverageKm = this.deltaToCoverageKm(delta);
    if (!Number.isFinite(coverageKm)) {
      return 0;
    }
    return Math.min(this.effectiveMaxCoverageKm, Math.max(0.1, Number(coverageKm.toFixed(3))));
  }

  private deltaToCoverageKm(delta: number): number {
    return Number(delta) * 111.32;
  }

  private validateCoverageDelta(delta: number): string | null {
    if (!Number.isFinite(delta) || delta < this.minDelta || delta > this.effectiveMaxDelta) {
      return `Coverage size must be between ${this.minDelta} and ${this.effectiveMaxDelta.toFixed(3)} degrees (~${this.effectiveMaxCoverageKm.toLocaleString()} km)`;
    }
    return null;
  }

  private coverageKmToDelta(coverageKm: number): number {
    return this.clampDelta(Number((this.clampCoverageKm(coverageKm) / 111.32).toFixed(4)));
  }

  private clampDelta(value: number): number {
    const next = Number(value);
    if (!Number.isFinite(next)) {
      return this.minDelta;
    }
    return Math.min(this.effectiveMaxDelta, Math.max(this.minDelta, next));
  }

  private clampCoverageKm(value: number): number {
    const next = Number(value);
    if (!Number.isFinite(next)) {
      return 1;
    }
    return Math.min(this.effectiveMaxCoverageKm, Math.max(1, next));
  }
}
