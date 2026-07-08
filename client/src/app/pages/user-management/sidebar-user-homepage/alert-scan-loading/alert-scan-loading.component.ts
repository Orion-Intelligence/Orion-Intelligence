import { Component } from '@angular/core';
import { AlertService } from '../../../../services/alerts/alerts.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { NgClass } from '@angular/common';
import { AppService } from '../../../../services/core/app/app.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-alert-scan-loading',
  imports: [NgClass, TranslatePipe],
  templateUrl: './alert-scan-loading.component.html',
  animations: [
    trigger('scanOverlayAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('180ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    trigger('scanCardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        animate('260ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AlertScanLoadingComponent {
  constructor(private alertService: AlertService, protected licenseService: LicenseService, private appService: AppService) { }

  get isLightTheme(): boolean {
    return this.appService.userSessionData()?.user?.theme === 'light-theme';
  }

  cancelScan() {
    this.alertService.cancelScanIOCs();
  }
}
