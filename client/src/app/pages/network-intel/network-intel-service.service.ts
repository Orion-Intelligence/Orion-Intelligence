import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, timer } from 'rxjs';
import { expand, finalize, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { ResolveIpResponse, NetworkIntelScanResponse, GeoCameraResponse } from '../../shared/model/network-intel/network-intel-api.models';

@Injectable({ providedIn: 'root' })
export class ScanHelperMethodsService {
  private currentCancel$?: Subject<boolean> = undefined;

  progress = signal(0);
  onDone   = signal<any>(null);
  onError  = signal<any>(null);

  constructor(private api: ApiService) {}

  cancelCurrentScan(): void {
    if (this.currentCancel$) {
      this.currentCancel$.next(true);
      this.currentCancel$.complete();
      this.currentCancel$ = undefined;
      this.progress.set(0);
      this.onDone.set(null);
      this.onError.set({ message: 'Cancelled by user' });
    }
  }

  private isPendingOrBusy(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
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
}
