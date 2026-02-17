import { Injectable, signal } from '@angular/core';
import { EMPTY, Observable, Subject, Subscription, timer } from 'rxjs';
import { expand, finalize, switchMap, takeUntil, takeWhile, tap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { DnsResponse, SubdomainResponse, WaybackResponse } from '../../model/scanners/scanner.models';

@Injectable({ providedIn: 'root' })
export class ScanHelperMethodsService {
  progress = signal(0);
  onDone = signal<any>(null);
  onError = signal<any>(null);

  private currentCancel$?: Subject<boolean> = undefined;

  constructor(private api: ApiService) { }

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

  private poll<T>(call: () => Observable<T>, getStatus: (v: T) => string | undefined, onEach: (v: T) => void, cancel$: Subject<boolean>, delayMs: number): Observable<T> {
    const request$ = call().pipe(tap(onEach));
    return request$.pipe(
      expand((v: T) => {
        const status = getStatus(v);
        if (this.isPendingOrBusy(status)) return timer(delayMs).pipe(
          switchMap(() => call().pipe(tap(onEach)))
        );
        return EMPTY;
      }),
      takeWhile((v: T) => this.isPendingOrBusy(getStatus(v)), true),
      takeUntil(cancel$)
    );
  }

  private runTask<T>(build: (cancel$: Subject<boolean>) => Observable<T>): Subscription {
    this.progress.set(0);
    this.onDone.set(null);
    this.onError.set(null);

    const cancel$ = new Subject<boolean>();
    this.currentCancel$ = cancel$;

    const obs$ = build(cancel$).pipe(
      finalize(() => {
        this.progress.set(100);
        this.currentCancel$ = undefined;
      })
    );

    const sub = new Subscription();
    sub.add(obs$.subscribe({
      next: (value) => {
        this.onDone.set(value);
      },
      error: (err) => {
        this.onError.set(err);
      },
      complete: () => {
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

  scanSubdomains(resolved: string, checkLive: boolean): Subscription {
    const call = () => this.api.post<SubdomainResponse>('urlscan/subdomains', { domain: resolved, scanType: 'subdomains', checkLive });
    const getStatus = (res: SubdomainResponse) => (res?.result?.status || res?.status) as any;
    const enhanced = (res: SubdomainResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') this.progress.set(Math.min(99, p));
    };
    const build = (cancel$: Subject<boolean>) => this.poll<SubdomainResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<SubdomainResponse>(build);
  }

  scanDns(ip: string): Subscription {
    const call = () => this.api.post<DnsResponse>('urlscan/dns', { domain: ip, scanType: 'dns' });
    const getStatus = (res: DnsResponse) => res?.status;
    const enhanced = (res: DnsResponse) => {
      const p = res?.progress;
      if (p != null && typeof p === 'number') this.progress.set(Math.min(99, p));
    };
    const build = (cancel$: Subject<boolean>) => this.poll<DnsResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<DnsResponse>(build);
  }

  scanWayback(resolved: string): Subscription {
    const call = () => this.api.post<WaybackResponse>('urlscan/wayback', { domain: resolved, scanType: 'wayback' });
    const getStatus = (res: WaybackResponse) => (res?.result?.status || res?.status) as any;
    const enhanced = (res: WaybackResponse) => {
      const p = (res as any)?.progress;
      if (p != null && typeof p === 'number') this.progress.set(Math.min(99, p));
    };
    const build = (cancel$: Subject<boolean>) => this.poll<WaybackResponse>(call, getStatus, enhanced, cancel$, 4000);
    return this.runTask<WaybackResponse>(build);
  }
}
