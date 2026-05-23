import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
// <<<<<<< HEAD
// import { loadModules, setDefaultOptions } from 'esri-loader';
// import { buildArcPath, buildArcPathPoints, buildCountryFeatureIndex, buildSurfacePath, collectArcPairs, getFeatureAnchor, getArcPointAtProgress } from './threat-lens-map.utils';
// import { SidebarService } from '../../../shared/services/sidebar.service';
// import { parseCoordinates } from '../../../shared/utils/geo-coordinates.utils';
// =======
// >>>>>>> threat_lens_code_refactoring
import { FilterModel } from '../../../shared/model/filter/filter.model';
import { GeoCameraResponse } from '../../../shared/model/network-intel/network-intel-api.models';
// <<<<<<< HEAD
// import { AnimatedArcDescriptor, SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryMapData, ThreatLensCategoryModelKey, ThreatLensFeedItem, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, } from '../models/geo-fencing.models';
// import { ThreatLensService } from './threat.lens.service';
// import { ThreatLensFeedPanelComponent } from './threat-lens-feed-panel/threat-lens-feed-panel';
// import { GeocodeModalComponent } from '../../../shared/partials/geocode-modal/geocode-modal.component';
// import { GeoFencingGeocodeService } from '../shared/geo-fencing-geocode.service';
// import { NetworkIntelScanService } from '../../../shared/services/network-intel/network-intel-scan.service';
// =======
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { threat_lens_filters } from '../../../shared/constants/filters';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { GeocodeModalComponent } from '../../../shared/partials/geocode-modal/geocode-modal.component';
import { GeoFencingGeocodeService } from '../shared/geo-fencing-geocode.service';
import { NetworkIntelScanService } from '../../../shared/services/network-intel/network-intel-scan.service';
// import { ScanHelperMethodsService as NetworkIntelService } from '../../root-searches/network-intel/network-intel-service.service';
// import { GeocodeModalComponent } from '../satellite-intel/ui-overlays/geocode-modal/geocode-modal.component';
import { SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryModelKey, ThreatLensFeedItem, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, } from '../models/geo-fencing.models';
// >>>>>>> threat_lens_code_refactoring
import { IpDetailPopupComponent } from './ip-detail-popup/ip-detail-popup.component';
import { ThreatLensFeedPanelComponent } from './threat-lens-feed-panel/threat-lens-feed-panel';
import { ThreatLensMapRendererComponent } from './map-renderer/threat-lens-map-renderer.component';
import { ThreatLensCoordinates, ThreatLensCountrySelection } from './map-renderer/threat-lens-map.types';
import { ThreatLensService } from './threat.lens.service';
import { buildThreatLensCategoryCountryCounts, buildThreatLensLegend, extractThreatLensIpScanRecords, getThreatLensSelectedCountryBreakdown, parseThreatLensCoordinates, } from './utils/threat-lens-geo.utils';

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FiltersComponent,
    ThreatLensFeedPanelComponent,
    GeocodeModalComponent,
    IpDetailPopupComponent,
    ThreatLensMapRendererComponent,
  ],
  templateUrl: './threat-lens.html',
})
export class ThreatLensComponent implements OnDestroy {
  @ViewChild(ThreatLensMapRendererComponent) private mapRenderer?: ThreatLensMapRendererComponent;
  private loadRequestId = 0;
  private destroyed = false;
  private activeArcCountryFilterKey = '';
  private countryNewsCountByKey = new Map<string, number>();
  private categoryCountryNewsCountByKey = new Map<ThreatLensCategoryModelKey, Map<string, number>>();
  private ipScanSub?: Subscription;
  private ipScanWatchInterval: ReturnType<typeof setInterval> | null = null;
  private ipScanResultKey = '';
  private readonly arcBatchSize = 5;

  protected readonly filterModel: FilterModel = threat_lens_filters;

  isFilterOpen$: Observable<boolean>;
  searchTerm = '';
  currentQuery = '';
  selectedCountryName = '';
  statusMessage = 'Loading threat lens results...';
  isLoading = true;
  topCountries: ThreatCountryCount[] = [];
  arcCount = 0;
  categoryLegend: ThreatLensLegendItem[] = [];
  selectedCountryBreakdown: SelectedCountryCategoryCount[] = [];
  feedItems: ThreatLensFeedItem[] = [];
  isSearchPanelCollapsed = false;
  isThreatPanelCollapsed = false;
  showIpScanLocationModal = false;
  ipScanCoordinates = '';
  ipScanRadiusKm = 100;
  ipScanMaxIps = 200;
  ipScanStatusMessage = 'Select a location to scan for exposed IPs.';
  ipScanErrorMessage: string | null = null;
  ipScanResultCount = 0;
  selectedIp = '';
  fetchGeocodeResults = (query: string) => this.geocodeService.fetchGeocodeResults(query);

  @Input() showFilterButton = true;

  @Output() loadingChange = new EventEmitter<boolean>();

// <<<<<<< HEAD
  // constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef, private threatLensService: ThreatLensService, private networkIntelService: NetworkIntelService, private geocodeService: GeoFencingGeocodeService, protected sidebarService: SidebarService) {
// =======
  constructor( private ngZone: NgZone, private cdr: ChangeDetectorRef, private threatLensService: ThreatLensService, private networkIntelService: NetworkIntelScanService, private geocodeService: GeoFencingGeocodeService, protected sidebarService: SidebarService, ) {
// >>>>>>> threat_lens_code_refactoring
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadRequestId += 1;
    this.ipScanSub?.unsubscribe();
    this.ipScanSub = undefined;
    this.stopIpScanWatcher();
    this.mapRenderer?.clearIpScanMarkers();
  }

  async onMapReady(): Promise<void> {
    await this.loadThreatLensData('');
  }

  onMapError(message: string): void {
    this.setLoading(false);
    this.statusMessage = message || 'Failed to initialize threat lens map.';
  }

  async onSearch(): Promise<void> {
    await this.loadThreatLensData(this.searchTerm.trim());
  }

  async onTopCountrySelect(country: string): Promise<void> {
    const normalizedCountry = this.threatLensService.normalizeCountryLabel(country);
    this.searchTerm = normalizedCountry;
    await this.loadThreatLensData(normalizedCountry);
  }

  onCountrySelected(selection: ThreatLensCountrySelection): void {
    this.selectedCountryName = selection.name;
    this.selectedCountryBreakdown = selection.breakdown;
    this.statusMessage = selection.name
      ? `${selection.name}: ${selection.count} related threat result(s).`
      : 'Country selected.';
    this.cdr.detectChanges();
  }

  onMapEmptySelection(): void {
    this.selectedCountryName = '';
    this.selectedCountryBreakdown = [];
    this.statusMessage = 'No country detected at clicked point.';
    this.cdr.detectChanges();
  }

  onArcCountChange(count: number): void {
    this.arcCount = count;
    this.cdr.detectChanges();
  }

  onIpSelected(ip: string): void {
    this.selectedIp = ip;
    this.cdr.detectChanges();
  }

  get isIpScanRunning(): boolean {
    return this.networkIntelService.isRunning() && !this.networkIntelService.onError();
  }

  openIpScanLocation(): void {
    if (this.isIpScanRunning) {
      return;
    }
    this.ipScanErrorMessage = null;
    this.showIpScanLocationModal = true;
  }

  onIpScanCoordinatesChange(value: string): void {
    this.ipScanCoordinates = value;
    this.ipScanErrorMessage = null;
  }

  onIpScanRadiusKmChange(value: number): void {
    const radius = Number(value);
    if (Number.isFinite(radius)) {
      this.ipScanRadiusKm = Math.min(1000, Math.max(1, radius));
    }
  }

  onIpScanMaxIpsChange(value: number): void {
    const maxIps = Math.round(Number(value));
    if (Number.isFinite(maxIps)) {
      this.ipScanMaxIps = Math.min(500, Math.max(1, maxIps));
    }
  }

  onIpScanLocationApply(): void {
    const coordinates = this.ipScanCoordinates.trim();
// <<<<<<< HEAD
//     const center = parseCoordinates(coordinates);
// =======
    const center = parseThreatLensCoordinates(coordinates);
// >>>>>>> threat_lens_code_refactoring
    if (!center) {
      this.ipScanErrorMessage = 'Enter coordinates as latitude, longitude before applying the location.';
      return;
    }

    const radiusKm = Math.min(1000, Math.max(1, Math.round(this.ipScanRadiusKm)));
    this.showIpScanLocationModal = false;
    this.runIpScan(coordinates, center, radiusKm);
  }

  onIpDetailPopupClose(): void {
    this.selectedIp = '';
  }

  togglePanel(panel: 'search' | 'threat'): void {
    if (panel === 'search') {
      this.isSearchPanelCollapsed = !this.isSearchPanelCollapsed;
      return;
    }

    this.isThreatPanelCollapsed = !this.isThreatPanelCollapsed;
  }

  private async loadThreatLensData(query: string): Promise<void> {
    if (!this.mapRenderer) {
      return;
    }

    const requestId = ++this.loadRequestId;
    const activeQuery = query.trim();
    this.currentQuery = activeQuery;
    this.activeArcCountryFilterKey = this.getSearchedCountryKey(activeQuery);

    this.ngZone.run(() => {
      this.setLoading(true);
      this.statusMessage = activeQuery
        ? `Searching threat lens results for "${activeQuery}"...`
        : 'Loading complete threat lens dataset...';
    });

    const stats = await this.fetchMapData(activeQuery);
    if (!this.isActiveRequest(requestId)) {
      return;
    }

    if (!stats) {
      this.mapRenderer.renderThreatData([], [], '');
      this.applyEmptyDataState(activeQuery);
      return;
    }

    this.countryNewsCountByKey = new Map(stats.countryCounts.map((item) => [this.toCountryKey(item.country), item.count]));
    this.categoryCountryNewsCountByKey = buildThreatLensCategoryCountryCounts(stats.categoryData, (value) => this.toCountryKey(value));

    const { totalArcCount, arcCountByCategory } = this.mapRenderer.renderThreatData(stats.categoryData,
      stats.countryCounts,
      this.activeArcCountryFilterKey,);

    if (!this.isActiveRequest(requestId)) {
      return;
    }

    this.arcCount = totalArcCount;
    this.categoryLegend = buildThreatLensLegend(stats.categoryData, arcCountByCategory);
    this.applyLoadedDataState(stats, activeQuery, totalArcCount);

    if (this.activeArcCountryFilterKey) {
      await this.focusCountryByKey(this.activeArcCountryFilterKey);
    }
  }

  private async fetchMapData(activeQuery: string): Promise<ThreatLensMapData | null> {
    try {
      const loadAllPages = false;
      return await firstValueFrom(this.threatLensService.getThreatLensMapData(this.buildSearchPayload(activeQuery), loadAllPages),);
    }
    catch (error) {
      console.error('Failed to load threat lens data', error);
      return null;
    }
  }

  private applyEmptyDataState(activeQuery: string): void {
    this.arcCount = 0;
    this.ngZone.run(() => {
      this.topCountries = [];
      this.categoryLegend = [];
      this.selectedCountryBreakdown = [];
      this.feedItems = [];
      this.statusMessage = activeQuery
        ? `Failed to load threat lens data for "${activeQuery}" from /api/threat/lens.`
        : 'Failed to load threat lens data from /api/threat/lens.';
      this.setLoading(false);
    });
  }

  private applyLoadedDataState(stats: ThreatLensMapData, activeQuery: string, totalArcCount: number): void {
    const mostActive = stats.countryCounts[0];
    const queryLabel = activeQuery ? ` for "${activeQuery}"` : '';

    this.ngZone.run(() => {
      this.feedItems = stats.feedItems;
      this.topCountries = stats.countryCounts.slice(0, 8);

      if (this.selectedCountryName) {
        this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(this.toCountryKey(this.selectedCountryName));
      }

      if (this.activeArcCountryFilterKey && this.mapRenderer?.hasCountryKey(this.activeArcCountryFilterKey)) {
        const activeCountryName = this.mapRenderer.getCountryName(this.activeArcCountryFilterKey);
        this.selectedCountryName = activeCountryName || this.selectedCountryName;
        this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(this.activeArcCountryFilterKey);
      }

      if (!mostActive) {
        this.statusMessage = `Loaded ${stats.totalResults} records${queryLabel}, but no country metadata was found.`;
        this.setLoading(false);
        return;
      }

      this.statusMessage = totalArcCount > 0
        ? this.activeArcCountryFilterKey
          ? `Loaded ${stats.totalResults} records${queryLabel}. Showing only arc connections linked to ${this.selectedCountryName || activeQuery}, rotating in batches of up to ${this.arcBatchSize}.`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries. Showing rotating arc batches of up to ${this.arcBatchSize} at a time. Most active: ${mostActive.country} (${mostActive.count}).`
        : this.activeArcCountryFilterKey
          ? `Loaded ${stats.totalResults} records${queryLabel}, but no arc connections were found for ${this.selectedCountryName || activeQuery}.`
          : `Loaded ${stats.totalResults} records${queryLabel} across ${stats.countryCounts.length} countries, but no multi-country co-occurrence was found for arcs.`;
      this.setLoading(false);
    });
  }

  private runIpScan(coordinates: string, center: ThreatLensCoordinates, radiusKm: number): void {
    this.ipScanSub?.unsubscribe();
    this.stopIpScanWatcher();
    this.networkIntelService.resetState();
    this.mapRenderer?.clearIpScanMarkers();
    this.ipScanResultKey = '__pending__';

    this.ngZone.run(() => {
      this.ipScanErrorMessage = null;
      this.ipScanResultCount = 0;
      this.ipScanStatusMessage = `Scanning ${radiusKm} km around ${coordinates} for IP exposure...`;
      this.cdr.detectChanges();
    });

    this.ipScanSub = this.networkIntelService.scanGeoCamera(coordinates, radiusKm, this.ipScanMaxIps);
    this.watchIpScanResult(center, radiusKm);
  }

  private watchIpScanResult(center: ThreatLensCoordinates, radiusKm: number): void {
    const parse = () => {
      const finished = this.parseIpScanResult(center, radiusKm);
      if (finished) {
        this.stopIpScanWatcher();
      }
    };

    if (this.parseIpScanResult(center, radiusKm)) {
      return;
    }
    this.ipScanWatchInterval = setInterval(parse, 250);
  }

  private stopIpScanWatcher(): void {
    if (this.ipScanWatchInterval) {
      clearInterval(this.ipScanWatchInterval);
      this.ipScanWatchInterval = null;
    }
  }

  private parseIpScanResult(center: ThreatLensCoordinates, radiusKm: number): boolean {
    const error = this.networkIntelService.onError();
    if (error) {
      this.ngZone.run(() => {
        this.ipScanErrorMessage = error?.message || 'IP scan failed.';
        this.ipScanStatusMessage = 'IP scan failed.';
        this.cdr.detectChanges();
      });
      return true;
    }

    const done = this.networkIntelService.onDone();
    if (!done) {
      return false;
    }

    const payload = (done.result ?? done) as GeoCameraResponse & Record<string, any>;
    const status = String(payload?.status || done?.status || '').toLowerCase();
    const progress = Number(done?.result?.progress ?? done?.progress ?? this.networkIntelService.progress());

    if (status === 'pending' || status === 'busy') {
      this.ngZone.run(() => {
        this.ipScanStatusMessage = Number.isFinite(progress)
          ? `Scanning selected area... ${Math.round(progress)}%`
          : 'Scanning selected area...';
        this.cdr.detectChanges();
      });
      return false;
    }

    const records = extractThreatLensIpScanRecords(payload);
    const resultKey = records.map((record) => record.ip).join('|');

    if (resultKey !== this.ipScanResultKey) {
      this.ipScanResultKey = resultKey;
      this.mapRenderer?.renderIpScanMarkers(records, center, radiusKm);
    }

    this.ngZone.run(() => {
      this.ipScanResultCount = records.length;
      this.ipScanStatusMessage = records.length
        ? `Rendered ${records.length} IP marker(s) inside the selected ${radiusKm} km radius.`
        : `IP scan completed for the selected ${radiusKm} km radius. No IPs returned.`;
      this.cdr.detectChanges();
    });

    return !this.networkIntelService.isRunning();
  }

  private async focusCountryByKey(countryKey: string): Promise<void> {
    const selection = await this.mapRenderer?.focusCountryByKey(countryKey);
    if (!selection) {
      return;
    }

    this.ngZone.run(() => {
      this.selectedCountryName = selection.name;
      this.selectedCountryBreakdown = this.getSelectedCountryBreakdown(countryKey);
      this.cdr.detectChanges();
    });
// <<<<<<< HEAD

//     return Array.from(records.values()).slice(0, 500);
//   }

//   private renderIpScanMarkers(records: { ip: string; lat?: number; lon?: number }[], center: { lat: number; lon: number }, radiusKm: number): void {
//     if (!this.ipScanGraphicsLayer) {
//       return;
//     }

//     this.clearIpScanGraphics();
//     const markerGraphics = records.map((record, index) => {
//       const point = this.resolveIpMarkerPoint(record, index, records.length, center, radiusKm);
//       return {
//         geometry: {
//           type: 'point',
//           longitude: point.lon,
//           latitude: point.lat,
//           spatialReference: { wkid: 4326 },
//         },
//         attributes: {
//           role: 'ip-scan-marker',
//           ip: record.ip,
//         },
//         symbol: this.buildIpMarkerSymbol(this.getIpMarkerSizeForView()),
//       };
//     });

//     const radiusGraphic = {
//       geometry: this.buildRadiusPolygon(center, radiusKm),
//       attributes: {
//         role: 'ip-scan-radius',
//       },
//       symbol: {
//         type: 'simple-fill',
//         color: [14, 165, 233, 0.08],
//         outline: {
//           color: [56, 189, 248, 0.72],
//           width: 1.25,
//         },
//       },
//     };

//     this.ipScanMarkerGraphics = markerGraphics;
//     this.ipScanGraphicsLayer.addMany([radiusGraphic, ...markerGraphics]);
//     this.updateIpMarkerSymbols();
//     this.focusIpScanArea(center, radiusKm);
//   }

//   private clearIpScanGraphics(): void {
//     this.ipScanGraphicsLayer?.removeAll();
//     this.ipScanMarkerGraphics = [];
//   }

//   private resolveIpMarkerPoint(record: { ip: string; lat?: number; lon?: number }, index: number, total: number, center: { lat: number; lon: number }, radiusKm: number): { lat: number; lon: number } {
//     if (Number.isFinite(record.lat) && Number.isFinite(record.lon)) {
//       const distance = this.getDistanceKm(center, { lat: record.lat as number, lon: record.lon as number });
//       if (distance <= radiusKm * 1.05) {
//         return { lat: record.lat as number, lon: record.lon as number };
//       }
//     }

//     const hash = this.hashString(`${record.ip}:${index}:${total}`);
//     const angle = ((hash % 36000) / 36000) * Math.PI * 2;
//     const radialSeed = ((Math.floor(hash / 36000) % 10000) + 1) / 10001;
//     const distanceKm = Math.max(0.35, radiusKm * 0.92 * Math.sqrt(radialSeed));
//     const latOffset = (distanceKm * Math.cos(angle)) / 111.32;
//     const lonScale = Math.max(0.12, Math.cos(center.lat * Math.PI / 180));
//     const lonOffset = (distanceKm * Math.sin(angle)) / (111.32 * lonScale);

//     return {
//       lat: Math.max(-89.9, Math.min(89.9, center.lat + latOffset)),
//       lon: this.normalizeLongitude(center.lon + lonOffset),
//     };
//   }

//   private buildRadiusPolygon(center: { lat: number; lon: number }, radiusKm: number): any {
//     const ring: number[][] = [];
//     const latRad = center.lat * Math.PI / 180;
//     const lonRad = center.lon * Math.PI / 180;
//     const angularDistance = radiusKm / 6371.0088;

//     for (let step = 0; step <= 96; step++) {
//       const bearing = (step / 96) * Math.PI * 2;
//       const pointLat = Math.asin(Math.sin(latRad) * Math.cos(angularDistance) + Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing));
//       const pointLon = lonRad + Math.atan2(Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad), Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(pointLat));
//       ring.push([this.normalizeLongitude(pointLon * 180 / Math.PI), pointLat * 180 / Math.PI]);
//     }

//     return {
//       type: 'polygon',
//       rings: [ring],
//       spatialReference: { wkid: 4326 },
//     };
//   }

//   private updateIpMarkerSymbols(): void {
//     if (!this.ipScanMarkerGraphics.length) {
//       return;
//     }

//     const size = this.getIpMarkerSizeForView();
//     for (const graphic of this.ipScanMarkerGraphics) {
//       graphic.symbol = this.buildIpMarkerSymbol(size);
//     }
//   }

//   private buildIpMarkerSymbol(size: number): any {
//     return {
//       type: 'simple-marker',
//       style: 'circle',
//       size,
//       color: [56, 189, 248, 0.88],
//       outline: {
//         color: [255, 255, 255, 0.92],
//         width: Math.max(1, Math.min(2.5, size * 0.16)),
//       },
//     };
//   }

//   private getIpMarkerSizeForView(): number {
//     const scale = Number(this.view?.scale || 50000000);
//     const logScale = Math.log10(Math.max(1, scale));
//     const zoomFactor = Math.max(0, Math.min(1, (8.25 - logScale) / 4.5));
//     return Math.round((6 + (zoomFactor * 9)) * 10) / 10;
//   }

//   private focusIpScanArea(center: { lat: number; lon: number }, radiusKm: number): void {
//     if (!this.view) {
//       return;
//     }

//     const altitude = Math.max(450000, Math.min(12000000, radiusKm * 12000));
//     void this.view.goTo({
//       position: {
//         longitude: center.lon,
//         latitude: center.lat,
//         z: altitude,
//       },
//       tilt: 0,
//     }, { duration: 750, easing: 'ease-in-out' }).then(() => undefined, () => undefined);
//   }

//   private getDistanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
//     const toRadians = (value: number) => value * Math.PI / 180;
//     const dLat = toRadians(b.lat - a.lat);
//     const dLon = toRadians(b.lon - a.lon);
//     const lat1 = toRadians(a.lat);
//     const lat2 = toRadians(b.lat);
//     const h = Math.sin(dLat / 2) ** 2 + (Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2);
//     return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
//   }

//   private normalizeLongitude(value: number): number {
//     return ((((value + 180) % 360) + 360) % 360) - 180;
//   }

//   private hashString(value: string): number {
//     let hash = 2166136261;
//     for (let index = 0; index < value.length; index++) {
//       hash ^= value.charCodeAt(index);
//       hash = Math.imul(hash, 16777619);
//     }
//     return hash >>> 0;
//   }

//   private setLoading(value: boolean): void {
//     if (this.isLoading === value) {
//       return;
//     }

//     this.isLoading = value;
//     this.loadingChange.emit(value);
//   }

//   private async renderCountryArcs(categoryData: ThreatLensCategoryMapData[]): Promise<{
//     totalArcCount: number;
//     arcCountByCategory: Map<ThreatLensCategoryModelKey, number>;
//   }> {
//     if (!this.arcGraphicsLayer || !this.arcSurfaceGraphicsLayer || !this.animatedArcGraphicsLayer) {
//       return { totalArcCount: 0, arcCountByCategory: new Map() };
//     }

//     this.stopArcAnimation();
//     this.arcGraphicsLayer.removeAll();
//     this.arcSurfaceGraphicsLayer.removeAll();
//     this.animatedArcGraphicsLayer.removeAll();
//     this.animatedArcs = [];
//     this.visibleBatchIndex = -1;
//     this.batchAnimationStartTime = 0;

//     const arcCountByCategory = new Map<ThreatLensCategoryModelKey, number>();
//     let totalArcCount = 0;

//     for (const category of categoryData) {
//       const pairs = collectArcPairs(category.documentCountryGroups, (value) => this.toCountryKey(value), this.countryFeatureIndex, this.maxArcCount, this.minArcWeight);
//       const visiblePairs = this.activeArcCountryFilterKey
//         ? pairs.filter((pair) => pair.countryAKey === this.activeArcCountryFilterKey || pair.countryBKey === this.activeArcCountryFilterKey)
//         : pairs;

//       let renderedArcCount = 0;

//       for (const pair of visiblePairs) {
//         const featureA = this.countryFeatureIndex.get(pair.countryAKey);
//         const featureB = this.countryFeatureIndex.get(pair.countryBKey);
//         const start = getFeatureAnchor(featureA, this.geometryEngine, this.webMercatorUtils);
//         const end = getFeatureAnchor(featureB, this.geometryEngine, this.webMercatorUtils);

//         if (!start || !end) {
//           continue;
//         }

//         const arcPoints = buildArcPathPoints(start, end, pair.weight);
//         const arcPaths = buildArcPath(start, end, pair.weight);
//         const surfacePaths = buildSurfacePath(start, end);
//         if (!arcPaths.length || !surfacePaths.length || arcPoints.length < 2) {
//           continue;
//         }

//         this.animatedArcs.push({
//           categoryKey: category.categoryKey,
//           categoryLabel: category.categoryLabel,
//           color: category.color,
//           weight: pair.weight,
//           arcPoints,
//           arcPaths,
//           surfacePaths,
//           countryAKey: pair.countryAKey,
//           countryBKey: pair.countryBKey,
//           countryAName: this.extractCountryName(featureA.attributes),
//           countryBName: this.extractCountryName(featureB.attributes),
//           animationOffset: renderedArcCount * 0.11,
//           animationDuration: Math.max(1800, 3300 - Math.min(1200, pair.weight * 110)),
//         });

//         renderedArcCount += 1;
//       }

//       arcCountByCategory.set(category.categoryKey, renderedArcCount);
//       totalArcCount += renderedArcCount;
//     }

//     this.renderArcBatch(0);
//     this.startArcAnimation();
//     return {
//       totalArcCount: Math.min(totalArcCount, this.arcBatchSize),
//       arcCountByCategory,
//     };
//   }

//   private async renderNewsIntensity(_countryCounts: ThreatCountryCount[], _maxCount: number): Promise<void> {
//     if (!this.newsGraphicsLayer) {
//       return;
//     }

//     this.newsGraphicsLayer.removeAll();
//   }

//   private toCountryKey(value: string): string {
//     const normalized = this.threatLensService.normalizeCountryLabel(value);
//     return this.threatLensService.toCountryKey(normalized);
//   }

//   private getSelectedCountryBreakdown(countryKey: string): SelectedCountryCategoryCount[] {
//     return this.categoryLegend
//       .map((category) => ({
//         label: category.label,
//         colorHex: category.colorHex,
//         count: this.categoryCountryNewsCountByKey.get(category.categoryKey)?.get(countryKey) || 0,
//       }))
//       .filter((item) => item.count > 0)
//       .sort((a, b) => b.count - a.count);
//   }

//   private toHexColor(color: [number, number, number]): string {
//     return `#${color.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
//   }

//   togglePanel(panel: 'search' | 'threat'): void {
//     if (panel === 'search') {
//       this.isSearchPanelCollapsed = !this.isSearchPanelCollapsed;
//       return;
//     }

//     this.isThreatPanelCollapsed = !this.isThreatPanelCollapsed;
// =======
// >>>>>>> threat_lens_code_refactoring
  }

  private buildSearchPayload(query: string): Partial<ThreatLensRequestPayload> {
    const payload: Partial<ThreatLensRequestPayload> = { q: query };
    if (!query) {
      return payload;
    }

    const normalizedCountry = this.threatLensService.normalizeCountryLabel(query);
    const countryKey = this.toCountryKey(normalizedCountry);
    if (countryKey && this.mapRenderer?.hasCountryKey(countryKey)) {
      payload.q = '';
      payload.entity_filter = { m_country: [normalizedCountry] };
      payload.must = true;
      payload.fullsearch = false;
    }

    return payload;
  }

  private getSearchedCountryKey(query: string): string {
    if (!query) {
      return '';
    }

    const normalizedCountry = this.threatLensService.normalizeCountryLabel(query);
    const countryKey = this.toCountryKey(normalizedCountry);
    return countryKey && this.mapRenderer?.hasCountryKey(countryKey) ? countryKey : '';
  }

  private getSelectedCountryBreakdown(countryKey: string): SelectedCountryCategoryCount[] {
    return getThreatLensSelectedCountryBreakdown(countryKey, this.categoryLegend, this.categoryCountryNewsCountByKey);
  }

  private toCountryKey(value: string): string {
    const normalized = this.threatLensService.normalizeCountryLabel(value);
    return this.threatLensService.toCountryKey(normalized);
  }

  private setLoading(value: boolean): void {
    if (this.isLoading === value) {
      return;
    }

    this.isLoading = value;
    this.loadingChange.emit(value);
  }

  private isActiveRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.loadRequestId;
  }
}
