import { Injectable } from '@angular/core';
import { Observable, Subject, timer, EMPTY } from 'rxjs';
import { expand, switchMap, takeWhile, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
@Injectable({ providedIn: 'root' })
export class ScannerService {
  private cancel$ = new Subject<void>();

  public first_load: boolean = true;

  constructor(private api: ApiService) { }

  scanDomain(domain: string, scanType: string): Observable<any> {
    this.cancel$.next();
    const body = { domain, scanType };
    return this.api.post<any>('urlscan/domain', body).pipe(takeUntil(this.cancel$), expand((res: any) => this.isPending(res)
      ? timer(5000).pipe(takeUntil(this.cancel$), switchMap(() => this.api.post<any>('urlscan/domain', body).pipe(takeUntil(this.cancel$))))
      : EMPTY), takeWhile((res: any) => this.isPending(res), true));
  }

  cancel(): void {
    this.cancel$.next();
  }

  private isPending(res: any): boolean {
    return (res?.status === 'pending' ||
            res?.result?.status === 'busy' ||
            res?.result?.status === 'pending');
  }
}
