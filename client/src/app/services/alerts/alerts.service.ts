import { Injectable, signal } from '@angular/core';
import { switchMap, takeWhile, tap, timer } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../core/app/app.service';
@Injectable({
    providedIn: 'root'
})
export class AlertService {
    isAlertScanLoading = signal<boolean>(true);
    private isCheckingStatus = false;
    private hasAutoCheckedOnce = false;
    constructor(protected apiService: ApiService, private appService: AppService) {
    }
    scanIOCs() {
        this.isAlertScanLoading.set(true);
        this.apiService.post<any>('profile/alert/scan', null).subscribe({
            next: () => {
                this.autoCheckScanStatus()?.subscribe({
                    next: (res: any) => {
                        if (!res?.scan_running) {
                            this.getLatestAlerts();
                        }
                    },
                    error: (err) => {
                        this.isAlertScanLoading.set(false);
                    }
                });
            },
            error: (err) => {
                this.isAlertScanLoading.set(false);
            },
        });
    }
    cancelScanIOCs() {
        this.apiService.post<any>('profile/alert/scan/cancel', null).subscribe({
            next: (_) => {
                this.isAlertScanLoading.set(false);
            },
            error: (err) => {
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
            if (res?.scan_running === false) {
                this.getLatestAlerts();
            }
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
}
