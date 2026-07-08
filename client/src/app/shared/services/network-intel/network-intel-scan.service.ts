import { Injectable, inject, signal } from '@angular/core';
import { lastValueFrom, Observable, Subscription } from 'rxjs';
import { finalize, map, takeUntil, tap } from 'rxjs/operators';
import { GeoCameraResponse, NetworkIntelScanResponse, ResolveIpResponse } from '../../model/network-intel/network-intel-api.models';
import { IpPortData, VulnerabilityScanDepth } from '../../model/network-intel/network-intel.model';
import { ScanHelperMethodsService } from '../../partials/scan-helper-methods/scan-helper-methods-service.service';
import { ScanNotificationService } from '../scan-notification.service';
import { SubdomainResponse } from '../../model/scanners/scanner.models';

@Injectable({ providedIn: 'root' })
export class NetworkIntelScanService extends ScanHelperMethodsService {
  private readonly scanNotifications = inject(ScanNotificationService);

  isRunning = signal(false);

  protected override getPendingStatus<T extends { result?: { status?: string } | null; status?: string }>(res: T): string | undefined {
    const status = super.getPendingStatus(res);
    const payload = res as any;
    const progress = Number(payload?.result?.progress ?? payload?.progress);
    const step = String(payload?.result?.step ?? payload?.step ?? '').toLowerCase();
    if ((status === 'pending' || status === 'busy') && progress >= 100 && step.includes('done')) {
      return 'done';
    }
    return status;
  }

  resetState(): void {
    this.currentCancel$ = undefined;
    this.progress.set(0);
    this.isRunning.set(false);
    this.onDone.set(null);
    this.onError.set(null);
  }

  protected override beforeTaskStart(): void {
    this.isRunning.set(true);
  }

  protected override afterTaskStop(): void {
    this.isRunning.set(false);
  }

  protected override handleTaskValue<T>(value: T): void {
    const responseError = this.getResponseError(value);
    if (responseError) {
      this.onDone.set(null);
      this.onError.set(responseError);
      return;
    }
    super.handleTaskValue(value);
  }

  scanResolveIp(domain: string): Subscription {
    return this.runTrackedScan<ResolveIpResponse>('netintel/resolve_ip', { domain }, {
      title: 'Host Recon',
      target: domain,
      page_reference: 'network-intel',
      section: 'host-recon',
    });
  }

  scanShodanIp(ip: string): Subscription {
    return this.runTrackedScan<NetworkIntelScanResponse>('netintel/ipscanner', { ip }, {
      title: 'Deep IP Scan',
      target: ip,
      page_reference: 'network-intel',
      section: 'deep-scan',
    });
  }

  scanUrlVulnerability(domain: string, depth: VulnerabilityScanDepth): Subscription {
    return this.runTrackedScan<any>('netintel/url_vulnerability_scan', { domain, depth }, {
      title: 'URL Vulnerability Scan',
      target: domain,
      page_reference: 'network-intel',
      section: 'vulnerability-scan',
    });
  }

  async fetchShodanIpDetail(ip: string, onEach?: (response: NetworkIntelScanResponse) => void): Promise<any> {
    return this.fetchPolledResult<NetworkIntelScanResponse>(() => this.api.post<NetworkIntelScanResponse>('netintel/ipscanner', { ip }), onEach);
  }

  fetchShodanIpDetail$(ip: string, onEach?: (response: NetworkIntelScanResponse) => void): Observable<any> {
    return this.fetchPolledResult$<NetworkIntelScanResponse>(() => this.api.post<NetworkIntelScanResponse>('netintel/ipscanner', { ip }), onEach);
  }

  scanThreatLensGeoCamera(coordinates: string, radius_km = 25, max_ips = 200): Subscription {
    return this.runPolledTask<GeoCameraResponse>(() => this.api.post<GeoCameraResponse>('netintel/iot_detect', { coordinates, radius_km, max_ips }), 250);
  }

  scanGeoCamera(coordinates: string, radius_km = 25, max_ips = 200): Subscription {
    return this.runTrackedScan<GeoCameraResponse>('netintel/iot_detect', { coordinates, radius_km, max_ips }, {
      title: 'Geo Camera Scan',
      target: coordinates,
      page_reference: 'network-intel',
      section: 'geo-cameras',
    }, 250);
  }

  scanGeoCameraByRanges(ip_ranges: string[], max_ips = 200): Subscription {
    return this.runTrackedScan<GeoCameraResponse>('netintel/camera_detect_ranges', { ip_ranges, max_ips }, {
      title: 'Geo Camera Range Scan',
      target: ip_ranges.slice(0, 3).join(', '),
      page_reference: 'network-intel',
      section: 'geo-cameras',
    });
  }

  override scanSubdomains(resolved: string, checkLive: boolean): Subscription {
    return this.runTrackedScan<SubdomainResponse>('urlscan/subdomains', { domain: resolved, scanType: 'subdomains', checkLive }, {
      title: 'Subdomain Scan',
      target: resolved,
      page_reference: 'network-intel',
      section: 'vulnerability-scan',
    });
  }

  hasRenderableValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return true;
  }

  isEmbeddedInConsolidated(url: string): boolean {
    return url.includes('/consolidated');
  }

  getProgressValue(progress: number | null | undefined): number {
    return Math.max(6, Math.min(100, Math.round(progress || 0)));
  }

  getLoadingStepLabel(step: string | null | undefined): string {
    const raw = (step || '').trim();
    if (!raw) {
      return 'Scanning in progress...';
    }
    const normalized = raw.toLowerCase();
    if (normalized === 'queued' || normalized.includes('queue')) {
      return 'Queued: waiting for scanner availability...';
    }
    return raw;
  }

  shouldShowLoadingSkeleton(hasSearched: boolean, result: unknown, errorMessage: string | null | undefined, isScanning: boolean, progress: number | null | undefined): boolean {
    return hasSearched && !result && !errorMessage && (isScanning || (progress || 0) > 0);
  }

  validateDnsInput(value: string): string | null {
    const trimmed = this.getTrimmedInputOrNull(value);
    if (!trimmed) {
      return null;
    }
    if (this.getInputKind(trimmed) === 'ip') {
      return `"${trimmed}" is an IP address — enter a domain like netflix.com`;
    }
    if (!this.isValidDomain(trimmed)) {
      return 'Enter a valid domain name e.g. netflix.com';
    }
    return null;
  }

  validateShodanInput(value: string): string | null {
    const trimmed = this.getTrimmedInputOrNull(value);
    if (!trimmed) {
      return null;
    }
    const inputKind = this.getInputKind(trimmed);
    if (inputKind !== 'ip') {
      if (inputKind === 'domain') {
        return `"${trimmed}" is a domain — use Host Recon to resolve it first, then scan an IP`;
      }
      return 'Enter a valid IPv4 address e.g. 52.18.185.222';
    }
    return null;
  }

  validateVulnerabilityInput(value: string): string | null {
    const trimmed = this.getTrimmedInputOrNull(value);
    if (!trimmed) {
      return null;
    }
    const inputKind = this.getInputKind(trimmed);
    if (inputKind === 'domain') {
      return null;
    }
    if (inputKind === 'ip') {
      return `"${trimmed}" is an IP address. Enter a domain like bbc.com`;
    }
    if (inputKind === 'coordinates') {
      return `"${trimmed}" looks like coordinates. Enter a domain like bbc.com`;
    }
    return 'Enter a valid domain e.g. bbc.com';
  }

  validateGithubRepositoryInput(value: string): string | null {
    const trimmed = this.getTrimmedInputOrNull(value);
    if (!trimmed) {
      return null;
    }
    try {
      const url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed.replace(/^\/+/, '')}`);
      const host = url.hostname.toLowerCase();
      const pathParts = url.pathname.split('/').filter(Boolean);
      if ((host === 'github.com' || host === 'www.github.com') && pathParts.length >= 2) {
        return null;
      }
    }
    catch {
      return 'Enter a valid GitHub repository URL';
    }
    return 'Enter a valid GitHub repository URL';
  }

  validateGeoCoordinatesInput(value: string): string | null {
    const trimmed = this.getTrimmedInputOrNull(value);
    if (!trimmed) {
      return null;
    }
    const inputKind = this.getInputKind(trimmed);
    if (inputKind === 'ip') {
      return `"${trimmed}" is an IP address — enter coordinates like 31.48, 74.17`;
    }
    if (inputKind === 'domain') {
      return `"${trimmed}" is a domain — enter coordinates like 31.48, 74.17`;
    }
    if (!this.isValidCoordinates(trimmed)) {
      return 'Enter coordinates as: latitude, longitude — e.g. 31.48, 74.17';
    }
    return null;
  }

  validateIpRanges(value: string): { error: string | null; parsedRanges: { value: string; valid: boolean }[] } {
    const lines = value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      return { error: null, parsedRanges: [] };
    }

    const cidr = /^(\d{1,3}\.){3}\d{1,3}\/(\d|[12]\d|3[012])$/;
    const range = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
    const single = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isValidOctet = (ip: string) => ip.split('.').every(octet => parseInt(octet, 10) <= 255);
    const parsedRanges = lines.map(line => {
      const base = line.split('/')[0].split('-')[0];
      const valid = (cidr.test(line) || range.test(line) || single.test(line)) && isValidOctet(base);
      return { value: line, valid };
    });
    const invalid = parsedRanges.find(rangeItem => !rangeItem.valid);
    return {
      error: invalid ? 'Invalid format: use CIDR (x.x.x.x/n)' : null,
      parsedRanges
    };
  }

  safeEntries(obj: Record<string, any> | undefined | null): [string, any][] {
    if (!obj) {
      return [];
    }
    return Object.entries(obj).filter(([key, value]) => {
      if (!key?.trim()) {
        return false;
      }
      if (value === null || value === undefined || value === false) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return true;
    });
  }

  hasItems(arr: any[] | undefined | null): boolean {
    return Array.isArray(arr) && arr.length > 0;
  }

  renderablePorts(ports: IpPortData[] | undefined | null): IpPortData[] {
    return (ports || []).filter(port => this.hasPortDetail(port));
  }

  securityItems(sec: string[] | Record<string, boolean> | undefined | null): string[] {
    if (!sec) {
      return [];
    }
    if (Array.isArray(sec)) {
      return sec;
    }
    return Object.entries(sec).filter(([, value]) => value).map(([key]) => key);
  }

  private getResponseError(value: any): { message: string } | null {
    const status = this.getPendingStatus(value);
    if (status !== 'error') {
      return null;
    }
    return { message: value?.result?.message || value?.message || 'Request failed' };
  }

  private runPolledTask<T extends { result?: { status?: string; progress?: number } | null; status?: string; progress?: number | null }>(call: () => Observable<T>, pollDelayMs = this.pollDelayMs): Subscription {
    return this.runTask<T>((cancel$) => this.poll<T>(call, (response) => this.getPendingStatus(response), (response) => this.updateProgress(response?.result?.progress ?? response?.progress), cancel$, pollDelayMs));
  }

  private runTrackedScan<T extends { result?: { status?: string; progress?: number } | null; status?: string; progress?: number | null }>( apiReference: string, payload: Record<string, any>, metadata: Record<string, any>, pollDelayMs = this.pollDelayMs, ): Subscription {
    return this.runTask<T>((cancel$) => this.scanNotifications.runApiScanAsResponse<T>({
      apiReference,
      payload,
      metadata,
      pollDelayMs,
    }).pipe(tap((response: T) => this.updateProgress((response as any)?.result?.progress ?? (response as any)?.progress)),
      takeUntil(cancel$),));
  }

  private async fetchPolledResult<T extends { result?: { status?: string } | null; status?: string }>(call: () => Observable<T>, onEach?: (response: T) => void): Promise<any> {
    const cancel$ = this.createCancelSubject();
    try {
      const response = await lastValueFrom(this.poll<T>(call, (value) => this.getPendingStatus(value), (value) => onEach?.(value), cancel$, this.pollDelayMs));
      return this.unwrapPolledResult(response);
    }
    finally {
      this.completeCancelSubject(cancel$);
    }
  }

  private fetchPolledResult$<T extends { result?: { status?: string } | null; status?: string }>(call: () => Observable<T>, onEach?: (response: T) => void): Observable<any> {
    const cancel$ = this.createCancelSubject();
    return this.poll<T>(call, (value) => this.getPendingStatus(value), (value) => onEach?.(value), cancel$, this.pollDelayMs)
      .pipe(map((response) => this.unwrapPolledResult(response)), finalize(() => {
        this.completeCancelSubject(cancel$);
      }));
  }

  private unwrapPolledResult<T>(response: T): any {
    const responseError = this.getResponseError(response);
    if (responseError) {
      throw new Error(responseError.message);
    }
    return (response as any)?.result ?? response;
  }

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
    if (parts.length !== 2 || parts.some(part => part.trim() === '')) {
      return false;
    }
    const lat = Number(parts[0]);
    const lon = Number(parts[1]);
    return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  private getTrimmedInputOrNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed || null;
  }

  private getInputKind(value: string): 'ip' | 'domain' | 'coordinates' | 'other' {
    if (this.isValidIp(value)) {
      return 'ip';
    }
    if (this.isValidDomain(value)) {
      return 'domain';
    }
    if (this.isValidCoordinates(value) || value.includes(',')) {
      return 'coordinates';
    }
    return 'other';
  }

  private hasPortDetail(port: IpPortData | null | undefined): boolean {
    if (!port) {
      return false;
    }
    return Boolean(port.port ||
      port.protocol ||
      port.proto ||
      port.service ||
      port.state ||
      port.banner ||
      port.http ||
      port.tls ||
      (Array.isArray(port.risk_flags) && port.risk_flags.length));
  }
}
