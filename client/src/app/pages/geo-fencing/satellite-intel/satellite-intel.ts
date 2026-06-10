import { Component, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { parseCoordinates } from '../../../shared/utils/geo-coordinates.utils';
import { SatelliteIntelService } from './satellite-intel-service';
import { GeoFencingGeocodeService } from '../shared/services/geo-fencing-geocode.service';
import { MapRendererComponent } from './map-renderer/map-renderer.component';
import { GeocodeModalComponent } from '../../../shared/partials/geocode-modal/geocode-modal.component';
import { MonthCompareSectionComponent } from './ui-overlays/month-compare-section/month-compare-section.component';
import { EntityDescriptionPopupComponent } from './ui-overlays/entity-description-popup/entity-description-popup.component';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ThreatLensComponent } from '../threat-lens/threat-lens';
import { OrionSatelliteDashboardFilter, OrionSatelliteFeature, OrionSatelliteFeatureType } from '../models/geo-fencing.models';
import { SatelliteAircraftTrackingService } from './map-entities/aircraft/aircraft-tracking.service';
import { SatelliteShipTrackingService } from './map-entities/ships/ship-tracking.service';
import { SatelliteFacilitiesService } from './map-entities/facilities/facilities.service';
import { EntityLoader } from './map-entities/entity-loader';
import { SatelliteMapEntityDashboardController } from './map-entities/facilities/map-entity-dashboard.controller';
import { MapEntitiesOverlayComponent } from './ui-overlays/map-entities-overlay/map-entities-overlay.component';
import { MonthCompareService } from './ui-overlays/month-compare-section/month-compare.service';
import { DashboardSectionComponent } from './ui-overlays/dashboard-section/dashboard-section.component';
import { PanelShellComponent } from './ui-overlays/panel-shell/panel-shell.component';
import { MapEntityDetailsState } from './state/map-entity-details.state';
import { SatelliteLoadingState } from './state/satellite-loading.state';
import { SatelliteLocationState } from './state/satellite-location.state';
import { SatelliteScanState } from './state/satellite-scan.state';
import { SatelliteIntelPanel, SatelliteIntelPanelEnum } from '../enums/geo-fencing.enums';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector:    'app-satellite-intel',
  templateUrl: './satellite-intel.html',
  standalone:  true,
  imports: [
    CommonModule,
    GeocodeModalComponent,
    MapRendererComponent,
    MonthCompareSectionComponent,
    EntityDescriptionPopupComponent,
    MapEntitiesOverlayComponent,
    DashboardSectionComponent,
    PanelShellComponent,
    ThreatLensComponent, TranslatePipe],
})
export class SatelliteIntel implements OnInit, OnDestroy {
  private entityLoader: EntityLoader;
  private mapEntityDashboard: SatelliteMapEntityDashboardController;
  private loadingState = new SatelliteLoadingState();
  private locationState = new SatelliteLocationState();
  private scanState: SatelliteScanState;
  private mapEntityDetailsState: MapEntityDetailsState;
  private initialMapEntityLoadTimer: ReturnType<typeof setTimeout> | null = null;
  private initialMapLoadingId: number | null = null;
  private route: ActivatedRoute;
  private sidebarService: SidebarService;
  @ViewChild(MapRendererComponent) private mapRenderer?: MapRendererComponent;

  satelliteService: SatelliteIntelService;
  readonly panel = SatelliteIntelPanelEnum;
  activePanel: SatelliteIntelPanel = SatelliteIntelPanelEnum.Dashboard;
  activeTab: 'map' | 'threat' = 'map';
  selectedLayer: 'esri' | 'osm' = 'osm';
  focusedFeature: OrionSatelliteFeature | null = null;
  selectedFeature: OrionSatelliteFeature | null = null;
  isPanelMenuOpen = false;
  isPanelPopupOpen = true;
  isThreatLensLoading = false;
  fetchGeocodeResults = (query: string) => this.geocodeService.fetchGeocodeResults(query);

  @Input() toolbarMode: 'hidden' | 'geo' = 'hidden';

  constructor( satelliteService: SatelliteIntelService, private geocodeService: GeoFencingGeocodeService, route: ActivatedRoute, sidebarService: SidebarService, aircraftTrackingService: SatelliteAircraftTrackingService, shipTrackingService: SatelliteShipTrackingService, facilitiesService: SatelliteFacilitiesService, monthCompareService: MonthCompareService, ) {
    this.satelliteService = satelliteService;
    this.route = route;
    this.sidebarService = sidebarService;
    const loadingBridge = {
      begin: (title: string, message: string) => this.loadingState.begin(title, message),
      end: (id: number) => this.loadingState.end(id),
    };
    this.entityLoader = new EntityLoader({
      aircraftService: aircraftTrackingService,
      shipService: shipTrackingService,
      facilitiesService,
      loading: loadingBridge,
    });
    this.mapEntityDashboard = new SatelliteMapEntityDashboardController(facilitiesService, () => this.facilitiesVisible, () => this.facilitiesMapData);
    this.mapEntityDetailsState = new MapEntityDetailsState(facilitiesService);
    this.scanState = new SatelliteScanState(satelliteService, monthCompareService);
  }

  ngOnInit(): void {
    this.satelliteService.resetState();
    this.initialMapLoadingId = this.loadingState.begin('Loading Satellite Map', 'Rendering satellite map...');
    const section = this.route.snapshot.queryParamMap.get('section');
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() || '';
    this.setPanel(this.isPanelId(section) ? section : SatelliteIntelPanelEnum.Dashboard);
    this.isPanelPopupOpen = true;
    if (q) {
      this.locationState.setInitialQuery(q, parseCoordinates(q));
    }
    this.initialMapEntityLoadTimer = setTimeout(() => {
      this.initialMapEntityLoadTimer = null;
      this.loadMapEntities();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.initialMapEntityLoadTimer) {
      clearTimeout(this.initialMapEntityLoadTimer);
      this.initialMapEntityLoadTimer = null;
    }
    this.entityLoader.destroy();
    this.mapEntityDashboard.destroy();
    this.mapEntityDetailsState.destroy();
    this.scanState.destroy();
    this.loadingState.clear();
  }

  get isMapView(): boolean {
    return this.activeTab === 'map';
  }

  get isThreatView(): boolean {
    return this.activeTab === 'threat';
  }

  get showTopBar(): boolean {
    return this.toolbarMode !== 'hidden';
  }

  get isMainLoading(): boolean {
    return this.loadingState.isLoading;
  }

  get mainLoadingTitle(): string {
    return this.loadingState.title;
  }

  get mainLoadingMessage(): string {
    return this.loadingState.message;
  }

  get entityDescriptionPopupOpen(): boolean {
    return this.mapEntityDetailsState.isOpen;
  }

  get entityDescriptionPopupData(): MapEntityDetailsState['data'] {
    return this.mapEntityDetailsState.data;
  }

  get anomalyResult(): SatelliteScanState['anomalyResult'] {
    return this.scanState.anomalyResult;
  }

  get compareResult(): SatelliteScanState['compareResult'] {
    return this.scanState.compareResult;
  }

  get hasSearched(): boolean {
    return this.scanState.hasSearched;
  }

  get isMapEntityDetailsLoading(): boolean {
    return this.mapEntityDetailsState.isLoading;
  }

  isScanning(): boolean {
    return this.scanState.isScanning(this.satelliteService.onError()?.message ?? null);
  }

  get aircraftTrackingEnabled(): boolean {
    return this.entityLoader.aircraftEnabled;
  }

  get shipsTrackingEnabled(): boolean {
    return this.entityLoader.shipsEnabled;
  }

  get aircraftTrackingError(): string | null {
    return this.entityLoader.aircraftError;
  }

  get shipsTrackingError(): string | null {
    return this.entityLoader.shipsError;
  }

  get aircraftData(): SatelliteLiveAircraft[] {
    return this.entityLoader.aircraftData;
  }

  get shipsData(): SatelliteLiveShip[] {
    return this.entityLoader.shipsData;
  }

  get isAircraftLoading(): boolean {
    return this.entityLoader.aircraftLoading;
  }

  get isShipsLoading(): boolean {
    return this.entityLoader.shipsLoading;
  }

  get facilitiesVisible(): boolean {
    return this.entityLoader.facilitiesVisible;
  }

  get facilitiesData(): any | null {
    return this.entityLoader.facilitiesData;
  }

  get facilitiesMapData(): OrionSatelliteFeature[] {
    return this.entityLoader.facilitiesMapData;
  }

  get dashboardSearch(): string {
    return this.mapEntityDashboard.dashboardSearch;
  }

  get dashboardSearchResults(): OrionSatelliteFeature[] {
    return this.mapEntityDashboard.dashboardSearchResults;
  }

  get scopedWriDataCount(): number {
    return this.mapEntityDashboard.scopedWriDataCount;
  }

  get locationScoped(): boolean {
    return this.locationState.isLocationScoped;
  }

  get geocodeAllowCoverage(): boolean {
    return this.locationState.geocodeAllowCoverage;
  }

  get geocodeTitle(): string {
    return this.locationState.geocodeTitle;
  }

  get geocodeCoordinates(): string {
    return this.locationState.geocodeCoordinates;
  }

  get geocodeDelta(): number {
    return this.locationState.geocodeDelta;
  }

  get compareLocationLabel(): string {
    return this.locationState.compareLocationLabel;
  }

  get filteredWriData(): OrionSatelliteFeature[] {
    return this.mapEntityDashboard.filteredWriData;
  }

  get filteredFacilitiesMapData(): OrionSatelliteFeature[] {
    return this.mapEntityDashboard.filteredFacilitiesMapData;
  }

  get isMapEntityLoading(): boolean {
    return this.mapEntityDashboard.isLoading || this.entityLoader.facilitiesLoading;
  }

  get dashboardTypeFilters(): OrionSatelliteDashboardFilter[] {
    return this.mapEntityDashboard.dashboardTypeFilters;
  }

  get visibleDashboardTypeFilters(): OrionSatelliteDashboardFilter[] {
    return this.mapEntityDashboard.visibleDashboardTypeFilters;
  }

  get selectedDashboardFilters(): OrionSatelliteFeatureType[] {
    return this.mapEntityDashboard.selectedFilters;
  }

  get visiblePowerCount(): number {
    return this.mapEntityDashboard.visiblePowerCount;
  }

  get facilityEntries(): [string, number][] {
    return this.entityLoader.facilityEntries();
  }

  get lat(): number | null {
    return this.locationState.lat;
  }

  get lon(): number | null {
    return this.locationState.lon;
  }

  get delta(): number {
    return this.locationState.delta;
  }

  get showGeocodeModal(): boolean {
    return this.locationState.showGeocodeModal;
  }

  setPanel(id: SatelliteIntelPanel): void {
    this.activePanel = id;
    this.scanState.resetRequestState();
  }

  setActiveView(view: 'map' | 'threat'): void {
    if (view === 'threat' && this.isThreatToolbarDisabled) {
      return;
    }

    this.activeTab = view;
    if (view === 'map') {
      this.activePanel = SatelliteIntelPanelEnum.Dashboard;
      this.isPanelPopupOpen = true;
    }
    this.isThreatLensLoading = view === 'threat';
    this.isPanelMenuOpen = false;
    if (view === 'threat') {
      this.isPanelPopupOpen = false;
    }
  }

  get isThreatToolbarDisabled(): boolean {
    return this.isThreatView && this.isThreatLensLoading;
  }

  onThreatLensLoadingChange(isLoading: boolean): void {
    this.isThreatLensLoading = isLoading;
  }

  onSatelliteMapReady(): void {
    this.completeInitialMapLoad();
  }

  setLayer(layer: 'esri' | 'osm'): void {
    this.selectedLayer = layer;
  }

  togglePanelMenu(): void {
    this.isPanelMenuOpen = !this.isPanelMenuOpen;
  }

  openThreatFilters(): void {
    this.sidebarService.openSidebar();
    this.isPanelMenuOpen = false;
  }

  openPanelPopup(id: SatelliteIntelPanel): void {
    this.setPanel(id);
    this.isPanelPopupOpen = true;
    this.isPanelMenuOpen = false;
  }

  closePanelPopup(): void {
    this.isPanelPopupOpen = false;
  }

  onAircraftTrackingSelectionChange(): void {
    this.entityLoader.toggleAircraft(this.locationState.getTrackingViewport(), this.locationState.isLocationScoped);
  }

  onShipTrackingSelectionChange(): void {
    this.entityLoader.toggleShips(this.locationState.getShipTrackingViewport(), this.locationState.isLocationScoped);
  }

  focusSelectedLocation(): void {
    const viewport = this.locationState.focusSelectedLocation();
    if (!viewport) {
      return;
    }
    this.mapRenderer?.focusLocation(viewport.lat, viewport.lon, viewport.delta);
  }

  clearSelectedLocation(): void {
    this.locationState.clearSelectedLocation();
    this.focusedFeature = null;
    this.selectedFeature = null;
    this.mapEntityDashboard.setViewport(null);
    this.mapEntityDashboard.clearMapEntities();
    this.entityLoader.clearFacilities(() => this.refreshMergedData());
    this.entityLoader.clearTracking();
    this.mapRenderer?.clearLocation();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.map-overlay-menu')) {
      this.isPanelMenuOpen = false;
    }
  }

  openGeocodeModal(): void {
    this.locationState.openMapGeocode();
  }

  openCompareLocationModal(): void {
    this.locationState.openCompareGeocode();
  }

  closeGeocodeModal(): void {
    this.locationState.closeGeocodeModal();
  }

  onMapMoved(center: { lat: number; lon: number; zoom: number; trackingDelta?: number }): void {
    this.locationState.updateFromMapMove(center);
    if (this.shipsTrackingEnabled) {
      this.entityLoader.scheduleShipViewportRefresh(this.locationState.getShipTrackingViewport());
    }
  }

  onRunCompare(event: { imageType: string; month: string }): void {
    const viewport = this.locationState.getCompareViewport();
    if (!viewport) {
      this.locationState.setPendingCompare(event.imageType, event.month);
      this.openCompareLocationModal();
      return;
    }
    this.locationState.clearPendingCompare();
    this.scanState.runCompare(viewport, event.imageType, event.month);
  }

  onCoordinatesChange(coords: string): void {
    this.locationState.setCoordinates(coords, parseCoordinates(coords));
  }

  onDeltaChangeModal(delta: number): void {
    this.locationState.setDelta(delta);
  }

  onGeoSearch(): void {
    const parsed = parseCoordinates(this.locationState.geocodeCoordinates);
    if (!parsed) {
      this.locationState.showGeocodeModal = false;
      return;
    }
    const result = this.locationState.applyGeocode(parsed);
    if (result.pendingCompare) {
      this.scanState.runCompare(result.viewport, result.pendingCompare.imageType, result.pendingCompare.month);
      return;
    }
    if (result.isCompare) {
      return;
    }
    if (!this.locationScoped) {
      return;
    }
    this.focusedFeature = null;
    this.selectedFeature = null;
    this.mapEntityDashboard.showMapEntities();
    this.scanState.markSearched();
    this.mapEntityDashboard.setViewport(result.viewport);
    this.loadFacilities(false);
    this.entityLoader.refreshTracking(result.viewport);
  }

  onDashboardSearchInput(query: string): void {
    this.mapEntityDashboard.setSearchQuery(query);
  }

  clearDashboardSearch(): void {
    this.mapEntityDashboard.clearSearch();
    this.focusedFeature = null;
  }

  toggleDashboardFilter(type: OrionSatelliteFeatureType): void {
    this.mapEntityDashboard.toggleFilter(type);
  }

  selectAllDashboardFilters(): void {
    this.mapEntityDashboard.selectAllFilters();
  }

  clearDashboardFilters(): void {
    this.mapEntityDashboard.clearFilters();
  }

  focusDashboardFeature(feature: OrionSatelliteFeature): void {
    this.selectedFeature = feature;
    this.focusedFeature = feature;
    this.mapEntityDashboard.selectSearchResult(feature);
  }

  onMapFeatureSelected(feature: OrionSatelliteFeature): void {
    this.selectedFeature = feature;
    this.focusedFeature = feature;
  }

  onMapEntityFeatureIdsSelected(ids: string[]): void {
    this.mapEntityDetailsState.load(ids);
  }

  closeEntityDescriptionPopup(): void {
    this.mapEntityDetailsState.close();
  }

  private isPanelId(value: string | null): value is SatelliteIntelPanel {
    return Object.values(SatelliteIntelPanelEnum).includes(value as SatelliteIntelPanelEnum);
  }

  private loadFacilities(showLoading = true): void {
    this.locationState.syncAppliedViewport();
    this.scanState.markSearched();
    this.entityLoader.loadFacilities(this.locationState.getTrackingViewport(), () => this.refreshMergedData(), showLoading);
  }

  private refreshMergedData(): void {
    this.mapEntityDashboard.refresh();
  }

  private async loadMapEntities(): Promise<void> {
    await this.mapEntityDashboard.load();
  }

  private completeInitialMapLoad(): void {
    if (this.initialMapLoadingId === null) {
      return;
    }
    this.loadingState.end(this.initialMapLoadingId);
    this.initialMapLoadingId = null;
  }
}
