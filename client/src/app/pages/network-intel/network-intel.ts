import { Component, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { Subscription } from 'rxjs';
import { ScanHelperMethodsService } from './network-intel-service.service';
import { DnsResult, IpDetail, IpRowState, GeoResult, GeoLiveStats } from '../../shared/model/network-intel/network-intel.model';

@Component({
  selector:    'app-network-intel',
  templateUrl: './network-intel.html',
  standalone:  true,
  imports:     [CommonModule, FormsModule, NgOptimizedImage],
})
export class NetworkIntel implements OnDestroy {
  private sub?: Subscription;
  private _intervals: ReturnType<typeof setInterval>[] = [];

  readonly progressSegments = Array.from({ length: 20 }, (_, index) => index);
  activeTab: 'dns' | 'shodan' | 'geo' = 'dns';
  geoMode:   'coords' | 'ranges'      = 'coords';
  dnsForm    = { domain: '' };
  shodanForm = { ip: '' };
  geoForm    = { coordinates: '', radius_km: 25, max_ips: 200, ip_ranges: '' };
  formError: string | null = null;
  parsedRanges: { value: string; valid: boolean }[] = [];
  readonly countryPresets = [ { code: 'PK', flag: '🇵🇰', label: 'Pakistan', ranges: ['39.32.0.0/11','103.4.0.0/14','111.68.0.0/14','119.152.0.0/13'] }, { code: 'US', flag: '🇺🇸', label: 'USA', ranges: ['3.0.0.0/8','4.0.0.0/8','8.0.0.0/8','12.0.0.0/8'] }, { code: 'GB', flag: '🇬🇧', label: 'UK', ranges: ['2.24.0.0/13','5.0.0.0/8','81.0.0.0/11'] }, { code: 'IN', flag: '🇮🇳', label: 'India', ranges: ['1.0.0.0/8','14.0.0.0/8','27.0.0.0/8','106.0.0.0/8'] }, { code: 'DE', flag: '🇩🇪', label: 'Germany', ranges: ['2.0.0.0/8','5.0.0.0/8','31.0.0.0/8'] }, { code: 'AE', flag: '🇦🇪', label: 'UAE', ranges: ['5.8.0.0/14','31.12.0.0/14','37.8.0.0/13'] }, { code: 'SA', flag: '🇸🇦', label: 'Saudi Arabia', ranges: ['31.168.0.0/12','78.100.0.0/14','188.48.0.0/13'] }, { code: 'CN', flag: '🇨🇳', label: 'China', ranges: ['14.0.0.0/8','27.0.0.0/8','36.0.0.0/8'] }, { code: 'RU', flag: '🇷🇺', label: 'Russia', ranges: ['5.0.0.0/8','31.0.0.0/8','37.0.0.0/8'] }, { code: 'TR', flag: '🇹🇷', label: 'Turkey', ranges: ['31.0.0.0/9','78.0.0.0/9','88.0.0.0/9'] }, ];
  dnsResult:       DnsResult | null = null;
  ipRows:          IpRowState[]     = [];
  shodanResult:    IpDetail | null  = null;
  geoResult:       GeoResult | null    = null;
  geoLiveStats:    GeoLiveStats | null = null;
  currentStep      = '';
  lastResultCount: number | null = null;
  isScanning = computed(() =>
    this.scanHelper.progress() > 0 &&
    this.scanHelper.progress() < 100 &&
    !this.scanHelper.onError());

  constructor(public scanHelper: ScanHelperMethodsService) {}

  private isValidDomain(value: string): boolean {

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(value)) {
      return false;
    }
    const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(value);
  }

  private isValidIp(value: string): boolean {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4.test(value)) {
      return false;
    }
    return value.split('.').every(octet => parseInt(octet, 10) <= 255);
  }

  private isValidCoordinates(value: string): boolean {

    const parts = value.trim().split(/[\s,]+/);
    if (parts.length !== 2) {
      return false;
    }
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  validateDns(): void {
    const v = this.dnsForm.domain.trim();
    if (!v) {
      this.formError = null; return;
    }
    if (this.isValidIp(v))      {
      this.formError = `"${v}" is an IP address — enter a domain like netflix.com`; return;
    }
    if (!this.isValidDomain(v)) {
      this.formError = 'Enter a valid domain name e.g. netflix.com'; return;
    }
    this.formError = null;
  }

  validateShodan(): void {
    const v = this.shodanForm.ip.trim();
    if (!v) {
      this.formError = null; return;
    }
    if (!this.isValidIp(v)) {
      if (this.isValidDomain(v)) {
        this.formError = `"${v}" is a domain — use Host Recon to resolve it first, then scan an IP`;
      }
      else {
        this.formError = 'Enter a valid IPv4 address e.g. 52.18.185.222';
      }
      return;
    }
    this.formError = null;
  }

  validateGeo(): void {
    const v = this.geoForm.coordinates.trim();
    if (!v) {
      this.formError = null; return;
    }
    if (this.isValidIp(v)) {
      this.formError = `"${v}" is an IP address — enter coordinates like 31.48, 74.17`;
      return;
    }
    if (this.isValidDomain(v)) {
      this.formError = `"${v}" is a domain — enter coordinates like 31.48, 74.17`;
      return;
    }
    if (!this.isValidCoordinates(v)) {
      this.formError = 'Enter coordinates as: latitude, longitude — e.g. 31.48, 74.17';
      return;
    }
    this.formError = null;
  }

  setTab(id: 'dns' | 'shodan' | 'geo'): void {
    if (this.isScanning()) {
      return;
    }
    this.activeTab = id;
    this.clearAll();
  }

  setGeoMode(mode: 'coords' | 'ranges'): void {
    if (this.isScanning()) {
      return;
    }
    this.geoMode      = mode;
    this.formError    = null;
    this.parsedRanges  = [];
  }

  get ipRangeCount(): number {
    return this.geoForm.ip_ranges
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0).length;
  }

  addCountryPreset(code: string): void {
    const preset = this.countryPresets.find(c => c.code === code);
    if (!preset) {
      return;
    }
    const existing  = this.geoForm.ip_ranges.trim();
    const toAdd     = preset.ranges.join('\n');
    this.geoForm.ip_ranges = existing ? existing + '\n' + toAdd : toAdd;
    this.validateIpRanges();
  }

  validateIpRanges(): void {
    const lines = this.geoForm.ip_ranges
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      this.formError = null; this.parsedRanges = []; return;
    }

    const cidr   = /^(\d{1,3}\.){3}\d{1,3}\/(\d|[12]\d|3[012])$/;
    const range  = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
    const single = /^(\d{1,3}\.){3}\d{1,3}$/;

    const isValidOctet = (ip: string) =>
      ip.split('.').every(o => parseInt(o, 10) <= 255);

    this.parsedRanges = lines.map(line => {
      const base = line.split('/')[0].split('-')[0];
      const valid = (cidr.test(line) || range.test(line) || single.test(line))
                      && isValidOctet(base);
      return { value: line, valid };
    });

    const invalid = this.parsedRanges.filter(r => !r.valid);
    this.formError = invalid.length
      ? `Invalid format: "${invalid[0].value}" — use CIDR (x.x.x.x/n), range (x.x.x.x-x.x.x.x), or single IP`
      : null;
  }

  private clearAll(): void {
    this.dnsResult       = null;
    this.ipRows          = [];
    this.shodanResult    = null;
    this.geoResult       = null;
    this.geoLiveStats    = null;
    this.currentStep     = '';
    this.lastResultCount = null;
    this.formError       = null;
    this.parsedRanges    = [];
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
    this.clearAll();
    this.sub = this.scanHelper.scanResolveIp(this.dnsForm.domain.trim());
    this.watchResult(this.parseDnsResult.bind(this));
  }

  private parseDnsResult(): void {
    const done = this.scanHelper.onDone();
    if (!done) {
      return;
    }
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
    this.clearAll();
    this.sub = this.scanHelper.scanShodanIp(this.shodanForm.ip.trim());
    this.watchResult(this.parseShodanResult.bind(this));
  }

  private parseShodanResult(): void {
    const done = this.scanHelper.onDone();
    if (!done) {
      return;
    }
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
      this.clearAll();
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
      this.clearAll();
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
    const payload = done.result ?? done;

    if (payload?.cameras !== undefined) {
      this.geoResult       = payload as GeoResult;
      this.geoLiveStats    = null;
      this.lastResultCount = payload.cameras_found;
    }
    else {
      if (done.step) {
        this.currentStep = done.step;
      }
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

  safeEntries(obj: Record<string, any> | undefined | null): [string, any][] {
    if (!obj) {
      return [];
    }
    return Object.entries(obj).filter(([, v]) =>
      v !== null && v !== undefined && v !== '' && v !== false);
  }

  hasData(obj: Record<string, any> | undefined | null): boolean {
    return this.safeEntries(obj).length > 0;
  }

  hasItems(arr: any[] | undefined | null): boolean {
    return Array.isArray(arr) && arr.length > 0;
  }

  securityItems(sec: string[] | Record<string, boolean> | undefined | null): string[] {
    if (!sec) {
      return [];
    }
    if (Array.isArray(sec)) {
      return sec;
    }
    return Object.entries(sec).filter(([, v]) => v).map(([k]) => k);
  }

  trackByIp(_: number, row: IpRowState): string {
    return row.ip;
  }

  isProgressSegmentActive(index: number): boolean {
    return index < Math.ceil(this.scanHelper.progress() / 5);
  }

  ngOnDestroy(): void {
    this._intervals.forEach(clearInterval);
    this.sub?.unsubscribe();
    this.scanHelper.cancelCurrentScan();
  }
}
