import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { SatelliteIntelService } from './satellite-intel-service';
import { MapRendererComponent } from './map-renderer/map-renderer.component';
import { GeocodeModalComponent } from './ui-overlays/geocode-modal/geocode-modal.component';
import { MonthCompareSectionComponent } from './ui-overlays/month-compare-section/month-compare-section.component';
import { AnomalySectionComponent } from './ui-overlays/anomaly-section/anomaly-section.component';
import { SentinelSearchSectionComponent } from './ui-overlays/sentinel-search-section/sentinel-search-section.component';
import { SentinelImageSectionComponent } from './ui-overlays/sentinel-image-section/sentinel-image-section.component';
import { EntityDescriptionPopupComponent } from './ui-overlays/entity-description-popup/entity-description-popup.component';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ThreatLensComponent } from "../threat-lens/threat-lens";
import { OrionSatelliteDashboardFilter, OrionSatelliteFeature, OrionSatelliteFeatureType, SatelliteTrackingViewport } from '../models/geo-fencing.models';
import { SatelliteAircraftTrackingService } from './map-entities/aircraft/aircraft-tracking.service';
import { SatelliteShipTrackingService } from './map-entities/ships/ship-tracking.service';
import { SatelliteFacilitiesService } from './map-entities/facilities/facilities.service';
import { EntityLoader } from './map-entities/entity-loader';
import { SatelliteMapEntityDashboardController } from './map-entities/facilities/map-entity-dashboard.controller';
import { MapEntitiesOverlayComponent } from './ui-overlays/map-entities-overlay/map-entities-overlay.component';
import { GeocodeService } from './ui-overlays/geocode-modal/geocode.service';
import { AnomalyService } from './ui-overlays/anomaly-section/anomaly.service';
import { MonthCompareService } from './ui-overlays/month-compare-section/month-compare.service';
import { SentinelSearchService } from './ui-overlays/sentinel-search-section/sentinel-search.service';
import { SentinelImageService } from './ui-overlays/sentinel-image-section/sentinel-image.service';
import { DashboardSectionComponent } from './ui-overlays/dashboard-section/dashboard-section.component';
import { PanelShellComponent } from './ui-overlays/panel-shell/panel-shell.component';
import { SatelliteIntelPanel, SatelliteIntelViewport } from './satellite-intel.types';
import { SatelliteLoadingController } from './controllers/satellite-loading.controller';
import { SatelliteScanController } from './controllers/satellite-scan-controller';
import { MapEntityDetailsController } from './controllers/map-entity-details.controller';
import { SatelliteIntelPanelEnum } from '../enums/geo-fencing.enums';

@Component({
  selector:    'app-satellite-intel',
  templateUrl: './satellite-intel.html',
  standalone:  true,
  imports: [
    CommonModule,
    GeocodeModalComponent,
    MapRendererComponent,
    MonthCompareSectionComponent,
    AnomalySectionComponent,
    SentinelSearchSectionComponent,
    SentinelImageSectionComponent,
    EntityDescriptionPopupComponent,
    MapEntitiesOverlayComponent,
    DashboardSectionComponent,
    PanelShellComponent,
    ThreatLensComponent
  ],
})
export class SatelliteIntel implements OnInit, OnDestroy {
  private entityLoader: EntityLoader;
  private mapEntityDashboard: SatelliteMapEntityDashboardController;
  private loadingController = new SatelliteLoadingController();
  private scanController: SatelliteScanController;
  private mapEntityDetails: MapEntityDetailsController;
  private initialMapEntityLoadTimer: ReturnType<typeof setTimeout> | null = null;
  private shipTrackingViewport: SatelliteTrackingViewport | null = null;
  private route: ActivatedRoute;
  private sidebarService: SidebarService;
  private geocodeService: GeocodeService;

  satelliteService: SatelliteIntelService;
  readonly panel = SatelliteIntelPanelEnum;
  activePanel: SatelliteIntelPanel = SatelliteIntelPanelEnum.Dashboard;
  activeTab: 'map' | 'threat' = 'map';
  coordsForm = { value: '', delta: 0.05 };
  inputLat   = 50.0;
  inputLon   = 8.5;
  inputDelta = 2.5;
  selectedLayer: 'esri' | 'osm' = 'esri';
  focusedFeature: OrionSatelliteFeature | null = null;
  selectedFeature: OrionSatelliteFeature | null = null;
  lat:   number | null = null;
  lon:   number | null = null;
  delta                = 0.05;
  showGeocodeModal = false;
  isPanelMenuOpen = false;
  isPanelPopupOpen = true;
  isThreatLensLoading = false;

  @Input() toolbarMode: 'hidden' | 'geo' = 'hidden';

  constructor( satelliteService: SatelliteIntelService, route: ActivatedRoute, sidebarService: SidebarService, aircraftTrackingService: SatelliteAircraftTrackingService, shipTrackingService: SatelliteShipTrackingService, facilitiesService: SatelliteFacilitiesService, geocodeService: GeocodeService, anomalyService: AnomalyService, monthCompareService: MonthCompareService, sentinelSearchService: SentinelSearchService, sentinelImageService: SentinelImageService, ) {
    this.satelliteService = satelliteService;
    this.route = route;
    this.sidebarService = sidebarService;
    this.geocodeService = geocodeService;
    const loadingBridge = {
      begin: (title: string, message: string) => this.loadingController.begin(title, message),
      end: (id: number) => this.loadingController.end(id),
    };
    this.entityLoader = new EntityLoader({
      aircraftService: aircraftTrackingService,
      shipService: shipTrackingService,
      facilitiesService,
      loading: loadingBridge,
    });
    this.mapEntityDashboard = new SatelliteMapEntityDashboardController(facilitiesService, () => this.facilitiesVisible, () => this.facilitiesMapData);
    this.mapEntityDetails = new MapEntityDetailsController(facilitiesService);
    this.scanController = new SatelliteScanController(satelliteService, this.loadingController, anomalyService, monthCompareService, sentinelSearchService, sentinelImageService);
  }

  ngOnInit(): void {
    this.satelliteService.resetState();
    this.setPanel(SatelliteIntelPanelEnum.Dashboard);
    const section = this.route.snapshot.queryParamMap.get('section');
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() || '';
    this.setPanel(this.isPanelId(section) ? section : SatelliteIntelPanelEnum.Dashboard);
    this.isPanelPopupOpen = true;
    if (q) {
      this.coordsForm.value = q;
      const parsed = this.geocodeService.parseCoordinates(q);
      if (parsed) {
        this.inputLat = parsed.lat;
        this.inputLon = parsed.lon;
      }
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
    this.mapEntityDetails.destroy();
    this.scanController.destroy();
    this.loadingController.clear();
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
    return this.loadingController.isLoading;
  }

  get mainLoadingTitle(): string {
    return this.loadingController.title;
  }

  get mainLoadingMessage(): string {
    return this.loadingController.message;
  }

  get entityDescriptionPopupOpen(): boolean {
    return this.mapEntityDetails.isOpen;
  }

  get entityDescriptionPopupData(): MapEntityDetailsController['data'] {
    return this.mapEntityDetails.data;
  }

  get anomalyResult(): SatelliteScanController['anomalyResult'] {
    return this.scanController.anomalyResult;
  }

  get compareResult(): SatelliteScanController['compareResult'] {
    return this.scanController.compareResult;
  }

  get sentinelImageResult(): SatelliteScanController['sentinelImageResult'] {
    return this.scanController.sentinelImageResult;
  }

  get sentinelResults(): SatelliteScanController['sentinelResults'] {
    return this.scanController.sentinelResults;
  }

  get hasSearched(): boolean {
    return this.scanController.hasSearched;
  }

  get isMapEntityDetailsLoading(): boolean {
    return this.mapEntityDetails.isLoading;
  }

  isScanning(): boolean {
    return this.scanController.isScanning(this.satelliteService.onError()?.message ?? null);
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

  get wriData(): OrionSatelliteFeature[] {
    return this.mapEntityDashboard.wriData;
  }

  get filteredWriData(): OrionSatelliteFeature[] {
    return this.mapEntityDashboard.filteredWriData;
  }

  get filteredFacilitiesMapData(): OrionSatelliteFeature[] {
    return this.mapEntityDashboard.filteredFacilitiesMapData;
  }

  get isMapEntityLoading(): boolean {
    return this.mapEntityDashboard.isLoading;
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

  setPanel(id: SatelliteIntelPanel): void {
    this.activePanel = id;
    this.scanController.resetRequestState();
  }

  setActiveView(view: 'map' | 'threat'): void {
    if (this.isThreatToolbarDisabled) {
      return;
    }

    this.activeTab = view;
    this.isThreatLensLoading = view === 'threat';
    this.isPanelMenuOpen = false;
    this.isPanelPopupOpen = false;
  }

  get isThreatToolbarDisabled(): boolean {
    return this.isThreatView && this.isThreatLensLoading;
  }

  onThreatLensLoadingChange(isLoading: boolean): void {
    this.isThreatLensLoading = isLoading;
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
    this.entityLoader.toggleAircraft(this.getTrackingViewport());
  }

  onShipTrackingSelectionChange(): void {
    this.entityLoader.toggleShips(this.getShipTrackingViewport());
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.map-overlay-menu')) {
      this.isPanelMenuOpen = false;
    }
  }

  runAnomalyScan(): void {
    const viewport = this.prepareRequestViewport();
    if (!viewport) {
      return;
    }
    this.setPanel(SatelliteIntelPanelEnum.Anomaly);
    this.scanController.runAnomalyScan(viewport);
  }

  openGeocodeModal(): void {
    this.showGeocodeModal = true;
  }

  onMapMoved(center: { lat: number; lon: number; zoom: number; trackingDelta?: number }): void {
    this.inputLat = center.lat;
    this.inputLon = center.lon;
    this.inputDelta = this.zoomToDelta(center.zoom);
    this.coordsForm.value = `${center.lat.toFixed(5)}, ${center.lon.toFixed(5)}`;
    this.coordsForm.delta = this.inputDelta;
    this.shipTrackingViewport = {
      lat: center.lat,
      lon: center.lon,
      delta: center.trackingDelta ?? this.inputDelta,
    };

    if (this.shipsTrackingEnabled) {
      this.entityLoader.scheduleShipViewportRefresh(this.getShipTrackingViewport());
    }
  }

  onRunCompare(event: { imageType: string }): void {
    const viewport = this.prepareRequestViewport();
    if (!viewport) {
      return;
    }
    this.scanController.runCompare(viewport, event.imageType);
  }

  onRunSentinelSearch(): void {
    const viewport = this.prepareRequestViewport();
    if (!viewport) {
      return;
    }
    this.scanController.runSentinelSearch(viewport);
  }

  onRunSentinelImage(event: { imageType: string; month: string; size: number }): void {
    const viewport = this.prepareRequestViewport();
    if (!viewport) {
      return;
    }
    this.scanController.runSentinelImage(viewport, event.imageType, event.month, event.size);
  }

  onCoordinatesChange(coords: string): void {
    this.coordsForm.value = coords;
    const parsed = this.geocodeService.parseCoordinates(coords);
    if (parsed) {
      this.inputLat = parsed.lat;
      this.inputLon = parsed.lon;
    }
  }

  onDeltaChangeModal(delta: number): void {
    this.coordsForm.delta = delta;
    this.inputDelta = delta;
    this.delta = delta;
  }

  onGeoSearch(): void {
    this.showGeocodeModal = false;
    const parsed = this.geocodeService.parseCoordinates(this.coordsForm.value);
    if (!parsed) {
      return;
    }
    this.inputLat  = parsed.lat;
    this.inputLon  = parsed.lon;
    this.lat       = parsed.lat;
    this.lon       = parsed.lon;
    this.delta     = this.coordsForm.delta;
    this.inputDelta = this.coordsForm.delta;
    this.scanController.markSearched();
    this.loadFacilities();
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
    this.mapEntityDetails.load(ids);
  }

  closeEntityDescriptionPopup(): void {
    this.mapEntityDetails.close();
  }

  private isPanelId(value: string | null): value is SatelliteIntelPanel {
    return Object.values(SatelliteIntelPanelEnum).includes(value as SatelliteIntelPanelEnum);
  }

  public loadFacilities(): void {
    this.syncAppliedViewport();
    this.scanController.markSearched();
    this.entityLoader.loadFacilities(this.getTrackingViewport(), () => this.refreshMergedData());
  }

  private syncAppliedViewport(): void {
    this.lat = this.inputLat;
    this.lon = this.inputLon;
    this.delta = this.inputDelta;
    this.coordsForm.value = `${this.inputLat}, ${this.inputLon}`;
    this.coordsForm.delta = this.inputDelta;
  }

  private prepareRequestViewport(): SatelliteIntelViewport | null {
    this.syncAppliedViewport();
    const lat = this.lat ?? this.inputLat;
    const lon = this.lon ?? this.inputLon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    this.lat = lat;
    this.lon = lon;
    return { lat, lon, delta: this.delta };
  }

  private getTrackingViewport(): SatelliteTrackingViewport {
    return {
      lat: this.inputLat,
      lon: this.inputLon,
      delta: this.inputDelta,
    };
  }

  private getShipTrackingViewport(): SatelliteTrackingViewport {
    return this.shipTrackingViewport ?? this.getTrackingViewport();
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
    this.mapEntityDashboard.refresh();
  }

  async loadMapEntities(): Promise<void> {
    await this.mapEntityDashboard.load();
  }
}
