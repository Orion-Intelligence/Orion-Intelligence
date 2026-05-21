import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Inject, Input, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SatelliteGeocodeResult } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { GeocodeService } from './geocode.service';

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
  coordsError:     string | null = null;
  deltaError:      string | null = null;
  activeInputMode: 'search' | 'manual' = 'search';

  @Input()  isOpen      = false;
  @Input()  isScanning  = false;
  @Input()  coordinates = '';
  @Input()  delta       = 0.05;

  @Output() close              = new EventEmitter<void>();
  @Output() coordinatesChange  = new EventEmitter<string>();
  @Output() deltaChange        = new EventEmitter<number>();
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
      this.manualDelta  = this.delta;
      this.searchQuery  = '';
      this.searchResults = [];
      this.searchError   = null;
      this.coordsError   = null;
      this.deltaError    = null;
    }
  }

  @HostListener('keydown.escape')
  onEsc(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchError   = null;
    this.searchResults = [];
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
    this.manualDelta   = result.delta;
    this.searchQuery   = result.name;
    this.searchResults = [];
    this.coordinatesChange.emit(coords);
    this.deltaChange.emit(result.delta);
  }

  onManualCoordsChange(): void {
    this.coordsError = this.geocodeService.validateCoordinatesInput(this.manualCoords);
  }

  onManualDeltaChange(): void {
    this.deltaError = this.geocodeService.validateDeltaInput(this.manualDelta);
  }

  onSubmit(): void {
    this.onManualCoordsChange();
    this.onManualDeltaChange();
    if (this.coordsError || this.deltaError) {
      return;
    }
    if (!this.manualCoords.trim()) {
      return;
    }
    this.coordinatesChange.emit(this.manualCoords.trim());
    this.deltaChange.emit(this.manualDelta);
    this.search.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
