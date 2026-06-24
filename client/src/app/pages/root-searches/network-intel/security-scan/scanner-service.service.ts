import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScanNotificationService } from '../../../../shared/services/scan-notification.service';
@Injectable({ providedIn: 'root' })
export class ScannerService {
  private cancel$ = new Subject<void>();

  public first_load: boolean = true;

  constructor(private scanNotifications: ScanNotificationService) { }

  scanDomain(domain: string, scanType: string): Observable<any> {
    this.cancel$.next();
    const body = { domain, scanType };
    return this.scanNotifications.runApiScanAsResponse<any>({
      apiReference: 'urlscan/domain',
      payload: body,
      metadata: {
        title: `${scanType?.toUpperCase?.() || 'Domain'} Scan`,
        target: domain,
        section: scanType,
      },
      pollDelayMs: 5000,
    }).pipe(takeUntil(this.cancel$));
  }

  cancel(): void {
    this.cancel$.next();
  }
}
