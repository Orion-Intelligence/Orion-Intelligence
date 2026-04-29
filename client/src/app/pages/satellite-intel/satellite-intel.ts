import { Component, HostListener, Input, OnDestroy, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SatelliteIntelService } from './satellite-intel-service.service';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { GeocodeModalComponent } from './components/geocode-modal/geocode-modal.component';
import { MapSectionComponent } from './map-section/map-section.component';
import { TrackingMapSectionComponent } from './tracking-map-section/tracking-map-section.component';
import { MonthCompareSectionComponent } from './month-compare-section/month-compare-section.component';
import { AnomalySectionComponent } from './anomaly-section/anomaly-section.component';
import { SentinelSearchSectionComponent } from './sentinel-search-section/sentinel-search-section.component';
import { SentinelImageSectionComponent } from './sentinel-image-section/sentinel-image-section.component';
import { SatelliteFacilitiesResponse, SatelliteAnomalyResponse, SatelliteCompareResponse, SatelliteSentinelImageResult, SatelliteSentinelSearchResponse, SatelliteGeocodeResult, SatelliteLiveAircraft, SatelliteLiveShip, } from '../../shared/model/satellite-intel/satellite-intel-api.models';
import { ThreatLensComponent } from "../threat-lens/threat-lens";
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OrionSatelliteService } from './orion-satellite.service';
import { ORION_INFRASTRUCTURE_FILTERS, ORION_POWER_FILTERS, OrionSatelliteFeature, OrionSatelliteFeatureType } from './model/satellite-intel.model';

@Component({
  selector:    'app-satellite-intel',
  templateUrl: './satellite-intel.html',
  standalone:  true,
  host:        {
    'class': 'flex h-full min-h-0 w-full flex-1',
  },
  imports: [
    CommonModule,
    FormsModule,
    GeocodeModalComponent,
    MapSectionComponent,
    TrackingMapSectionComponent,
    MonthCompareSectionComponent,
    AnomalySectionComponent,
    SentinelSearchSectionComponent,
    SentinelImageSectionComponent,
    ThreatLensComponent
  ],
  animations: [fadeInDashboardItem],
})
export class SatelliteIntel implements OnInit, OnDestroy {
  private sub?: Subscription;
  private aircraftTrackSub?: Subscription;
  private shipTrackSub?: Subscription;
  private aircraftTimer?: ReturnType<typeof setInterval>;
  private shipsTimer?: ReturnType<typeof setInterval>;
  private pendingRequest: 'facilities' | 'anomaly' | 'compare' | 'sentinel' | 'sentinel-image' | null = null;
  private skipNextMapMovedEvent = false;
  private mainLoadingSequence = 0;
  private mainLoadingRequests = new Map<number, { title: string; message: string }>();
  private wriSub?: Subscription;
  private facilitiesSub?: Subscription;
  private dashboardSearchSub?: Subscription;
  private readonly dashboardSearch$ = new Subject<string>();

  readonly progressSegments = Array.from({ length: 20 }, (_, i) => i);
  readonly powerFilters = ORION_POWER_FILTERS;
  readonly infrastructureFilters = ORION_INFRASTRUCTURE_FILTERS;
  readonly panelTabs = [ { id: 'dashboard', label: 'Dashboard' },{ id: 'compare', label: 'Compare' }, { id: 'anomaly', label: 'Anomaly' }, { id: 'sentinel', label: 'Sentinel' }, { id: 'image', label: 'Image' }, { id: 'facilities', label: 'Facilities' }, ] as const;
  activePanel: 'dashboard' |'compare' | 'anomaly' | 'sentinel' | 'image' | 'facilities' = 'compare';
  activeTab: 'map' | 'tracking' | 'threat' = 'map';
  coordsForm = { value: '', delta: 0.05 };
  formError:  string | null = null;
  inputLat   = 50.0;
  inputLon   = 8.5;
  inputDelta = 2.5;
  selectedLayer: 'esri' | 'osm' = 'esri';
  facilitiesVisible = true;
  aircraftTrackingEnabled = false;
  shipsTrackingEnabled = false;
  globalAircraftTrackingEnabled = false;
  globalShipsTrackingEnabled = false;
  trackingError: string | null = null;
  aircraftData: SatelliteLiveAircraft[] = [];
  shipsData: SatelliteLiveShip[] = [];
  dashboardSearch = '';
  dashboardSearchResults: OrionSatelliteFeature[] = [];
  wriData: OrionSatelliteFeature[] = [];
  facilitiesMapData: OrionSatelliteFeature[] = [];
  mergedData: OrionSatelliteFeature[] = [];
  filteredData: OrionSatelliteFeature[] = [];
  selectedFilters: OrionSatelliteFeatureType[] = [...ORION_POWER_FILTERS.map(f => f.key), ...ORION_INFRASTRUCTURE_FILTERS.map(f => f.key)];
  focusedFeature: OrionSatelliteFeature | null = null;
  selectedFeature: OrionSatelliteFeature | null = null;
  searchQuery = '';
  searchResults: SatelliteGeocodeResult[] = [];
  lat:   number | null = null;
  lon:   number | null = null;
  delta                = 0.05;
  facilitiesData:  SatelliteFacilitiesResponse['result'] | null = null;
  anomalyResult:   SatelliteAnomalyResponse['result']    | null = null;
  compareResult:   SatelliteCompareResponse['result']    | null = null;
  sentinelImageResult: SatelliteSentinelImageResult | null = null;
  sentinelResults: SatelliteSentinelSearchResponse['result'] | null = null;
  hasSearched  = false;
  currentStep  = '';
  showGeocodeModal = false;
  isMainLoading = false;
  mainLoadingTitle = 'Loading Satellite Intel';
  mainLoadingMessage = 'Please wait while the request completes...';
  selectedTrackingTypes: ('aircraft' | 'ship')[] = ['aircraft'];
  isTrackingDropdownOpen = false;
  isPanelMenuOpen = false;
  isPanelPopupOpen = false;
  isScanning = computed(() =>
    !!this.pendingRequest && !this.satelliteService.onError(),);

  @Input() toolbarMode: 'hidden' | 'geo' = 'hidden';

  constructor( public satelliteService: SatelliteIntelService,private orionSatelliteService: OrionSatelliteService, private route: ActivatedRoute ) {
    effect(() => {
      const done = this.satelliteService.onDone();
      if (!done) {
        return;
      }
      const result = (done?.result !== null && done?.result !== undefined) ? done.result : done;
      if (!result) {
        return;
      }

      const pending = this.pendingRequest;

      if (pending === 'facilities' || (!pending && this.looksLikeFacilitiesResult(result))) {
        const facData = (result?.features !== undefined) ? result : (result?.result?.features !== undefined ? result.result : result);
        this.facilitiesData = facData;
      }
      else if (pending === 'anomaly' || (!pending && this.looksLikeAnomalyResult(result))) {
        const anomalyData = (result?.months !== undefined) ? result : (result?.result?.months !== undefined ? result.result : result);
        this.anomalyResult = anomalyData;
      }
      else if (pending === 'sentinel' || (!pending && this.looksLikeSentinelResult(result))) {
        const sentinelData = (result?.results !== undefined) ? result : (result?.result?.results !== undefined ? result.result : result);
        this.sentinelResults = sentinelData;
      }
      else if (pending === 'sentinel-image' || (!pending && this.looksLikeSentinelImageResult(result))) {
        const imageData = (result?.image_url !== undefined || result?.data_url !== undefined) ? result : (result?.result ? result.result : result);
        this.sentinelImageResult = imageData;
      }
      else if (pending === 'compare' || (!pending && this.looksLikeCompareResult(result))) {
        const compareData = (result?.months !== undefined) ? result : (result?.result?.months !== undefined ? result.result : result);

        this.compareResult = compareData;
      }

      this.pendingRequest = null;
      this.currentStep = '';
    });
  }

  ngOnInit(): void {
    this.satelliteService.resetState();
    this.wriSub = this.orionSatelliteService.loadWRI().subscribe({
      next: (data) => {
        this.wriData = data; this.refreshMergedData();
      },
    });
    this.dashboardSearchSub = this.dashboardSearch$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((query) => {
      this.updateDashboardSearchResults(query);
    });
    this.setPanel('compare');
    const section = this.route.snapshot.queryParamMap.get('section');
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() || '';
    if (section) {
      this.activePanel = section as any;
    }
    if (q) {
      this.coordsForm.value = q;
      const parsed = this.satelliteService.parseCoordinates(q);
      if (parsed) {
        this.inputLat = parsed.lat;
        this.inputLon = parsed.lon;
      }
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.aircraftTrackSub?.unsubscribe();
    this.shipTrackSub?.unsubscribe();
    clearInterval(this.aircraftTimer);
    clearInterval(this.shipsTimer);
    this.wriSub?.unsubscribe();
    this.facilitiesSub?.unsubscribe();
    this.dashboardSearchSub?.unsubscribe();
    this.satelliteService.cancelCurrentScan();
  }

  get isMapView(): boolean {
    return this.activeTab === 'map';
  }

  get isTrackingView(): boolean {
    return this.activeTab === 'tracking';
  }

  get isThreatView(): boolean {
    return this.activeTab === 'threat';
  }

  get showTopBar(): boolean {
    return this.toolbarMode !== 'hidden';
  }

  setPanel(id: typeof this.activePanel): void {
    this.activePanel = id;

    this.satelliteService.resetState();
    this.pendingRequest = null;
    this.currentStep = '';
  }

  goToCoords(): void {
    this.syncAppliedViewport();
    this.hasSearched = true;
    this.loadFacilities();
    this.refreshTracking();
  }

  onDeltaChange(): void {
    this.delta = this.inputDelta;
  }

  onLayerChange(): void { /* handled by map-section input */ }

  setActiveView(view: 'map' | 'tracking' | 'threat'): void {
    this.activeTab = view;
    this.isPanelMenuOpen = false;
    this.isPanelPopupOpen = false;
    if (view === 'tracking') {
      this.selectedTrackingTypes = ['aircraft'];
      this.handleTrackingSelection();
    }
  }

  get activePanelLabel(): string {
    const tab = this.panelTabs.find((entry) => entry.id === this.activePanel);
    return tab?.label ?? 'Panel';
  }

  setLayer(layer: 'esri' | 'osm'): void {
    this.selectedLayer = layer;
    this.onLayerChange();
  }

  togglePanelMenu(): void {
    this.isPanelMenuOpen = !this.isPanelMenuOpen;
  }

  openPanelPopup(id: typeof this.activePanel): void {
    this.setPanel(id);
    this.isPanelPopupOpen = true;
    this.isPanelMenuOpen = false;
  }

  closePanelPopup(): void {
    this.isPanelPopupOpen = false;
  }

  toggleFacilities(): void {
    this.facilitiesVisible = !this.facilitiesVisible;
    if (this.facilitiesVisible) {
      this.syncAppliedViewport();
      if (!this.facilitiesMapData.length) {
        this.loadFacilities();
      }
    }
    this.refreshMergedData();
  }

  isSelected(type: 'aircraft' | 'ship'): boolean {
    return this.selectedTrackingTypes.includes(type);
  }

  getTrackingLabel(): string {
    if (this.selectedTrackingTypes.length === 0) {
      return 'Select Tracking';
    }

    if (this.selectedTrackingTypes.length === 2) {
      return 'Aircraft + Ship';
    }

    return this.selectedTrackingTypes[0] === 'aircraft'
      ? 'Aircraft'
      : 'Ship';
  }

  onTrackingSelectionChange(type: 'aircraft' | 'ship', event: any): void {
    const checked = event.target.checked;

    if (checked) {
      if (!this.selectedTrackingTypes.includes(type)) {
        this.selectedTrackingTypes.push(type);
      }
    }
    else {
      this.selectedTrackingTypes = this.selectedTrackingTypes.filter(t => t !== type);
    }

    this.handleTrackingSelection();
  }

  private handleTrackingSelection(): void {
    this.trackingError = null;

    this.aircraftTrackSub?.unsubscribe();
    this.shipTrackSub?.unsubscribe();
    clearInterval(this.aircraftTimer);
    clearInterval(this.shipsTimer);

    this.aircraftData = [];
    this.shipsData = [];

    if (this.selectedTrackingTypes.includes('aircraft')) {
      this.refreshGlobalAircraftTracking(true);
      this.aircraftTimer = setInterval(() => {
        this.refreshGlobalAircraftTracking(false);
      }, 25000);
    }

    if (this.selectedTrackingTypes.includes('ship')) {
      this.refreshGlobalShipsTracking(true);
      this.shipsTimer = setInterval(() => {
        this.refreshGlobalShipsTracking(false);
      }, 8000);
    }
  }

  toggleTrackingDropdown(): void {
    this.isTrackingDropdownOpen = !this.isTrackingDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.tracking-dropdown')) {
      this.isTrackingDropdownOpen = false;
    }
    if (!target.closest('.map-overlay-menu')) {
      this.isPanelMenuOpen = false;
    }
  }

  runAnomalyScan(): void {
    this.syncAppliedViewport();
    const lat = this.lat ?? this.inputLat;
    const lon = this.lon ?? this.inputLon;
    if (!lat || !lon) {
      return;
    }
    this.lat = lat;
    this.lon = lon;
    this.setPanel('anomaly');
    this.anomalyResult = null;
    this.hasSearched = true;
    this.pendingRequest = 'anomaly';
    this.satelliteService.resetState();
    this.sub?.unsubscribe();
    const loadingId = this.beginMainLoading('Loading Satellite Intel', 'Running anomaly scan...');
    this.sub = this.satelliteService.runAnomalyScan(this.lat, this.lon, this.delta).subscribe({
      next: (res) => {
        this.anomalyResult = res.result;
        if(res.result){
          this.endMainLoading(loadingId);
        }
      },
      error: () => {
        this.endMainLoading(loadingId);
      }
    });
  }

  copyCoords(): void {
    navigator.clipboard?.writeText(`${this.inputLat.toFixed(5)}, ${this.inputLon.toFixed(5)}`).catch(() => {});
  }

  openGeocodeModal(): void {
    this.showGeocodeModal = true;
  }

  selectSearchResult(r: SatelliteGeocodeResult): void {
    this.inputLat   = r.lat;
    this.inputLon   = r.lon;
    this.inputDelta = r.delta;
    this.searchQuery = r.name;
    this.searchResults = [];
    this.lat   = r.lat;
    this.lon   = r.lon;
    this.delta = r.delta;
    this.coordsForm.value = `${r.lat}, ${r.lon}`;
    this.coordsForm.delta = r.delta;
    this.hasSearched = true;
    this.loadFacilities();
  }

  closeSearchDrop(): void {
    this.searchResults = [];
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  onMapMoved(center: { lat: number; lon: number; zoom: number }): void {
    if (this.skipNextMapMovedEvent) {
      this.skipNextMapMovedEvent = false;
      return;
    }

    this.inputLat = center.lat;
    this.inputLon = center.lon;
    this.inputDelta = this.zoomToDelta(center.zoom);
    this.coordsForm.value = `${center.lat.toFixed(5)}, ${center.lon.toFixed(5)}`;
    this.coordsForm.delta = this.inputDelta;

    if (!this.aircraftTrackingEnabled && !this.shipsTrackingEnabled) {
      this.refreshTracking();
    }
  }

  onRunCompare(event: { imageType: string }): void {
    this.syncAppliedViewport();
    const lat = this.lat ?? this.inputLat;
    const lon = this.lon ?? this.inputLon;
    if (!lat || !lon) {
      this.pendingRequest = null;
      return;
    }
    this.lat = lat;
    this.lon = lon;
    this.compareResult = null;
    this.hasSearched = true;
    this.pendingRequest = 'compare';
    this.satelliteService.resetState();
    this.sub?.unsubscribe();
    const loadingId = this.beginMainLoading('Loading Satellite Intel', 'Loading 3-month comparison...');
    this.sub = this.satelliteService.runCompare(this.lat, this.lon, this.delta, event.imageType).subscribe({
      next: (res) => {
        console.log("1")
        this.compareResult = res.result;
        if(res.result){
          this.endMainLoading(loadingId);
        }
      },
      error: () => {
        console.log("2")
        this.endMainLoading(loadingId);
      }
    });
  }

  onRunSentinelSearch(): void {
    this.syncAppliedViewport();
    const lat = this.lat ?? this.inputLat;
    const lon = this.lon ?? this.inputLon;
    if (!lat || !lon) {
      return;
    }
    this.lat = lat;
    this.lon = lon;
    this.sentinelResults = null;
    this.hasSearched = true;
    this.pendingRequest = 'sentinel';
    this.satelliteService.resetState();
    this.sub?.unsubscribe();
    const loadingId = this.beginMainLoading('Loading Satellite Intel', 'Checking available Sentinel passes...');
    this.sub = this.satelliteService.searchSentinel(this.lat, this.lon, this.delta).subscribe({
      next: (res) => {
        this.sentinelResults = res.result;
        if(res.result){
          this.endMainLoading(loadingId);
        }
      },
      error: () => {
        this.endMainLoading(loadingId);
      }
    });;
  }

  onRunSentinelImage(event: { imageType: string; month: string; size: number }): void {
    this.syncAppliedViewport();
    const lat = this.lat ?? this.inputLat;
    const lon = this.lon ?? this.inputLon;
    if (!lat || !lon) {
      return;
    }
    this.lat = lat;
    this.lon = lon;
    this.sentinelImageResult = null;
    this.hasSearched = true;
    this.pendingRequest = 'sentinel-image';
    this.satelliteService.resetState();
    this.sub?.unsubscribe();
    const loadingId = this.beginMainLoading('Loading Satellite Intel', 'Fetching Sentinel image...');
    this.sub = this.satelliteService.fetchSentinelImage(this.lat, this.lon, this.delta, event.imageType, event.month, event.size).subscribe({
      next: (res) => {
        this.sentinelImageResult = res.result || null;
        if(res.result){
          this.endMainLoading(loadingId);
        }
      },
      error: () => {
        this.endMainLoading(loadingId);
      }
    });
    this.sub.add(() => this.endMainLoading(loadingId));
  }

  onCoordinatesChange(coords: string): void {
    this.coordsForm.value = coords;
    const parsed = this.satelliteService.parseCoordinates(coords);
    if (parsed) {
      this.inputLat = parsed.lat; this.inputLon = parsed.lon;
    }
  }

  onDeltaChangeModal(delta: number): void {
    this.coordsForm.delta = delta;
    this.inputDelta = delta;
    this.delta = delta;
  }

  onGeoSearch(): void {
    this.showGeocodeModal = false;
    const parsed = this.satelliteService.parseCoordinates(this.coordsForm.value);
    if (!parsed) {
      return;
    }
    this.inputLat  = parsed.lat;
    this.inputLon  = parsed.lon;
    this.lat       = parsed.lat;
    this.lon       = parsed.lon;
    this.delta     = this.coordsForm.delta;
    this.inputDelta = this.coordsForm.delta;
    this.hasSearched = true;
    this.loadFacilities();
  }

  onDashboardSearchInput(query: string): void {
    this.dashboardSearch = query;
    this.dashboardSearch$.next(query.trim().toLowerCase());
  }

  clearDashboardSearch(): void {
    this.dashboardSearch = '';
    this.dashboardSearchResults = [];
    this.focusedFeature = null;
    this.dashboardSearch$.next('');
  }

  toggleDashboardFilter(type: OrionSatelliteFeatureType): void {
    if (this.selectedFilters.includes(type)) {
      this.selectedFilters = this.selectedFilters.filter(e => e !== type);
    }
    else {
      this.selectedFilters = [...this.selectedFilters, type];
    }
    this.refreshMergedData();
  }

  isFilterSelected(type: OrionSatelliteFeatureType): boolean {
    return this.selectedFilters.includes(type);
  }

  typeDotClass(type: OrionSatelliteFeatureType): string {
    const map: Record<string, string> = {
      hydro: 'bg-[#2563eb]', nuclear: 'bg-[#dc2626]', coal: 'bg-[#111827]',
      oil: 'bg-[#f97316]', gas: 'bg-[#6b7280]', industrial: 'bg-[#6b7280]',
      other: 'bg-[#6b7280]', solar: 'bg-[#facc15]', wind: 'bg-[#16a34a]',
      airport: 'bg-[#9333ea]', port: 'bg-[#0d9488]', warehouse: 'bg-[#92400e]',
    };
    return map[type] || 'bg-[#6b7280]';
  }

  focusDashboardFeature(feature: OrionSatelliteFeature): void {
    this.selectedFeature = feature;
    this.focusedFeature = feature;
    this.dashboardSearchResults = [];
    this.dashboardSearch = feature.name;
  }

  onMapFeatureSelected(feature: OrionSatelliteFeature): void {
    this.selectedFeature = feature;
    this.focusedFeature = feature;
  }

  filterCount(type: OrionSatelliteFeatureType): number {
    return this.orionSatelliteService.filterByType(this.mergedData, type).length;
  }

  get visiblePowerCount(): number {
    return this.filteredData.filter(f => f.source === 'WRI').length;
  }

  get visibleInfrastructureCount(): number {
    return this.filteredData.filter(f => f.source === 'OSM').length;
  }

  cancel(): void {
    this.satelliteService.cancelCurrentScan();
    this.mainLoadingRequests.clear();
    this.syncMainLoadingState();
  }

  facEntries(): [string, number][] {
    return Object.entries(this.facilitiesData?.type_counts || {}).sort((a, b) => b[1] - a[1]) as [string, number][];
  }

  get lastResultCount(): number {
    if (this.activePanel === 'facilities') {
      return this.facilitiesData?.total ?? 0;
    }
    if (this.activePanel === 'sentinel')   {
      return this.sentinelResults?.results?.length ?? 0;
    }
    if (this.activePanel === 'anomaly')    {
      return this.anomalyResult?.months?.filter((m: any) => m?.has_data).length ?? 0;
    }
    if (this.activePanel === 'compare')    {
      return this.compareResult?.months?.length ?? 0;
    }
    return 0;
  }

  public loadFacilities(): void {
    if (!this.lat || !this.lon || !this.facilitiesVisible) {
      this.facilitiesMapData = [];
      this.facilitiesData = null;
      this.refreshMergedData();
      return;
    }
    this.facilitiesSub?.unsubscribe();
    const loadingId = this.beginMainLoading('Loading Satellite Intel', 'Loading nearby facilities...');
    this.facilitiesSub = this.orionSatelliteService.loadFacilities(this.lat, this.lon, 5).subscribe({
      next: (items) => {
        this.facilitiesMapData = items;
        this.facilitiesData = {
          status: 'done', type: 'FeatureCollection', features: [],
          total: items.length,
          type_counts: this.buildFacilityTypeCounts(items),
          overpass_ok: true,
        };
        this.refreshMergedData();
        this.endMainLoading(loadingId);
      },
      error: () => {
        this.facilitiesMapData = [];
        this.facilitiesData = null;
        this.refreshMergedData();
        this.endMainLoading(loadingId);
      },
    });
  }

  private syncAppliedViewport(): void {
    this.lat = this.inputLat;
    this.lon = this.inputLon;
    this.delta = this.inputDelta;
    this.coordsForm.value = `${this.inputLat}, ${this.inputLon}`;
    this.coordsForm.delta = this.inputDelta;
  }

  private refreshTracking(showLoading = false): void {
    if (this.aircraftTrackingEnabled) {
      this.refreshAircraftTracking(showLoading);
    }
    if (this.shipsTrackingEnabled) {
      this.refreshShipsTracking(showLoading);
    }
  }

  private refreshAircraftTracking(showLoading = false): void {
    if (this.globalAircraftTrackingEnabled) {
      this.refreshGlobalAircraftTracking(showLoading);
      return;
    }

    const lat = this.inputLat;
    const lon = this.inputLon;
    const delta = this.inputDelta;
    const loadingId = showLoading ? this.beginMainLoading('Loading Satellite Intel', 'Loading aircraft tracking data...') : null;

    this.aircraftTrackSub?.unsubscribe();
    this.aircraftTrackSub = this.satelliteService.pollAircraftInBounds(lat, lon, delta).subscribe({
      next: (res) => {
        const payload = (res?.result ?? res) as any;
        this.aircraftData = Array.isArray(payload?.aircraft) ? payload.aircraft : [];
        if (payload?.error) {
          this.trackingError = `Aircraft tracking: ${payload.error}`;
        }
      },
      error: (err) => {
        this.trackingError = err?.error?.detail || err?.message || 'Aircraft tracking failed';
      },
    });
    this.aircraftTrackSub.add(() => {
      if (loadingId !== null) {
        this.endMainLoading(loadingId);
      }
    });
  }

  private refreshGlobalAircraftTracking(showLoading = false): void {
    const loadingId = showLoading ? this.beginMainLoading('Loading Satellite Intel', 'Loading global aircraft tracking data...') : null;
    this.aircraftTrackSub?.unsubscribe();
    this.aircraftTrackSub = this.satelliteService.pollAircraftGlobal().subscribe({
      next: (res) => {
        const payload = (res?.result ?? res) as any;
        this.aircraftData = Array.isArray(payload?.aircraft) ? payload.aircraft : [];
        if (payload?.error) {
          this.trackingError = `Global aircraft tracking: ${payload.error}`;
        }
      },
      error: (err) => {
        this.trackingError = err?.error?.detail || err?.message || 'Global aircraft tracking failed';
      },
    });
    this.aircraftTrackSub.add(() => {
      if (loadingId !== null) {
        this.endMainLoading(loadingId);
      }
    });
  }

  private refreshShipsTracking(showLoading = false): void {
    if (this.globalShipsTrackingEnabled) {
      this.refreshGlobalShipsTracking(showLoading);
      return;
    }

    const lat = this.inputLat;
    const lon = this.inputLon;
    const delta = this.inputDelta;
    const loadingId = showLoading ? this.beginMainLoading('Loading Satellite Intel', 'Loading ship tracking data...') : null;

    this.shipTrackSub?.unsubscribe();
    this.shipTrackSub = this.satelliteService.pollShipsInBounds(lat, lon, delta).subscribe({
      next: (res) => {
        const payload = (res?.result ?? res) as any;
        this.shipsData = Array.isArray(payload?.ships) ? payload.ships : [];
        if (payload?.error) {
          this.trackingError = `Ship tracking: ${payload.error}`;
        }
      },
      error: (err) => {
        this.trackingError = err?.error?.detail || err?.message || 'Ship tracking failed';
      },
    });
    this.shipTrackSub.add(() => {
      if (loadingId !== null) {
        this.endMainLoading(loadingId);
      }
    });
  }

  private refreshGlobalShipsTracking(showLoading = false): void {
    const loadingId = showLoading ? this.beginMainLoading('Loading Satellite Intel', 'Loading global ship tracking data...') : null;
    this.shipTrackSub?.unsubscribe();
    this.shipTrackSub = this.satelliteService.pollShipsGlobal().subscribe({
      next: (res) => {
        const payload = (res?.result ?? res) as any;
        this.shipsData = Array.isArray(payload?.ships) ? payload.ships : [];
        if (payload?.error) {
          this.trackingError = `Global ship tracking: ${payload.error}`;
        }
      },
      error: (err) => {
        this.trackingError = err?.error?.detail || err?.message || 'Global ship tracking failed';
      },
    });
    this.shipTrackSub.add(() => {
      if (loadingId !== null) {
        this.endMainLoading(loadingId);
      }
    });
  }

  private beginMainLoading(title: string, message: string): number {
    const id = ++this.mainLoadingSequence;
    this.mainLoadingRequests.set(id, { title, message });
    this.syncMainLoadingState();
    return id;
  }

  private endMainLoading(id: number): void {
    console.log("end1")
    if (!this.mainLoadingRequests.has(id)) {
      return;
    }
    console.log("end2")
    this.mainLoadingRequests.delete(id);
    this.syncMainLoadingState();
  }

  private syncMainLoadingState(): void {
    const requests = Array.from(this.mainLoadingRequests.values());
    const latestRequest = requests.length ? requests[requests.length - 1] : null;
    this.isMainLoading = this.mainLoadingRequests.size > 0;
    if (!latestRequest) {
      this.mainLoadingTitle = 'Loading Satellite Intel';
      this.mainLoadingMessage = 'Please wait while the request completes...';
      return;
    }
    this.mainLoadingTitle = latestRequest.title;
    this.mainLoadingMessage = latestRequest.message;
  }

  private zoomToDelta(zoom: number): number {
    if (zoom >= 17) {
      return 0.005;
    }
    if (zoom >= 16) {
      return 0.01;
    }
    if (zoom >= 15) {
      return 0.02;
    }
    if (zoom >= 14) {
      return 0.04;
    }
    if (zoom >= 13) {
      return 0.08;
    }
    if (zoom >= 12) {
      return 0.15;
    }
    if (zoom >= 11) {
      return 0.3;
    }
    if (zoom >= 10) {
      return 0.6;
    }
    return 1.2;
  }

  private refreshMergedData(): void {
    this.mergedData = this.facilitiesVisible
      ? [...this.wriData, ...this.facilitiesMapData]
      : [...this.wriData];
    this.filteredData = this.mergedData.filter(f => this.selectedFilters.includes(f.type));
    this.updateDashboardSearchResults(this.dashboardSearch.trim().toLowerCase());
  }

  private updateDashboardSearchResults(query: string): void {
    if (!query.trim()) {
      this.dashboardSearchResults = []; return;
    }
    this.dashboardSearchResults = this.filteredData
      .filter(f => f.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }

  private buildFacilityTypeCounts(items: OrionSatelliteFeature[]): Record<string, number> {
    return items.reduce<Record<string, number>>((counts, item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
      return counts;
    }, {});
  }

  private looksLikeFacilitiesResult(result: any): boolean {
    return !!result && Array.isArray(result.features) && typeof result.total === 'number';
  }

  private looksLikeAnomalyResult(result: any): boolean {
    return !!result && Array.isArray(result.months) && typeof result.alert_level === 'string';
  }

  private looksLikeCompareResult(result: any): boolean {
    return !!result && Array.isArray(result.months) && typeof result.image_type === 'string';
  }

  private looksLikeSentinelResult(result: any): boolean {
    return !!result && Array.isArray(result.results) && Array.isArray(result.bbox);
  }

  private looksLikeSentinelImageResult(result: any): boolean {
    return !!result && (
      typeof result.image_url === 'string' ||
      typeof result.data_url === 'string' ||
      typeof result.image_base64 === 'string' ||
      typeof result.image_type === 'string'
    );
  }
}
