import { Injectable, OnDestroy, signal } from '@angular/core';
import { switchMap, takeWhile, tap, timer } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../core/app/app.service';
import { Subscription } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AlertService implements OnDestroy {
  private isCheckingStatus = false;
  private hasAutoCheckedOnce = false;
  private scanStartSub?: Subscription;
  private scanStatusSub?: Subscription;

  isAlertScanLoading = signal<boolean>(true);

  constructor(protected apiService: ApiService, private appService: AppService) {
  }

  scanIOCs() {
    this.isAlertScanLoading.set(true);
    this.scanStartSub?.unsubscribe();
    this.scanStatusSub?.unsubscribe();
    this.scanStartSub = this.apiService.post<any>('profile/alert/scan', null).subscribe({
      next: () => {
        const stream = this.autoCheckScanStatus();
        if (!stream) {
          return;
        }
        this.scanStatusSub = stream.subscribe({
          next: (res: any) => {
            if (!res?.scan_running) {
              this.getLatestAlerts();
            }
          },
          error: (_) => {
            this.isAlertScanLoading.set(false);
          }
        });
      },
      error: (_) => {
        this.isAlertScanLoading.set(false);
      },
    });
  }

  cancelScanIOCs() {
    this.isAlertScanLoading.set(false);
    this.scanStatusSub?.unsubscribe();
    this.apiService.post<any>('profile/alert/scan/cancel', null).subscribe({
      next: (_) => {
        this.isAlertScanLoading.set(false);
      },
      error: (_) => {
        this.isAlertScanLoading.set(false);
      },
    });
  }

  getLatestAlerts() {
    this.apiService.get<any>('profile/alerts').subscribe({
      next: response => {
        this.appService.userSessionData.update(data => ({
          ...data,
          alerts: response
        }));
        this.isAlertScanLoading.set(false);
      },
      error: err => {
        if (err.status === 202) {
          this.isAlertScanLoading.set(true);
        }
        else {
          this.isAlertScanLoading.set(false);
        }
      }
    });
  }

  getScanStatus() {
    return this.apiService.post<any>('profile/alert/scan/status', {}).pipe(tap(res => {
      if (this.hasAutoCheckedOnce && res?.scan_running === false) {
        this.getLatestAlerts();
      }
      this.hasAutoCheckedOnce = true;
    }));
  }

  autoCheckScanStatus(intervalMs = 10000) {
    if (this.isCheckingStatus) {
      return;
    }
    this.isCheckingStatus = true;
    this.isAlertScanLoading.set(true);
    return timer(0, intervalMs).pipe(switchMap(() => this.getScanStatus()), takeWhile((res: any) => res?.scan_running === true, true), tap((res) => {
      if (!res?.scan_running) {
        this.isCheckingStatus = false;
        this.isAlertScanLoading.set(false);
      }
    }));
  }

  ngOnDestroy(): void {
    this.scanStartSub?.unsubscribe();
    this.scanStatusSub?.unsubscribe();
  }
}
