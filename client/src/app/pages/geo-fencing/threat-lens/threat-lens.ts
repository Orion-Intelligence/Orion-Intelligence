import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, Observable, Subscription } from 'rxjs';
import { FilterModel } from '../../../shared/model/filter/filter.model';
import { GeoCameraResponse } from '../../../shared/model/network-intel/network-intel-api.models';
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { threat_lens_filters } from '../../../shared/constants/filters';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { MapLoadingBadgesComponent } from '../../../shared/partials/map-loading-badges/map-loading-badges.component';
import { NetworkIntelScanService } from '../../../shared/services/network-intel/network-intel-scan.service';
import { SelectedCountryCategoryCount, ThreatCountryCount, ThreatLensCategoryModelKey, ThreatLensFeedItem, ThreatLensIpScanMode, ThreatLensLegendItem, ThreatLensMapData, ThreatLensRequestPayload, } from '../models/geo-fencing.models';
import { ThreatLensIpScanModeEnum } from '../enums/geo-fencing.enums';
import { IpDetailPopupComponent } from './ui-overlays/ip-detail-popup/ip-detail-popup.component';
import { ArcReportPopupComponent } from './ui-overlays/arc-report-popup/arc-report-popup.component';
import { ThreatLensFeedPanelComponent } from './ui-overlays/feed-panel/threat-lens-feed-panel.component';
import { ThreatLensMapRendererComponent } from './map-renderer/threat-lens-map-renderer.component';
import { ThreatLensArcSelection, ThreatLensCoordinates, ThreatLensCountryBoundary, ThreatLensCountrySelection, ThreatLensIpViewportScanRequest } from './models/threat-lens-map.types';
import { ThreatLensService } from './threat-lens.service';
import { ThreatLensGeoUtils } from './map-utils/threat-lens-geo.utils';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FiltersComponent,
    ThreatLensFeedPanelComponent,
    IpDetailPopupComponent,
    ArcReportPopupComponent,
    ThreatLensMapRendererComponent,
    MapLoadingBadgesComponent, TooltipDirective, TranslatePipe],
  templateUrl: './threat-lens.html',
})
export class ThreatLensComponent implements OnDestroy {
  @ViewChild(ThreatLensMapRendererComponent) private mapRenderer?: ThreatLensMapRendererComponent;
  private loadRequestId = 0;
  private destroyed = false;
  private activeArcCountryFilterKey = '';
  private categoryCountryNewsCountByKey = new Map<ThreatLensCategoryModelKey, Map<string, number>>();
  private ipScanSub?: Subscription;
  private ipScanWatchInterval: ReturnType<typeof setInterval> | null = null;
  private ipScanResultKey = '';
  private hasStartedDefaultIpScan = false;
  private lastAutomaticIpScanKey = '';
  private selectedCountryIpScanRequest: ThreatLensIpViewportScanRequest | null = null;
  private readonly arcBatchSize = 5;
  private readonly defaultIpScanCoordinates = '20, 0';
  private readonly defaultIpScanCenter: ThreatLensCoordinates = { lat: 20, lon: 0 };
  private readonly defaultIpScanRadiusKm = 12000;
  private readonly defaultIpScanMaxIps = 200;
  private detailOverlayOpenNotified = false;

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
  ipScanStatusMessage = 'Loading default IP exposure map...';
  ipScanErrorMessage: string | null = null;
  ipScanResultCount = 0;
  hasIpScanResult = false;
  hasIpScanCompleted = false;
  ipScanProgress: number | null = null;
  ipScanScopeLabel = 'Global view';
  ipScanRangeLabel = '12,000 km radius';
  selectedIp = '';
  selectedArc: ThreatLensArcSelection | null = null;

  @Input() showFilterButton = true;

  @Output() loadingChange = new EventEmitter<boolean>();
  @Output() detailOverlayOpenChange = new EventEmitter<boolean>();

  constructor( private ngZone: NgZone, private cdr: ChangeDetectorRef, private threatLensService: ThreatLensService, private networkIntelService: NetworkIntelScanService, protected sidebarService: SidebarService, ) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.loadRequestId += 1;
    this.ipScanSub?.unsubscribe();
    this.ipScanSub = undefined;
    this.stopIpScanWatcher();
    this.mapRenderer?.clearIpScanMarkers();
    this.emitDetailOverlayOpenChange(false);
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
    this.closeArcReportPanel();
    this.selectedCountryName = selection.name;
    this.selectedCountryBreakdown = selection.breakdown;
    this.selectedCountryIpScanRequest = selection.ipScanRequest ?? null;
    this.statusMessage = selection.name
      ? `${selection.name}: ${selection.count} related threat result(s).`
      : 'Country selected.';
    this.cdr.detectChanges();
    this.runCountryIpScan(selection.name, this.selectedCountryIpScanRequest);
  }

  onMapEmptySelection(): void {
    this.closeArcReportPanel();
    const hadSelectedCountry = Boolean(this.selectedCountryName || this.selectedCountryIpScanRequest);
    this.selectedCountryName = '';
    this.selectedCountryBreakdown = [];
    this.selectedCountryIpScanRequest = null;
    this.statusMessage = 'No country detected at clicked point.';
    this.cdr.detectChanges();

    if (hadSelectedCountry) {
      this.lastAutomaticIpScanKey = '';
      if (!this.mapRenderer?.requestViewportIpScan()) {
        this.startDefaultIpScan(true);
      }
    }
  }

  onArcCountChange(count: number): void {
    this.arcCount = count;
    this.cdr.detectChanges();
  }

  onIpSelected(ip: string): void {
    this.closeArcReportPanel(false);
    this.selectedIp = ip;
    this.cdr.detectChanges();
    this.emitDetailOverlayOpenChange();
  }

  onArcSelected(selection: ThreatLensArcSelection): void {
    this.selectedIp = '';
    this.selectedArc = selection;
    this.statusMessage = `${selection.countryAName} to ${selection.countryBName}: ${selection.weight} ${selection.categoryLabel.toLowerCase()} report(s).`;
    this.cdr.detectChanges();
    this.emitDetailOverlayOpenChange();
  }

  onViewportIpScanRequested(request: ThreatLensIpViewportScanRequest): void {
    if (this.destroyed) {
      return;
    }

    const effectiveRequest = this.selectedCountryIpScanRequest
      ? { ...request, boundary: this.selectedCountryIpScanRequest.boundary ?? null }
      : request;
    const center = this.normalizeIpScanCenter(effectiveRequest.center);
    const radiusKm = Math.round(Math.max(25, Math.min(this.defaultIpScanRadiusKm, effectiveRequest.radiusKm)));
    const mode: ThreatLensIpScanMode = this.selectedCountryIpScanRequest ? ThreatLensIpScanModeEnum.Country : ThreatLensIpScanModeEnum.Default;
    const requestScope = this.selectedCountryIpScanRequest ? `country:${this.toCountryKey(this.selectedCountryName)}` : 'default';
    const requestKey = this.getIpScanRequestKey(center, radiusKm, requestScope);
    if (requestKey === this.lastAutomaticIpScanKey && (this.hasIpScanResult || this.isIpScanRunning)) {
      return;
    }

    this.lastAutomaticIpScanKey = requestKey;
    this.runIpScan(`${center.lat.toFixed(6)}, ${center.lon.toFixed(6)}`,
      center,
      radiusKm,
      mode,
      this.defaultIpScanMaxIps,
      effectiveRequest.boundary ?? null,);
  }

  get isIpScanRunning(): boolean {
    return this.networkIntelService.isRunning() && !this.networkIntelService.onError();
  }

  get loadingBadges(): string[] {
    return !this.isLoading && this.isIpScanRunning ? [`IP scan: ${this.ipScanScopeLabel}`] : [];
  }

  get showIpScanPanel(): boolean {
    return this.isIpScanRunning || this.hasIpScanResult || this.hasIpScanCompleted || Boolean(this.ipScanErrorMessage);
  }

  get ipScanStateLabel(): string {
    if (this.ipScanErrorMessage) {
      return 'Error';
    }
    if (this.isIpScanRunning) {
      return this.ipScanProgress !== null ? `${this.ipScanProgress}%` : 'Scanning';
    }
    if (this.hasIpScanResult) {
      return 'Ready';
    }
    if (this.hasIpScanCompleted) {
      return 'Complete';
    }
    return 'Idle';
  }

  onIpDetailPopupClose(): void {
    this.selectedIp = '';
    this.emitDetailOverlayOpenChange();
  }

  onArcReportPanelClose(): void {
    this.closeArcReportPanel();
    this.cdr.detectChanges();
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

    this.closeArcReportPanel();
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
      if (!activeQuery) {
        this.startDefaultIpScan();
      }
      return;
    }

    this.categoryCountryNewsCountByKey = ThreatLensGeoUtils.buildThreatLensCategoryCountryCounts(stats.categoryData, (value) => this.toCountryKey(value));

    const { totalArcCount, arcCountByCategory } = this.mapRenderer.renderThreatData(stats.categoryData,
      stats.countryCounts,
      this.activeArcCountryFilterKey,);

    if (!this.isActiveRequest(requestId)) {
      return;
    }

    this.arcCount = totalArcCount;
    this.categoryLegend = ThreatLensGeoUtils.buildThreatLensLegend(stats.categoryData, arcCountByCategory);
    this.applyLoadedDataState(stats, activeQuery, totalArcCount);

    if (this.activeArcCountryFilterKey) {
      await this.focusCountryByKey(this.activeArcCountryFilterKey);
    }
    else {
      this.startDefaultIpScan();
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

  private startDefaultIpScan(force = false): void {
    if ((!force && this.hasStartedDefaultIpScan) || this.destroyed || (!force && this.isIpScanRunning)) {
      return;
    }

    this.hasStartedDefaultIpScan = true;
    if (this.mapRenderer?.requestViewportIpScan()) {
      return;
    }

    this.lastAutomaticIpScanKey = this.getIpScanRequestKey(this.defaultIpScanCenter, this.defaultIpScanRadiusKm, 'default');
    this.runIpScan(this.defaultIpScanCoordinates,
      this.defaultIpScanCenter,
      this.defaultIpScanRadiusKm,
      ThreatLensIpScanModeEnum.Default,
      this.defaultIpScanMaxIps,);
  }

  private runIpScan(coordinates: string, center: ThreatLensCoordinates, radiusKm: number, mode: ThreatLensIpScanMode, maxIps: number, boundary: ThreatLensCountryBoundary | null = null): void {
    this.ipScanSub?.unsubscribe();
    this.stopIpScanWatcher();
    this.networkIntelService.resetState();
    this.ipScanResultKey = '__pending__';

    this.ngZone.run(() => {
      this.ipScanErrorMessage = null;
      this.hasIpScanCompleted = false;
      this.ipScanProgress = null;
      this.ipScanScopeLabel = mode === ThreatLensIpScanModeEnum.Default
        ? 'Global view'
        : this.selectedCountryName || 'Selected country';
      this.ipScanRangeLabel = this.formatRadiusLabel(radiusKm);
      if (!this.hasIpScanResult) {
        this.ipScanResultCount = 0;
      }
      this.ipScanStatusMessage = mode === ThreatLensIpScanModeEnum.Default
        ? 'Loading default IP exposure map...'
        : 'Scanning selected country for IP exposure...';
      this.cdr.detectChanges();
    });

    this.ipScanSub = this.networkIntelService.scanGeoCamera(coordinates, radiusKm, maxIps);
    this.watchIpScanResult(center, radiusKm, mode, boundary);
  }

  private getIpScanRequestKey(center: ThreatLensCoordinates, radiusKm: number, scope: string): string {
    return `${scope}:${center.lat.toFixed(2)}:${center.lon.toFixed(2)}:${Math.round(radiusKm / 25)}`;
  }

  private formatRadiusLabel(radiusKm: number): string {
    const rounded = Math.max(0, Math.round(radiusKm));
    return `${rounded.toLocaleString()} km radius`;
  }

  private normalizeIpScanCenter(center: ThreatLensCoordinates): ThreatLensCoordinates {
    return {
      lat: Math.round(center.lat * 1000000) / 1000000,
      lon: Math.round(center.lon * 1000000) / 1000000,
    };
  }

  private runCountryIpScan(countryName: string, request: ThreatLensIpViewportScanRequest | null): void {
    if (!request) {
      return;
    }

    const center = this.normalizeIpScanCenter(request.center);
    const radiusKm = Math.round(Math.max(25, Math.min(this.defaultIpScanRadiusKm, request.radiusKm)));
    const requestKey = this.getIpScanRequestKey(center, radiusKm, `country:${this.toCountryKey(countryName)}`);
    if (requestKey === this.lastAutomaticIpScanKey && (this.hasIpScanResult || this.isIpScanRunning)) {
      return;
    }

    this.lastAutomaticIpScanKey = requestKey;
    this.runIpScan(`${center.lat.toFixed(6)}, ${center.lon.toFixed(6)}`,
      center,
      radiusKm,
      ThreatLensIpScanModeEnum.Country,
      this.defaultIpScanMaxIps,
      request.boundary ?? null,);
    this.ngZone.run(() => {
      this.ipScanStatusMessage = countryName
        ? `Scanning ${countryName} for IP exposure...`
        : 'Scanning selected country for IP exposure...';
      this.cdr.detectChanges();
    });
  }

  private watchIpScanResult(center: ThreatLensCoordinates, radiusKm: number, mode: ThreatLensIpScanMode, boundary: ThreatLensCountryBoundary | null): void {
    const parse = () => {
      const finished = this.parseIpScanResult(center, radiusKm, mode, boundary);
      if (finished) {
        this.stopIpScanWatcher();
      }
    };

    if (this.parseIpScanResult(center, radiusKm, mode, boundary)) {
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

  private parseIpScanResult(center: ThreatLensCoordinates, radiusKm: number, mode: ThreatLensIpScanMode, boundary: ThreatLensCountryBoundary | null): boolean {
    const error = this.networkIntelService.onError();
    if (error) {
      this.ngZone.run(() => {
        this.ipScanErrorMessage = error?.message || 'IP scan failed.';
        this.ipScanStatusMessage = 'IP scan failed.';
        this.ipScanProgress = null;
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
        this.ipScanProgress = Number.isFinite(progress)
          ? Math.max(0, Math.min(99, Math.round(progress)))
          : null;
        this.ipScanStatusMessage = Number.isFinite(progress)
          ? mode === ThreatLensIpScanModeEnum.Default
            ? `Loading default IP exposure... ${Math.round(progress)}%`
            : `Scanning selected country... ${Math.round(progress)}%`
          : mode === ThreatLensIpScanModeEnum.Default
            ? 'Loading default IP exposure...'
            : 'Scanning selected country...';
        this.cdr.detectChanges();
      });
      return false;
    }

    const records = ThreatLensGeoUtils.extractThreatLensIpScanRecords(payload);
    const resultKey = `${this.getIpScanRequestKey(center, radiusKm, mode)}:${records.map((record) => record.ip).join('|')}`;
    const hasRenderableRecords = records.length > 0;
    const hadExistingResult = this.hasIpScanResult;
    let renderedMarkers = hasRenderableRecords && resultKey === this.ipScanResultKey;

    if (hasRenderableRecords && resultKey !== this.ipScanResultKey) {
      renderedMarkers = this.mapRenderer?.renderIpScanMarkers(records, center, radiusKm, boundary) ?? false;
      if (renderedMarkers) {
        this.ipScanResultKey = resultKey;
      }
    }

    this.ngZone.run(() => {
      if (renderedMarkers) {
        this.ipScanResultCount = records.length;
        this.hasIpScanResult = true;
      }
      this.hasIpScanCompleted = true;
      this.ipScanProgress = null;
      this.ipScanStatusMessage = renderedMarkers
        ? mode === ThreatLensIpScanModeEnum.Default
          ? `Rendered ${records.length} default IP marker(s). Zoom in to reveal more.`
          : `Rendered ${records.length} IP marker(s) for the selected country.`
        : hadExistingResult
          ? 'No new IP markers returned. Keeping the previous scan visible.'
          : mode === ThreatLensIpScanModeEnum.Default
            ? 'Default IP exposure scan completed. No IPs returned.'
            : 'Selected country IP scan completed. No IPs returned.';
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
      this.selectedCountryIpScanRequest = selection.ipScanRequest ?? null;
      this.cdr.detectChanges();
    });
    this.runCountryIpScan(selection.name, this.selectedCountryIpScanRequest);
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
    return ThreatLensGeoUtils.getThreatLensSelectedCountryBreakdown(countryKey, this.categoryLegend, this.categoryCountryNewsCountByKey);
  }

  private closeArcReportPanel(notify = true): void {
    this.selectedArc = null;
    if (notify) {
      this.emitDetailOverlayOpenChange();
    }
  }

  private emitDetailOverlayOpenChange(value = Boolean(this.selectedIp || this.selectedArc)): void {
    if (this.detailOverlayOpenNotified === value) {
      return;
    }

    this.detailOverlayOpenNotified = value;
    this.detailOverlayOpenChange.emit(value);
  }

  private toCountryKey(value: string): string {
    const normalized = this.threatLensService.normalizeCountryLabel(value);
    return this.threatLensService._toCountryKey(normalized);
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
