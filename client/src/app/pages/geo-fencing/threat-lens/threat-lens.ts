import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { FilterModel } from '../../../shared/model/filter/filter.model';
import { GeoCameraResponse } from '../../../shared/model/network-intel/network-intel-api.models';
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { threat_lens_filters } from '../../../shared/constants/filters';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { GeocodeModalComponent } from '../../../shared/partials/geocode-modal/geocode-modal.component';
import { GeoFencingGeocodeService } from '../shared/geo-fencing-geocode.service';
import { MapLoadingBadgesComponent } from '../shared/map-loading-badges/map-loading-badges.component';
import { NetworkIntelScanService } from '../../../shared/services/network-intel/network-intel-scan.service';
import { SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryModelKey, ThreatLensFeedItem, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, } from '../models/geo-fencing.models';
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
    MapLoadingBadgesComponent,
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

  constructor( private ngZone: NgZone, private cdr: ChangeDetectorRef, private threatLensService: ThreatLensService, private networkIntelService: NetworkIntelScanService, private geocodeService: GeoFencingGeocodeService, protected sidebarService: SidebarService, ) {
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

  get loadingBadges(): string[] {
    return !this.isLoading && this.isIpScanRunning ? ['IP scan loading...'] : [];
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
    const center = parseThreatLensCoordinates(coordinates);
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
