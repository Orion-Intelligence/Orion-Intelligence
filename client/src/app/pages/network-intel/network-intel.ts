import { Component, OnDestroy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ScanHelperMethodsService } from './network-intel-service.service';
import { DnsResult, IpDetail, IpRowState, GeoResult, GeoLiveStats } from '../../shared/model/network-intel/network-intel.model';
import { EmptyQueryComponent } from '../../shared/partials/empty-query/empty-query.component';
import { fadeInDashboardItem } from '../../shared/animations/dashboard.item.animation';
import { GeoCoordinatesModalComponent } from './modal/geo-coordinates-modal/geo-coordinates-modal.component';
import { GeoRangesModalComponent } from './modal/geo-ranges-modal/geo-ranges-modal.component';
import { DnsSectionComponent } from './dns-section/dns-section.component';
import { ShodanSectionComponent } from './shodan-section/shodan-section.component';
import { GeoSectionComponent } from './geo-section/geo-section.component';

@Component({
  selector:    'app-network-intel',
  templateUrl: './network-intel.html',
  standalone:  true,
  imports:     [CommonModule, FormsModule, EmptyQueryComponent, GeoCoordinatesModalComponent, GeoRangesModalComponent, DnsSectionComponent, ShodanSectionComponent, GeoSectionComponent],
  animations:  [fadeInDashboardItem],
})
export class NetworkIntel implements OnInit, OnDestroy {
  private sub?: Subscription;
  private _intervals: ReturnType<typeof setInterval>[] = [];
  private readonly sectionToTab: Record<string, 'dns' | 'shodan' | 'geo'> = { 'host-recon': 'dns', 'deep-scan': 'shodan', 'geo-cameras': 'geo', };
  private readonly tabToSection: Record<'dns' | 'shodan' | 'geo', string> = { dns: 'host-recon', shodan: 'deep-scan', geo: 'geo-cameras', };

  readonly progressSegments = Array.from({ length: 20 }, (_, index) => index);
  activeTab: 'dns' | 'shodan' | 'geo' = 'dns';
  geoMode:   'coords' | 'ranges'      = 'coords';
  dnsForm    = { domain: '' };
  shodanForm = { ip: '' };
  geoForm    = { coordinates: '', radius_km: 25, max_ips: 200, ip_ranges: '' };
  formError: string | null = null;
  parsedRanges: { value: string; valid: boolean }[] = [];
  dnsResult:       DnsResult | null = null;
  ipRows:          IpRowState[]     = [];
  shodanResult:    IpDetail | null  = null;
  geoResult:       GeoResult | null    = null;
  geoLiveStats:    GeoLiveStats | null = null;
  currentStep      = '';
  lastResultCount = 0;
  hasSearched = false;
  showGeoCoordinatesModal = false;
  showGeoRangesModal = false;
  isScanning = computed(() =>
    this.scanHelper.progress() > 0 &&
    this.scanHelper.progress() < 100 &&
    !this.scanHelper.onError());

  constructor( public scanHelper: ScanHelperMethodsService, private route: ActivatedRoute, private router: Router, ) {}

  ngOnInit(): void {
    this.scanHelper.resetState();

    const section = this.route.snapshot.queryParamMap.get('section');
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() || '';

    if (section && this.sectionToTab[section]) {
      this.activeTab = this.sectionToTab[section];
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
    else {
      this.geoForm.coordinates = q;
      this.validateGeo();
    }

    if (!this.formError) {
      queueMicrotask(() => this.runToolbarSearch());
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

  validateGeo(): void {
    this.formError = this.scanHelper.validateGeoCoordinatesInput(this.geoForm.coordinates);
  }

  setTab(id: 'dns' | 'shodan' | 'geo'): void {
    if (this.isScanning()) {
      return;
    }
    this.activeTab = id;
    this.clearAll();
    this.syncUrl();
  }

  openGeoCoordinatesModal(): void {
    if (this.isScanning()) {
      return;
    }
    this.geoMode = 'coords';
    this.showGeoRangesModal = false;
    this.showGeoCoordinatesModal = true;
  }

  openGeoRangesModal(): void {
    if (this.isScanning()) {
      return;
    }
    this.geoMode = 'ranges';
    this.showGeoCoordinatesModal = false;
    this.showGeoRangesModal = true;
  }

  getToolbarQuery(): string {
    if (this.activeTab === 'dns') {
      return this.dnsForm.domain;
    }
    if (this.activeTab === 'shodan') {
      return this.shodanForm.ip;
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
    return 'Search coordinates...';
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
      this.dnsResult = { domain: payload.domain, ips: payload.ips };
      this.ipRows = payload.ips.map((ip: string) => ({
        ip, expanded: false, loading: false, detail: null, error: null,
      }));
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
    row.error   = null;

    const sub = this.scanHelper.scanShodanIp(row.ip);

    const interval = setInterval(() => {
      const done = this.scanHelper.onDone();
      const err  = this.scanHelper.onError();

      if (err) {
        row.loading = false;
        row.error   = err?.message ?? 'Failed to load details';
        clearInterval(interval);
        sub.unsubscribe();
        return;
      }

      if (done) {
        const payload = done.result ?? done;
        if (payload?.ip) {
          row.detail  = payload as IpDetail;
          row.loading = false;
          clearInterval(interval);
          sub.unsubscribe();
        }
      }
    }, 400);

    this._intervals.push(interval);
  }

  startShodanScan(): void {
    this.validateShodan();
    if (this.formError || !this.shodanForm.ip.trim() || this.isScanning()) {
      return;
    }
    this.hasSearched = true;
    this.clearAll(false);
    this.syncUrl();
    this.sub = this.scanHelper.scanShodanIp(this.shodanForm.ip.trim());
    this.watchResult(this.parseShodanResult.bind(this));
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

  startGeoScan(): void {
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
      this.validateIpRanges();
      if (this.formError || !this.geoForm.ip_ranges.trim() || this.isScanning()) {
        return;
      }
      const ranges = this.geoForm.ip_ranges
        .split('\n').map(l => l.trim()).filter(l => l.length > 0);
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

    if (payload?.cameras !== undefined) {
      this.geoResult       = payload as GeoResult;
      this.geoLiveStats    = null;
      this.lastResultCount = payload.cameras_found;
    }
    else {
      if (done.ips_extracted != null || done.ips_scanned != null) {
        this.geoLiveStats = {
          ips_extracted: done.ips_extracted ?? 0,
          ips_scanned:   done.ips_scanned   ?? 0,
          cameras_found: done.cameras_found ?? 0,
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
    this._intervals.forEach(clearInterval);
    this.sub?.unsubscribe();
    this.scanHelper.resetState();
  }
}
