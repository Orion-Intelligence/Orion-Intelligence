import { Component } from '@angular/core';
import { AlertService } from '../../../../../services/alerts/alerts.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';
import { NgClass, NgIf } from '@angular/common';
import { AppService } from '../../../../../services/core/app/app.service';
@Component({
  selector: 'app-alert-scan-loading',
  imports: [NgIf, NgClass],
  templateUrl: './alert-scan-loading.component.html'
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
