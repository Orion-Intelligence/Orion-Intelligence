import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Inject, Input, OnChanges, OnDestroy, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs/operators';
import { SatelliteIntelService } from '../../satellite-intel-service.service';
import { SatelliteGeocodeResult } from '../../model/satellite-intel.model';

@Component({
  selector:    'app-satellite-geocode-modal',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './geocode-modal.component.html',
})
// eslint-disable-next-line local/class-field-group-spacing
export class GeocodeModalComponent implements AfterViewInit, OnInit, OnChanges, OnDestroy {
  @Input()  isOpen      = false;
  @Input()  isScanning  = false;
  @Input()  coordinates = '';
  @Input()  delta       = 0.05;
  @Output() close              = new EventEmitter<void>();
  @Output() coordinatesChange  = new EventEmitter<string>();
  @Output() deltaChange        = new EventEmitter<number>();
  @Output() search             = new EventEmitter<void>();
  private readonly searchInput$ = new Subject<string>();
  private searchSub?: Subscription;
  private latestSearchRequestId = 0;
  searchQuery      = '';
  searchResults:   SatelliteGeocodeResult[] = [];
  isSearching      = false;
  searchError:     string | null = null;
  manualCoords     = '';
  manualDelta      = 0.05;
  coordsError:     string | null = null;
  deltaError:      string | null = null;
  activeInputMode: 'search' | 'manual' = 'search';

  constructor(private satelliteService: SatelliteIntelService, private elementRef: ElementRef<HTMLElement>, private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

  ngOnInit(): void {
    this.searchSub = this.searchInput$.pipe(map((query) => query.trim()), debounceTime(400), distinctUntilChanged(), tap((query) => {
      this.searchError = null;
      if (query.length < 2) {
        this.isSearching = false;
        this.searchResults = [];
      }
    }), switchMap((query) => {
      if (query.length < 2) {
        return EMPTY;
      }

      const requestId = ++this.latestSearchRequestId;
      this.isSearching = true;

      return this.satelliteService.fetchGeocodeOnce(query).pipe(tap((res) => {
        const results = res?.results ?? [];
        this.searchResults = results;
        this.searchError = results.length ? null : `No results for "${query}"`;
      }),
      catchError((err: Error) => {
        this.searchResults = [];
        this.searchError = err?.message || 'Search failed';
        return EMPTY;
      }),
      finalize(() => {
        if (requestId === this.latestSearchRequestId) {
          this.isSearching = false;
        }
      }),);
    }),).subscribe();
  }

  ngAfterViewInit(): void {
    this.renderer.appendChild(this.document.body, this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    if (this.document.body.contains(this.elementRef.nativeElement)) {
      this.renderer.removeChild(this.document.body, this.elementRef.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.latestSearchRequestId++;
      this.manualCoords = this.coordinates;
      this.manualDelta  = this.delta;
      this.searchQuery  = '';
      this.searchResults = [];
      this.searchError   = null;
      this.isSearching   = false;
      this.coordsError   = null;
      this.deltaError    = null;
      this.searchInput$.next('');
    }
  }

  @HostListener('keydown.escape')
  onEsc(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onSearchInput(query: string): void {
    this.searchQuery = query;
    this.searchInput$.next(query);
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
    this.coordsError = this.satelliteService.validateCoordinatesInput(this.manualCoords);
  }

  onManualDeltaChange(): void {
    this.deltaError = this.satelliteService.validateDeltaInput(this.manualDelta);
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
