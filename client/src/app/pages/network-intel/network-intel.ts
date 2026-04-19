import { Component, OnDestroy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { ScanHelperMethodsService } from './network-intel-service.service';
import { DnsResult, IpDetail, IpRowState, GeoResult, GeoLiveStats } from '../../shared/model/network-intel/network-intel.model';
import { GraphReportPayload } from '../../shared/model/report/report-export.model';
import { ReportExportService } from '../../shared/services/report-export.service';
import { EmptyQueryComponent } from '../../shared/partials/empty-query/empty-query.component';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { GeoCoordinatesModalComponent } from './modal/geo-coordinates-modal/geo-coordinates-modal.component';
import { DnsSectionComponent } from './dns-section/dns-section.component';
import { ShodanSectionComponent } from './shodan-section/shodan-section.component';
import { VulnerabilitySectionComponent } from './vulnerability-section/vulnerability-section.component';

@Component({
  selector:    'app-network-intel',
  templateUrl: './network-intel.html',
  standalone:  true,
  imports:     [CommonModule, FormsModule, EmptyQueryComponent, GeoCoordinatesModalComponent, DnsSectionComponent, ShodanSectionComponent, VulnerabilitySectionComponent],
  animations:  [fadeInDashboardItem],
})
export class NetworkIntel implements OnInit, OnDestroy {
  private sub?: Subscription;
  private _intervals: ReturnType<typeof setInterval>[] = [];
  private readonly dnsIpDetailQueue$ = new Subject<IpRowState>();
  private dnsIpDetailQueueSub?: Subscription;
  private readonly sectionToTab: Record<string, 'dns' | 'shodan' | 'vuln' | 'geo'> = { 'host-recon': 'dns', 'deep-scan': 'shodan', 'vulnerability-scan': 'vuln', 'geo-cameras': 'geo', };
  private readonly tabToSection: Record<'dns' | 'shodan' | 'vuln' | 'geo', string> = { dns: 'host-recon', shodan: 'deep-scan', vuln: 'vulnerability-scan', geo: 'geo-cameras', };

  readonly progressSegments = Array.from({ length: 20 }, (_, index) => index);
  activeTab: 'dns' | 'shodan' | 'vuln' | 'geo' = 'dns';
  lastPrimaryTab: 'dns' | 'shodan' | 'vuln' = 'dns';
  geoMode:   'coords' | 'ranges'      = 'coords';
  dnsForm    = { domain: '' };
  shodanForm = { ip: '' };
  vulnForm   = { ip: '' };
  geoForm    = { coordinates: '', radius_km: 25, max_ips: 200, ip_ranges: '' };
  formError: string | null = null;
  parsedRanges: { value: string; valid: boolean }[] = [];
  dnsResult:       DnsResult | null = null;
  ipRows:          IpRowState[]     = [];
  shodanResult:    IpDetail | null  = null;
  vulnerabilityResult: any   = null;
  geoIpListResult: DnsResult | null = null;
  geoIpRows:       IpRowState[]     = [];
  geoResult:       GeoResult | null    = null;
  geoLiveStats:    GeoLiveStats | null = null;
  currentStep      = '';
  exportCurrentStep = '';
  lastResultCount = 0;
  hasSearched = false;
  showGeoCoordinatesModal = false;
  showGeoRangesModal = false;
  geoRangesSubmitAttempted = false;
  isExportingReport = false;
  exportProgress = 0;
  isScanning = computed(() =>
    this.scanHelper.isRunning() &&
    !this.scanHelper.onError());

  get isEmbeddedInConsolidated(): boolean {
    return this.router.url.includes('/consolidated');
  }

  get vulnerabilityElapsedLabel(): string {
    const elapsed = this.vulnerabilityResult?.elapsed_seconds;
    if (typeof elapsed === 'number' && Number.isFinite(elapsed)) {
      return `${elapsed.toFixed(1)}s`;
    }
    return '-';
  }

  constructor( public scanHelper: ScanHelperMethodsService, private route: ActivatedRoute, private router: Router, private reportExport: ReportExportService, ) {}

  ngOnInit(): void {
    this.scanHelper.resetState();
    this.bindDnsIpDetailQueue();

    const section = this.route.snapshot.queryParamMap.get('section');
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() || '';

    if (section && this.sectionToTab[section]) {
      this.activeTab = this.sectionToTab[section];
      if (this.activeTab !== 'geo') {
        this.lastPrimaryTab = this.activeTab;
      }
    }

    if (!q) {
      this.syncUrl();
      return;
    }

    if (this.activeTab === 'dns') {
      this.dnsForm.domain = q;
      this.validateDns();
    }
    else if (this.activeTab === 'shodan') {
      this.shodanForm.ip = q;
      this.validateShodan();
    }
    else if (this.activeTab === 'vuln') {
      this.vulnForm.ip = q;
      this.validateVulnerability();
    }
    else {
      this.geoForm.coordinates = q;
      this.validateGeo();
    }

    if (!this.formError) {
      queueMicrotask(() => {
        this.runToolbarSearch(); 
      });
    }
    else {
      this.syncUrl();
    }
  }

  validateDns(): void {
    this.formError = this.scanHelper.validateDnsInput(this.dnsForm.domain);
  }

  validateShodan(): void {
    this.formError = this.scanHelper.validateShodanInput(this.shodanForm.ip);
  }

  validateVulnerability(): void {
    this.formError = this.scanHelper.validateVulnerabilityInput(this.vulnForm.ip);
  }

  validateGeo(): void {
    this.formError = this.scanHelper.validateGeoCoordinatesInput(this.geoForm.coordinates);
  }

  setTab(id: 'dns' | 'shodan' | 'vuln' | 'geo'): void {
    if (this.isScanning()) {
      return;
    }
    this.activeTab = id;
    if (id !== 'geo') {
      this.lastPrimaryTab = id;
    }
    this.clearAll();
    this.syncUrl();
  }

  setGeoTab(): void {
    if (this.isScanning()) {
      return;
    }
    this.geoMode = 'coords';
    this.activeTab = 'geo';
    this.clearAll();
    this.syncUrl();
    this.openGeoCoordinatesModalFromStatus();
  }

  openGeoCoordinatesModal(): void {
    if (this.isScanning()) {
      return;
    }
    this.geoMode = 'coords';
    this.showGeoRangesModal = false;
    this.showGeoCoordinatesModal = true;
  }

  openGeoCoordinatesModalFromStatus(): void {
    this.geoMode = 'coords';
    this.showGeoRangesModal = false;
    this.showGeoCoordinatesModal = true;
  }

  onGeoCoordinatesChange(value: string): void {
    this.geoForm.coordinates = value;
    this.activeTab = 'geo';
    this.geoMode = 'coords';
    this.validateGeo();
    this.syncUrl();
  }

  openGeoRangesModal(): void {
    if (this.isScanning()) {
      return;
    }
    this.geoMode = 'ranges';
    this.showGeoCoordinatesModal = false;
    this.geoForm.ip_ranges = '';
    this.formError = null;
    this.parsedRanges = [];
    this.geoRangesSubmitAttempted = false;
    this.showGeoRangesModal = true;
  }

  getToolbarQuery(): string {
    if (this.activeTab === 'dns') {
      return this.dnsForm.domain;
    }
    if (this.activeTab === 'shodan') {
      return this.shodanForm.ip;
    }
    if (this.activeTab === 'vuln') {
      return this.vulnForm.ip;
    }
    return this.geoForm.coordinates;
  }

  setToolbarQuery(value: string): void {
    if (this.activeTab === 'dns') {
      this.dnsForm.domain = value;
      this.validateDns();
      this.syncUrl();
      return;
    }
    if (this.activeTab === 'shodan') {
      this.shodanForm.ip = value;
      this.validateShodan();
      this.syncUrl();
      return;
    }
    if (this.activeTab === 'vuln') {
      this.vulnForm.ip = value;
      this.validateVulnerability();
      this.syncUrl();
      return;
    }
    this.geoForm.coordinates = value;
    this.validateGeo();
    this.syncUrl();
  }

  getToolbarPlaceholder(): string {
    if (this.activeTab === 'dns') {
      return 'Search domain...';
    }
    if (this.activeTab === 'shodan') {
      return 'Search IP...';
    }
    if (this.activeTab === 'vuln') {
      return 'Search domain...';
    }
    return 'Search coordinates...';
  }

  getGeoRangePreview(): string {
    const ranges = this.geoForm.ip_ranges
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return ranges[0] || 'No IP ranges selected';
  }

  getGeoRangeExtraCount(): number {
    const ranges = this.geoForm.ip_ranges
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return Math.max(0, ranges.length - 1);
  }

  canDownloadReport(): boolean {
    if (this.isScanning() || this.isExportingReport) {
      return false;
    }
    if (this.activeTab === 'dns') {
      return Boolean(this.dnsResult?.ips?.length);
    }
    if (this.activeTab === 'shodan') {
      return Boolean(this.shodanResult);
    }
    if (this.activeTab === 'vuln') {
      return Boolean(this.vulnerabilityResult);
    }
    return Boolean(this.geoIpListResult?.ips?.length || this.geoResult?.cameras?.length || this.geoResult || this.geoLiveStats);
  }

  async downloadReport(): Promise<void> {
    try {
      this.isExportingReport = true;
      this.exportProgress = 6;
      this.exportCurrentStep = 'Preparing export...';
      await this.waitForPaint();

      if (this.activeTab === 'dns') {
        await this.loadAllDnsIpDetailsForExport();
      }

      this.exportProgress = Math.max(this.exportProgress, 96);
      this.exportCurrentStep = 'Generating report...';
      await this.waitForPaint();

      const payload = this.buildReportPayload();
      if (!payload) {
        return;
      }
      this.reportExport.exportByType(payload, 'doc_pdf');
    }
    finally {
      this.isExportingReport = false;
      this.exportProgress = 0;
      this.exportCurrentStep = '';
    }
  }

  runToolbarSearch(): void {
    if (this.activeTab === 'dns') {
      this.startDnsScan();
      return;
    }
    if (this.activeTab === 'shodan') {
      this.startShodanScan();
      return;
    }
    if (this.activeTab === 'vuln') {
      this.startVulnerabilityScan();
      return;
    }
    if (this.geoMode === 'coords') {
      this.startGeoScan();
    }
  }

  validateIpRanges(): void {
    const result = this.scanHelper.validateIpRanges(this.geoForm.ip_ranges);
    this.parsedRanges = result.parsedRanges;
    this.formError = result.error;
  }

  private clearAll(resetSearchState = true): void {
    this.dnsResult       = null;
    this.ipRows          = [];
    this.shodanResult    = null;
    this.vulnerabilityResult = null;
    this.geoIpListResult = null;
    this.geoIpRows       = [];
    this.geoResult       = null;
    this.geoLiveStats    = null;
    this.currentStep     = '';
    this.lastResultCount = 0;
    this.formError       = null;
    this.parsedRanges    = [];
    if (resetSearchState) {
      this.hasSearched = false;
    }
    this.scanHelper.onDone.set(null);
    this.scanHelper.onError.set(null);
    this.scanHelper.progress.set(0);
    this.scanHelper.isRunning.set(false);
  }

  cancel(): void {
    this.scanHelper.cancelCurrentScan();
    this.sub?.unsubscribe();
    this.sub          = undefined;
    this.geoLiveStats = null;
    this.currentStep  = '';
  }

  startDnsScan(): void {
    this.validateDns();
    if (this.formError || !this.dnsForm.domain.trim() || this.isScanning()) {
      return;
    }
    this.resetActiveWork();
    this.hasSearched = true;
    this.clearAll(false);
    this.syncUrl();
    this.sub = this.scanHelper.scanResolveIp(this.dnsForm.domain.trim());
    this.watchResult(this.parseDnsResult.bind(this));
  }

  private parseDnsResult(): void {
    const done = this.scanHelper.onDone();
    if (!done) {
      return;
    }
    this.currentStep = done.step || done.result?.step || done.status || done.result?.status || '';
    const payload = done.result ?? done;
    if (payload?.domain != null && Array.isArray(payload.ips)) {
      const existingRows = new Map(this.ipRows.map((row) => [row.ip, row]));
      this.dnsResult = { domain: payload.domain, ips: payload.ips };
      this.ipRows = payload.ips.map((ip: string) => existingRows.get(ip) ?? {
        ip, expanded: false, loading: false, progress: 0, step: null, detail: null, error: null,
      });
      this.lastResultCount = payload.ips.length;
    }
  }

  toggleIpRow(row: IpRowState): void {
    if (row.expanded) {
      row.expanded = false; return;
    }
    row.expanded = true;
    if (row.detail || row.loading) {
      return;
    }

    row.loading = true;
    row.progress = 5;
    row.step = 'queued';
    row.error   = null;
    this.enqueueDnsIpDetail(row);
  }

  startShodanScan(): void {
    this.validateShodan();
    if (this.formError || !this.shodanForm.ip.trim() || this.isScanning()) {
      return;
    }
    this.resetActiveWork();
    this.hasSearched = true;
    this.clearAll(false);
    this.syncUrl();
    this.sub = this.scanHelper.scanShodanIp(this.shodanForm.ip.trim());
    this.watchResult(this.parseShodanResult.bind(this));
  }

  startVulnerabilityScan(): void {
    this.validateVulnerability();
    if (this.formError || !this.vulnForm.ip.trim() || this.isScanning()) {
      return;
    }
    this.resetActiveWork();
    this.hasSearched = true;
    this.clearAll(false);
    this.syncUrl();
    this.sub = this.scanHelper.scanUrlVulnerability(this.vulnForm.ip.trim());
    this.watchResult(this.parseVulnerabilityResult.bind(this));
  }

  private parseShodanResult(): void {
    const done = this.scanHelper.onDone();
    if (!done) {
      return;
    }
    this.currentStep = done.step || done.result?.step || done.status || done.result?.status || '';
    const payload = done.result ?? done;
    if (payload?.ip) {
      this.shodanResult    = payload as IpDetail;
      this.lastResultCount = 1;
    }
  }

  private parseVulnerabilityResult(): void {
    const done = this.scanHelper.onDone();
    if (!done) {
      return;
    }
    this.currentStep = done.step || done.result?.step || done.status || done.result?.status || '';
    const payload = done.result ?? done;
    const status = String(payload?.status || done?.status || '').toLowerCase();
    const hasRenderablePayload =
      !!payload &&
      (
        typeof payload?.url === 'string' ||
        typeof payload?.host === 'string' ||
        !!payload?.summary ||
        Array.isArray(payload?.findings) ||
        Array.isArray(payload?.top_findings)
      );

    if (status === 'pending' || status === 'busy' || !hasRenderablePayload) {
      return;
    }

    if (payload) {
      this.vulnerabilityResult = payload;
      this.lastResultCount = payload?.summary?.total ?? payload?.findings?.length ?? payload?.top_findings?.length ?? 0;
    }
  }

  startGeoScan(): void {
    this.activeTab = 'geo';
    this.resetActiveWork();
    if (this.geoMode === 'coords') {
      this.validateGeo();
      if (this.formError || !this.geoForm.coordinates.trim() || this.isScanning()) {
        return;
      }
      this.hasSearched = true;
      this.clearAll(false);
      this.syncUrl();
      this.sub = this.scanHelper.scanGeoCamera(this.geoForm.coordinates.trim(),
        this.geoForm.radius_km,
        this.geoForm.max_ips);
    }
    else {
      this.geoRangesSubmitAttempted = true;
      this.validateIpRanges();
      if (this.formError || !this.geoForm.ip_ranges.trim() || this.isScanning()) {
        return;
      }
      const ranges = this.geoForm.ip_ranges
        .split('\n').map(l => l.trim()).filter(l => l.length > 0);
      this.showGeoRangesModal = false;
      this.geoRangesSubmitAttempted = false;
      this.hasSearched = true;
      this.clearAll(false);
      this.syncUrl();
      this.sub = this.scanHelper.scanGeoCameraByRanges(ranges,
        this.geoForm.max_ips);
    }
    this.watchResult(this.parseGeoResult.bind(this));
  }

  private parseGeoResult(): void {
    const done = this.scanHelper.onDone();
    if (!done) {
      return;
    }
    this.currentStep = done.step || done.result?.step || done.status || done.result?.status || '';
    const payload = done.result ?? done;

    if (Array.isArray(payload?.ips)) {
      this.geoIpListResult = {
        domain: payload.domain || this.geoForm.coordinates.trim() || 'geo-results',
        ips: payload.ips,
      };
      this.geoIpRows = payload.ips.map((ip: string) => ({
        ip, expanded: false, loading: false, progress: 0, step: null, detail: null, error: null,
      }));
      this.geoResult = null;
      this.geoLiveStats = null;
      this.lastResultCount = payload.count ?? payload.ips.length;
    }
    else if (payload?.cameras !== undefined) {
      this.geoResult       = payload as GeoResult;
      this.geoLiveStats    = null;
      this.lastResultCount = payload.cameras_found;
    }
    else {
      if (payload?.ips_extracted != null || payload?.ips_scanned != null || payload?.cameras_found != null) {
        this.geoLiveStats = {
          ips_extracted: payload.ips_extracted ?? 0,
          ips_scanned:   payload.ips_scanned   ?? 0,
          cameras_found: payload.cameras_found ?? 0,
        };
      }
    }
  }

  private watchResult(fn: () => void): void {
    fn();

    const id = setInterval(() => {
      fn();
      if (!this.isScanning()) {
        fn();
        clearInterval(id);
      }
    }, 200);

    this._intervals.push(id);
  }

  private syncUrl(): void {
    const query = this.getToolbarQuery().trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        section: this.tabToSection[this.activeTab],
        q: query || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }).then();
  }

  ngOnDestroy(): void {
    this.resetActiveWork();
    this.dnsIpDetailQueueSub?.unsubscribe();
    this.scanHelper.resetState();
  }

  private buildReportPayload(): GraphReportPayload | null {
    if (this.activeTab === 'dns' && this.dnsResult) {
      const now = new Date().toISOString();
      const nodes = [
        { id: `domain-${this.dnsResult.domain}`, label: this.dnsResult.domain, type: 'domain' },
        ...this.dnsResult.ips.map(ip => ({ id: `ip-${ip}`, label: ip, type: 'ip' as const }))
      ];
      const edges = this.dnsResult.ips.map(ip => ({
        id: `${this.dnsResult!.domain}-${ip}`,
        from: `domain-${this.dnsResult!.domain}`,
        to: `ip-${ip}`,
        label: 'resolves_to'
      }));

      return {
        graphKind: 'cti',
        title: 'Host Recon Report',
        sessionName: this.dnsResult.domain,
        generatedAtIso: now,
        nodes,
        edges,
        summary: {
          domain: this.dnsResult.domain,
          resolved_ips: this.dnsResult.ips.length,
          exported_at: now
        },
        tables: [
          {
            title: 'Resolved IPs',
            values: this.dnsResult.ips.reduce<Record<string, string>>((acc, ip, index) => {
              acc[`IP ${index + 1}`] = ip;
              return acc;
            }, {})
          },
          ...this.buildRawJsonTables(this.dnsResult, 'DNS Raw Result'),
          ...this.ipRows
            .filter(row => Boolean(row.detail))
            .flatMap((row, index) => [
              ...this.buildIpDetailTables(row.detail!, `IP ${index + 1}`),
              ...this.buildRawJsonTables(row.detail!, `IP ${index + 1} Raw Result`)
            ])
        ]
      };
    }

    if (this.activeTab === 'shodan' && this.shodanResult) {
      const now = new Date().toISOString();
      const detail = this.shodanResult;
      const nodes = [{ id: `ip-${detail.ip}`, label: detail.ip, type: 'ip' }];
      const edges: GraphReportPayload['edges'] = [];

      const addNode = (id: string, label: string, type: string, edgeLabel: string) => {
        if (!label) {
          return;
        }
        nodes.push({ id, label, type });
        edges.push({ id: `${nodes[0].id}-${id}`, from: nodes[0].id, to: id, label: edgeLabel });
      };

      addNode(`org-${detail.organization}`, detail.organization || '', 'organization', 'owned_by');
      addNode(`country-${detail.country}`, detail.country || '', 'country', 'located_in');
      addNode(`city-${detail.city}`, detail.city || '', 'city', 'city');

      return {
        graphKind: 'cti',
        title: 'IP Scan Report',
        sessionName: detail.ip,
        generatedAtIso: now,
        nodes,
        edges,
        summary: {
          ip: detail.ip,
          country: detail.country || '-',
          city: detail.city || '-',
          organization: detail.organization || '-',
          open_ports: detail.open_ports?.length ?? 0,
          vulnerabilities: detail.vulnerabilities?.length ?? 0,
          cameras: detail.cameras?.length ?? 0,
          exported_at: now
        },
        tables: [
          ...this.buildIpDetailTables(detail),
          ...this.buildRawJsonTables(detail, 'IP Raw Result')
        ]
      };
    }

    if (this.activeTab === 'geo' && (this.geoIpListResult || this.geoResult || this.geoLiveStats)) {
      const now = new Date().toISOString();
      if (this.geoIpListResult) {
        return {
          graphKind: 'cti',
          title: 'Geo IP Scan Report',
          sessionName: this.geoIpListResult.domain || 'geo-results',
          generatedAtIso: now,
          nodes: this.geoIpRows.slice(0, 100).map((row) => ({
            id: `ip-${row.ip}`,
            label: row.ip,
            type: 'ip'
          })),
          edges: [],
          summary: {
            mode: this.geoMode === 'coords' ? 'coordinates' : 'ip_ranges',
            query: this.geoMode === 'coords' ? (this.geoForm.coordinates.trim() || '-') : 'range_scan',
            total_ips: this.geoIpRows.length,
            exported_at: now
          },
          tables: [
            {
              title: 'Resolved IPs',
              values: this.geoIpRows.slice(0, 25).reduce<Record<string, string>>((acc, row, index) => {
                acc[`IP ${index + 1}`] = row.ip;
                return acc;
              }, {})
            },
            ...this.buildRawJsonTables(this.geoIpListResult, 'Geo IP Raw Result')
          ]
        };
      }

      const result = this.geoResult;
      const stats = this.geoLiveStats;
      const ranges = this.geoForm.ip_ranges.split('\n').map(line => line.trim()).filter(Boolean);
      const sessionName = this.geoMode === 'coords'
        ? (this.geoForm.coordinates.trim() || 'geo-coordinates')
        : (ranges[0] || 'geo-ranges');
      const cameras = result?.cameras || [];

      return {
        graphKind: 'cti',
        title: 'Geo Cameras Report',
        sessionName,
        generatedAtIso: now,
        nodes: cameras.slice(0, 100).map((camera, index) => ({
          id: `camera-${camera.ip || index}-${camera.port || 0}`,
          label: camera.ip || `Camera ${index + 1}`,
          type: 'camera'
        })),
        edges: [],
        summary: {
          mode: this.geoMode === 'coords' ? 'coordinates' : 'ip_ranges',
          query: this.geoMode === 'coords' ? (this.geoForm.coordinates.trim() || '-') : (ranges[0] || '-'),
          radius_km: this.geoForm.radius_km,
          max_ips: this.geoForm.max_ips,
          ips_extracted: result?.ips_extracted ?? stats?.ips_extracted ?? 0,
          ips_scanned: result?.ips_scanned ?? stats?.ips_scanned ?? 0,
          cameras_found: result?.cameras_found ?? stats?.cameras_found ?? 0,
          exported_at: now
        },
        tables: [
          {
            title: 'Query Configuration',
            values: this.geoMode === 'coords'
              ? {
                Coordinates: this.geoForm.coordinates.trim() || '-',
                'Radius (km)': String(this.geoForm.radius_km),
                'Max IPs': String(this.geoForm.max_ips)
              }
              : {
                'Range 1': ranges[0] || '-',
                'Additional Ranges': String(Math.max(0, ranges.length - 1)),
                'Max IPs': String(this.geoForm.max_ips)
              }
          },
          {
            title: 'Detected Cameras',
            values: cameras.slice(0, 25).reduce<Record<string, string>>((acc, camera, index) => {
              acc[`Camera ${index + 1}`] = [
                camera.ip || 'Unknown IP',
                camera.port ? `:${camera.port}` : '',
                camera.brand || camera.model || ''
              ].join(' ').trim();
              return acc;
            }, {})
          },
          ...this.buildRawJsonTables(result, 'Geo Cameras Raw Result'),
          ...this.buildRawJsonTables(stats, 'Geo Cameras Live Stats')
        ]
      };
    }

    if (this.activeTab === 'vuln' && this.vulnerabilityResult) {
      const now = new Date().toISOString();
      const result = this.vulnerabilityResult;
      const host = result.host || result.url || 'url-vulnerability-scan';
      const scannedUrls = Array.isArray(result.scanned_urls) ? result.scanned_urls : [];
      const findings = Array.isArray(result.findings)
        ? result.findings
        : Array.isArray(result.top_findings)
          ? result.top_findings
          : [];

      const nodes = [
        { id: `host-${host}`, label: host, type: 'domain' as const },
        ...scannedUrls.slice(0, 25).map((url: string, index: number) => ({
          id: `url-${index}`,
          label: url,
          type: 'url' as const
        }))
      ];
      const edges = scannedUrls.slice(0, 25).map((url: string, index: number) => ({
        id: `host-${host}-url-${index}`,
        from: `host-${host}`,
        to: `url-${index}`,
        label: 'scanned'
      }));

      return {
        graphKind: 'cti',
        title: 'URL Vulnerability Report',
        sessionName: host,
        generatedAtIso: now,
        nodes,
        edges,
        summary: {
          host: result.host || '-',
          url: result.url || '-',
          final_url: result.final_url || '-',
          request_mode: result.request_mode || '-',
          elapsed_seconds: typeof result.elapsed_seconds === 'number' ? result.elapsed_seconds.toFixed(1) : '-',
          total_findings: result.summary?.total ?? findings.length,
          critical: result.summary?.critical ?? 0,
          high: result.summary?.high ?? 0,
          medium: result.summary?.medium ?? 0,
          low: result.summary?.low ?? 0,
          informational: result.summary?.informational ?? 0,
          exported_at: now
        },
        tables: [
          {
            title: 'Request Information',
            values: {
              Host: result.host || '-',
              URL: result.url || '-',
              'Final URL': result.final_url || '-',
              'Request Mode': result.request_mode || '-',
              Elapsed: typeof result.elapsed_seconds === 'number' ? `${result.elapsed_seconds.toFixed(1)}s` : '-',
              'Max Minutes': this.normalizeReportValue(result.max_minutes)
            }
          },
          {
            title: 'Severity Summary',
            values: {
              Critical: String(result.summary?.critical ?? 0),
              High: String(result.summary?.high ?? 0),
              Medium: String(result.summary?.medium ?? 0),
              Low: String(result.summary?.low ?? 0),
              Informational: String(result.summary?.informational ?? 0),
              Total: String(result.summary?.total ?? findings.length)
            }
          },
          {
            title: 'Response Details',
            values: {
              'Status Code': this.normalizeReportValue(result.extracted?.status_code),
              Server: this.normalizeReportValue(result.extracted?.server),
              'Content Type': this.normalizeReportValue(result.extracted?.content_type),
              'Content Length': this.normalizeReportValue(result.extracted?.content_length),
              Redirect: this.normalizeReportValue(result.extracted?.redirect_location),
              Title: this.normalizeReportValue(result.extracted?.title)
            }
          },
          {
            title: 'Security Headers',
            values: this.toStringRecord(result.extracted?.security_headers)
          },
          {
            title: 'Interesting Headers',
            values: this.toStringRecord(result.extracted?.interesting_headers)
          },
          {
            title: 'Scanned URLs',
            values: scannedUrls.slice(0, 25).reduce((acc: Record<string, string>, url: string, index: number) => {
              acc[`URL ${index + 1}`] = url;
              return acc;
            }, {})
          },
          ...findings.slice(0, 20).map((finding: any, index: number) => ({
            title: `Finding ${index + 1}`,
            values: {
              Title: this.normalizeReportValue(finding?.title || finding?.header),
              Category: this.normalizeReportValue(finding?.category),
              Risk: this.normalizeReportValue(finding?.risk),
              Confidence: this.normalizeReportValue(finding?.confidence),
              Description: this.truncateReportText(finding?.description, 1000),
              URL: this.normalizeReportValue(finding?.url),
              Source: this.normalizeReportValue(finding?.source),
              Evidence: this.truncateReportText(finding?.evidence, 1000)
            }
          })),
          ...this.buildRawJsonTables(result, 'Vulnerability Raw Result')
        ].filter(table => Object.values(table.values).some((value) => {
          const normalized = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
          return Boolean(normalized) && normalized !== '-';
        }))
      };
    }

    return null;
  }

  private async loadAllDnsIpDetailsForExport(): Promise<void> {
    const pendingRows = this.ipRows.filter(row => !row.detail && !row.error);
    const total = pendingRows.length;

    if (!total) {
      this.exportProgress = 100;
      this.exportCurrentStep = 'Export is ready...';
      return;
    }

    let completed = 0;
    for (const row of pendingRows) {
      this.exportCurrentStep = `Loading details for ${row.ip}...`;
      this.exportProgress = Math.max(6, Math.min(95, Math.round((completed / total) * 100)));

      if (row.detail || row.error) {
        continue;
      }

      try {
        const detail = await this.scanHelper.fetchShodanIpDetail(row.ip);
        if (detail?.ip) {
          row.detail = detail as IpDetail;
        }
      }
      catch (error: any) {
        row.error = error?.message || 'Failed to load details';
      }

      completed += 1;
      this.exportProgress = Math.max(6, Math.min(100, Math.round((completed / total) * 100)));
    }

    this.exportCurrentStep = 'Export is ready...';
  }

  private resetActiveWork(): void {
    this._intervals.forEach(clearInterval);
    this._intervals = [];
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  private enqueueDnsIpDetail(row: IpRowState): void {
    this.dnsIpDetailQueue$.next(row);
  }

  private bindDnsIpDetailQueue(): void {
    this.dnsIpDetailQueueSub?.unsubscribe();
    this.dnsIpDetailQueueSub = this.dnsIpDetailQueue$.pipe(concatMap((row) => {
      if (!row || row.detail || row.error) {
        return EMPTY;
      }

      row.step = 'processing';

      return this.scanHelper.fetchShodanIpDetail$(row.ip, (response) => {
        row.progress = typeof response?.progress === 'number' ? Math.max(5, Math.min(99, Math.round(response.progress))) : row.progress;
        row.step = response?.['step'] || response?.result?.['step'] || response?.status || response?.result?.status || row.step;
      }).pipe(tap((detail) => {
        if (detail?.ip) {
          row.detail = detail as IpDetail;
          row.progress = 100;
          row.step = 'Done';
          row.loading = false;
        }
      }),
      catchError((error: any) => {
        row.loading = false;
        row.error = error?.message ?? 'Failed to load details';
        return EMPTY;
      }));
    })).subscribe();
  }

  private waitForPaint(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => {
      resolve(); 
    }));
  }

  private joinValues(values: unknown[] | undefined | null): string {
    const normalized = (values || [])
      .map(value => String(value ?? '').trim())
      .filter(Boolean);

    return normalized.length ? normalized.join(', ') : '-';
  }

  private toStringRecord(source: Record<string, unknown> | undefined | null): Record<string, string> {
    const entries = Object.entries(source || {})
      .map(([key, value]) => [key, this.normalizeReportValue(value)] as [string, string])
      .filter(([, value]) => Boolean(value));

    if (!entries.length) {
      return { Status: '-' };
    }

    return Object.fromEntries(entries);
  }

  private buildIpDetailTables(detail: IpDetail, prefix = ''): { title: string; values: Record<string, string> }[] {
    const titlePrefix = prefix ? `${prefix} ` : '';
    const cameraPorts = this.countCameraPorts(detail);
    const iotPorts = this.countIotPorts(detail);

    return [
      {
        title: `${titlePrefix}General Information`.trim(),
        values: {
          IP: detail.ip || '-',
          Country: detail.country || '-',
          City: detail.city || '-',
          Organization: detail.organization || '-',
          ISP: detail.isp || '-',
          ASN: detail.asn || '-',
          Hosting: detail.hosting_type || '-',
          'Cloud Provider': detail.cloud_provider || '-',
          'Cloud Region': detail.cloud_region || '-',
          'Cloud Service': detail.cloud_service || '-',
          'Web Server': detail.web_server || '-',
          Title: detail.title || '-',
          'Camera Detected': cameraPorts > 0 || !!detail.is_camera || (detail.cameras?.length ?? 0) > 0 ? 'Yes' : 'No',
          'Camera Ports': cameraPorts ? String(cameraPorts) : '-',
          'IoT Ports': iotPorts ? String(iotPorts) : '-',
        }
      },
      {
        title: `${titlePrefix}Exposure Summary`.trim(),
        values: {
          'Open Ports': this.joinValues(detail.open_ports),
          Technologies: this.joinValues(detail.web_technologies),
          Hostnames: this.joinValues(detail.hostnames),
          Vulnerabilities: this.joinValues((detail.vulnerabilities as any[] | undefined)?.map(item => this.formatReportVulnerability(item))),
          Misconfigurations: this.joinValues(detail.misconfigurations),
          Cameras: String(detail.cameras?.length ?? 0),
          'Camera Ports': cameraPorts ? String(cameraPorts) : '-',
          'IoT Ports': iotPorts ? String(iotPorts) : '-',
          'Camera Paths': this.joinValues(detail.camera_paths as unknown[] | undefined)
        }
      },
      {
        title: `${titlePrefix}Security & CDN`.trim(),
        values: {
          CDN: this.normalizeReportValue(detail.cdn),
          WAF: this.normalizeReportValue(detail.waf),
          'Load Balancer': this.normalizeReportValue(detail.load_balancer),
          HSTS: detail.hsts ? 'Yes' : 'No',
          Flags: this.joinValues(this.securityItems(detail.security))
        }
      },
      {
        title: `${titlePrefix}HTTP Headers`.trim(),
        values: this.toStringRecord(detail.http_headers)
      },
      {
        title: `${titlePrefix}Cache Headers`.trim(),
        values: this.toStringRecord(detail.cache_headers)
      },
      {
        title: `${titlePrefix}Allowed Methods`.trim(),
        values: {
          Methods: this.joinValues(detail.allowed_methods)
        }
      },
      {
        title: `${titlePrefix}Detected Cameras`.trim(),
        values: (detail.cameras || []).slice(0, 20).reduce<Record<string, string>>((acc, camera, index) => {
          acc[`Camera ${index + 1}`] = [
            detail.ip || 'Unknown IP',
            camera.port ? `:${camera.port}` : '',
            camera.brand || camera.model_hint || camera.model || 'Unknown',
            camera.service ? `(${camera.service})` : ''
          ].join(' ').trim();
          return acc;
        }, {})
      },
      ...this.buildPortDetailTables(detail, prefix)
    ].filter(table => Object.values(table.values).some(value => Boolean((value || '').trim()) && value.trim() !== '-'));
  }

  private buildPortDetailTables(detail: IpDetail, prefix = ''): { title: string; values: Record<string, string> }[] {
    const titlePrefix = prefix ? `${prefix} ` : '';

    return (detail.ports || []).slice(0, 12).map((port, index) => ({
      title: `${titlePrefix}Port ${port.port || index + 1} Details`.trim(),
      values: {
        Port: port.port ? String(port.port) : '-',
        Protocol: port.protocol || port.proto || '-',
        Service: port.service || '-',
        State: port.state || '-',
        'Is Camera': port['is_camera'] || port['device_type'] === 'camera' ? 'Yes' : 'No',
        'Is IoT': port['is_iot'] ? 'Yes' : 'No',
        'Device Type': this.normalizeReportValue(port['device_type']),
        'Device Category': this.normalizeReportValue(port['device_category']),
        'Device Vendor': this.normalizeReportValue(port['device_vendor']),
        'Device Family': this.normalizeReportValue(port['device_family']),
        'Device Model': this.normalizeReportValue(port['device_model']),
        'Device Version': this.normalizeReportValue(port['device_version']),
        'Device Tags': this.joinValues(port['device_tags']),
        'Device Confidence': this.normalizeReportValue(port['device_confidence']),
        'Fingerprint Source': this.normalizeReportValue(port['fingerprint_source']),
        'Fingerprint Match': this.normalizeReportValue(port['fingerprint_match']),
        'Protocol Verified': port['protocol_verified'] === undefined ? '-' : (port['protocol_verified'] ? 'Yes' : 'No'),
        CPE: this.normalizeReportValue(port['cpe']),
        Product: this.normalizeReportValue(port['product']),
        Version: this.normalizeReportValue(port['version']),
        Vendor: this.normalizeReportValue(port['vendor']),
        'Risk Flags': this.joinValues(port.risk_flags),
        Misconfigurations: this.joinValues(port.misconfigurations),
        Banner: this.truncateReportText(port.banner),
        'HTTP Server': this.normalizeReportValue(port.http?.server),
        'HTTP Title': this.normalizeReportValue(port.http?.title),
        'TLS Version': this.normalizeReportValue(port.tls?.version),
        'TLS Cipher': this.normalizeReportValue(port.tls?.cipher),
        'TLS Supported Versions': this.joinValues(port.tls?.supported_versions),
        'TLS Ciphers By Version': this.normalizeReportValue(port.tls?.['ciphers_by_version']),
        'Certificate CN': this.normalizeReportValue(port.tls?.cert_cn),
        'Certificate SAN': this.normalizeReportValue(port.tls?.san),
        'Certificate Issuer': this.normalizeReportValue(port.tls?.issuer),
        'Certificate Subject': this.normalizeReportValue(port.tls?.subject),
        'Certificate Serial': this.normalizeReportValue(port.tls?.serial_number),
        'Certificate Policies': this.joinValues(port.tls?.['certificate_policies']),
        'CA Issuers': this.joinValues(port.tls?.['ca_issuers']),
        'CRL Distribution Points': this.joinValues(port.tls?.['crl_distribution_points']),
        'SCTs': this.normalizeReportValue(port.tls?.['scts']),
        'Public Key': this.normalizeReportValue(port.tls?.public_key_algorithm
          ? `${port.tls.public_key_algorithm}${port.tls?.public_key_size ? ` (${port.tls.public_key_size} bit)` : ''}`
          : ''),
        'Signature Algorithm': this.normalizeReportValue(port.tls?.signature_algorithm),
        'Key Usage': this.joinValues(port.tls?.key_usage),
        'Extended Key Usage': this.joinValues(port.tls?.extended_key_usage),
        'Subject Key ID': this.normalizeReportValue(port.tls?.['subject_key_identifier']),
        'Authority Key ID': this.normalizeReportValue(port.tls?.['authority_key_identifier']),
        'SHA-256 Fingerprint': this.normalizeReportValue(port.tls?.fingerprint_sha256),
        'TLS Risk Flags': this.joinValues(port.tls?.risk_flags),
        'Weak Protocols': this.joinValues(port.tls?.weak_protocols),
        'Self Signed': port.tls?.is_self_signed === undefined ? '-' : (port.tls?.is_self_signed ? 'Yes' : 'No'),
        'Certificate CA': port.tls?.['is_ca'] === undefined ? '-' : (port.tls?.['is_ca'] ? 'Yes' : 'No'),
        'Certificate Expiry': this.normalizeReportValue(port.tls?.not_after || port.tls?.cert_expires),
        'Certificate Not Before': this.normalizeReportValue(port.tls?.not_before),
        'Discovered Paths': this.joinValues(port['discovered_paths']),
      }
    })).filter(table => Object.values(table.values).some(value => Boolean((value || '').trim()) && value.trim() !== '-'));
  }

  private buildRawJsonTables(source: unknown, title: string, chunkSize = 3500): { title: string; values: Record<string, string> }[] {
    if (source === null || source === undefined) {
      return [];
    }

    let json = '';
    try {
      json = JSON.stringify(source, null, 2);
    }
    catch {
      json = String(source);
    }

    if (!json.trim()) {
      return [];
    }

    const tables: { title: string; values: Record<string, string> }[] = [];
    for (let offset = 0, part = 1; offset < json.length; offset += chunkSize, part += 1) {
      tables.push({
        title: `${title} ${part}`.trim(),
        values: {
          JSON: json.slice(offset, offset + chunkSize)
        }
      });
    }

    return tables;
  }

  private truncateReportText(value: unknown, maxLength = 1200): string {
    const normalized = this.normalizeReportValue(value);
    if (!normalized || normalized === '-') {
      return '-';
    }
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  private normalizeReportValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map(item => this.normalizeReportValue(item)).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .map(([key, nested]) => {
          const normalized = this.normalizeReportValue(nested);
          return normalized ? `${key}: ${normalized}` : '';
        })
        .filter(Boolean)
        .join(', ');
    }
    return String(value).trim();
  }

  private formatReportVulnerability(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (value && typeof value === 'object') {
      const cve = typeof value.cve === 'string' ? value.cve.trim() : '';
      const cvss = value.cvss !== null && value.cvss !== undefined ? `CVSS ${value.cvss}` : '';
      return [cve, cvss].filter(Boolean).join(' • ');
    }
    return '';
  }

  private securityItems(sec: string[] | Record<string, boolean> | undefined | null): string[] {
    if (!sec) {
      return [];
    }
    if (Array.isArray(sec)) {
      return sec;
    }
    return Object.entries(sec).filter(([, value]) => value).map(([key]) => key);
  }

  private countCameraPorts(detail: IpDetail | null | undefined): number {
    return (detail?.ports || []).filter((port: any) => port && (port.is_camera || port.device_type === 'camera')).length;
  }

  private countIotPorts(detail: IpDetail | null | undefined): number {
    return (detail?.ports || []).filter((port: any) => port?.is_iot).length;
  }
}
