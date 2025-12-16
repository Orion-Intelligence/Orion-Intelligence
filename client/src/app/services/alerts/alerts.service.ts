import { Injectable } from '@angular/core';
import { BehaviorSubject, switchMap, takeWhile, tap, timer } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../core/app/app.service';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    isAlertScanLoading$ = new BehaviorSubject<boolean>(false);
    private isCheckingStatus = false;
    private hasAutoCheckedOnce = false;

    constructor(protected apiService: ApiService, private appService: AppService) { }

    scanIOCs() {
        this.isAlertScanLoading$.next(true)
        this.apiService.post<any>('profile/alert/scan', null).subscribe({
            next: (_) => {
                this.getLatestAlerts();
            },
            error: (err) => {
                console.error('Scan failed with an error:', err);
                alert(err?.error?.detail || 'IOC Scan failed to start or complete.');
                this.isAlertScanLoading$.next(false)
            },
        });
    }

    getLatestAlerts() {
        this.apiService.get<any>('profile/alerts').subscribe({
            next: response => {
                this.appService.userSessionData().alerts = response
                this.isAlertScanLoading$.next(false)
            }
        })
    }

    getScanStatus() {
        return this.apiService.post<any>('profile/alert/scan/status', {});
    }

    autoCheckScanStatus(intervalMs = 10000) {
        if (this.hasAutoCheckedOnce || this.isCheckingStatus) {
            return;
        }
        this.hasAutoCheckedOnce = true;
        this.isCheckingStatus = true;
        this.isAlertScanLoading$.next(true);
        return timer(0, intervalMs).pipe(
            switchMap(() => this.getScanStatus()),
            takeWhile((res: any) => res.scan_running === true, true),
            tap((res) => {
                if (!res.scan_running) {
                    this.isCheckingStatus = false;
                    this.isAlertScanLoading$.next(false);
                }
            })
        );
    }
}
