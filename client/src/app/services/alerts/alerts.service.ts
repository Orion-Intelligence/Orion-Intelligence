import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, of, switchMap, takeWhile, tap, timer } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../core/app/app.service';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    isAlertScanLoading$ = new BehaviorSubject<boolean>(false);
    private isCheckingStatus = false;

    constructor(protected apiService: ApiService, private appService: AppService, private router: Router) { }

    scanIOCs() {
        this.isAlertScanLoading$.next(true)
        this.apiService.post<any>('profile/alert/scan', null).subscribe({
            next: (response) => {
                console.log('Alert Scan Job Completed:', response);
                const status = response?.status || 'unknown';
                const totalDuration = response?.total_duration_seconds;

                let successMessage = `IOC Scan completed.`;

                if (typeof totalDuration === 'number') {
                    successMessage = `IOC Scan completed in ${totalDuration.toFixed(2)} seconds.`;
                }

                if (status === 'completed_with_errors') {
                    successMessage += ' Some scans completed with errors.';
                }
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
                this.appService.userProfile().alerts = response
                this.isAlertScanLoading$.next(false)
            }
        })
    }

    getScanStatus() {
        return this.apiService.post<any>('profile/alert/scan/status', {});
    }

    autoCheckScanStatus(intervalMs = 10000) {
        if (this.isCheckingStatus) {
            return;
        }
        this.isCheckingStatus = true;
        return timer(0, intervalMs).pipe(
            switchMap(() => this.getScanStatus()),
            takeWhile((res: any) => res.scan_running === true, true),
            tap((res) => {
                if (!res.scan_running) {
                    this.isCheckingStatus = false;
                }
            })
        );
    }
}
