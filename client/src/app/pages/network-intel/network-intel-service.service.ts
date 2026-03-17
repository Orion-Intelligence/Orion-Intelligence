import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, timer } from 'rxjs';
import { expand, finalize, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { ResolveIpResponse, NetworkIntelScanResponse, GeoCameraResponse } from '../../shared/model/network-intel/network-intel-api.models';
import { IpPortData } from '../../shared/model/network-intel/network-intel.model';

@Injectable({ providedIn: 'root' })
export class ScanHelperMethodsService {
  private currentCancel$?: Subject<boolean> = undefined;

  progress = signal(0);
  onDone   = signal<any>(null);
  onError  = signal<any>(null);

  constructor(private api: ApiService) {}

  resetState(): void {
    this.currentCancel$ = undefined;
    this.progress.set(0);
    this.onDone.set(null);
    this.onError.set(null);
  }

  cancelCurrentScan(): void {
    if (this.currentCancel$) {
      this.currentCancel$.next(true);
      this.currentCancel$.complete();
      this.resetState();
      this.onError.set({ message: 'Cancelled by user' });
    }
  }

  private isPendingOrBusy(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
  }

  private getResponseStatus(value: any): string | undefined {
    return value?.result?.status || value?.status;
  }

  private getResponseError(value: any): { message: string } | null {
    const status = this.getResponseStatus(value);
    if (status !== 'error') {
      return null;
    }
    return { message: value?.result?.message || value?.message || 'Request failed' };
  }

  private poll<T>( call: () => Observable<T>, getStatus: (v: T) => string | undefined, onEach: (v: T) => void, cancel$: Subject<boolean>, delayMs: number ): Observable<T> {
    const request$ = call().pipe(tap(onEach));
    return request$.pipe(expand((v: T) => {
      const status = getStatus(v);
      if (this.isPendingOrBusy(status)) {
        return timer(delayMs).pipe(switchMap(() => call().pipe(tap(onEach))));
      }
      return EMPTY;
    }),
    takeWhile((v: T) => this.isPendingOrBusy(getStatus(v)), true),
    takeUntil(cancel$));
  }

  private runTask<T>(build: (cancel$: Subject<boolean>) => Observable<T>): Subscription {
    this.progress.set(0);
    this.onDone.set(null);
    this.onError.set(null);

    const cancel$ = new Subject<boolean>();
    this.currentCancel$ = cancel$;

    const obs$ = build(cancel$).pipe(finalize(() => {
      this.progress.set(100);
      this.currentCancel$ = undefined;
    }));

    const sub = new Subscription();
    sub.add(obs$.subscribe({
      next:     (value) => {
        const responseError = this.getResponseError(value);
        if (responseError) {
          this.onDone.set(null);
          this.onError.set(responseError);
          return;
        }
        this.onDone.set(value);
      },
      error:    (err)   => {
        this.onError.set(err); 
      },
      complete: ()      => {
        this.currentCancel$ = undefined; 
      }
    }));
    sub.add(() => {
      cancel$.next(true);
      cancel$.complete();
      this.currentCancel$ = undefined;
    });

    return sub;
  }

  scanResolveIp(domain: string): Subscription {
    const call      = () => this.api.post<ResolveIpResponse>('netintel/resolve_ip', { domain });
    const getStatus = (res: ResolveIpResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: ResolveIpResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<ResolveIpResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<ResolveIpResponse>(build);
  }

  scanShodanIp(ip: string): Subscription {
    const call      = () => this.api.post<NetworkIntelScanResponse>('netintel/scanner', { ip });
    const getStatus = (res: NetworkIntelScanResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: NetworkIntelScanResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<NetworkIntelScanResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<NetworkIntelScanResponse>(build);
  }

  scanGeoCamera(coordinates: string, radius_km = 25, max_ips = 200): Subscription {
    const call      = () => this.api.post<GeoCameraResponse>('netintel/camera_detect', { coordinates, radius_km, max_ips });
    const getStatus = (res: GeoCameraResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: GeoCameraResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<GeoCameraResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<GeoCameraResponse>(build);
  }

  scanGeoCameraByRanges(ip_ranges: string[], max_ips = 200): Subscription {
    const call      = () => this.api.post<GeoCameraResponse>('netintel/camera_detect_ranges', { ip_ranges, max_ips });
    const getStatus = (res: GeoCameraResponse) => (res?.result?.status || res?.status) as any;
    const enhanced  = (res: GeoCameraResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') {
        this.progress.set(Math.min(99, p));
      }
    };
    const build = (cancel$: Subject<boolean>) =>
      this.poll<GeoCameraResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<GeoCameraResponse>(build);
  }

  isValidDomain(value: string): boolean {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(value)) {
      return false;
    }
    const domainPattern = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(value);
  }

  isValidIp(value: string): boolean {
    const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4.test(value)) {
      return false;
    }
    return value.split('.').every(octet => parseInt(octet, 10) <= 255);
  }

  isValidCoordinates(value: string): boolean {
    const parts = value.trim().split(/[\s,]+/);
    if (parts.length !== 2) {
      return false;
    }
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  validateDnsInput(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (this.isValidIp(trimmed)) {
      return `"${trimmed}" is an IP address — enter a domain like netflix.com`;
    }
    if (!this.isValidDomain(trimmed)) {
      return 'Enter a valid domain name e.g. netflix.com';
    }
    return null;
  }

  validateShodanInput(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (!this.isValidIp(trimmed)) {
      if (this.isValidDomain(trimmed)) {
        return `"${trimmed}" is a domain — use Host Recon to resolve it first, then scan an IP`;
      }
      return 'Enter a valid IPv4 address e.g. 52.18.185.222';
    }
    return null;
  }

  validateGeoCoordinatesInput(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    if (this.isValidIp(trimmed)) {
      return `"${trimmed}" is an IP address — enter coordinates like 31.48, 74.17`;
    }
    if (this.isValidDomain(trimmed)) {
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

  hasData(obj: Record<string, any> | undefined | null): boolean {
    return this.safeEntries(obj).length > 0;
  }

  hasItems(arr: any[] | undefined | null): boolean {
    return Array.isArray(arr) && arr.length > 0;
  }

  hasPortDetail(port: IpPortData | null | undefined): boolean {
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
}
