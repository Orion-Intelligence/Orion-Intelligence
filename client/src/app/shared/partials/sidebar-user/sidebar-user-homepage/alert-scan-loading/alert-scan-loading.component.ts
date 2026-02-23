import { Component } from '@angular/core';
import { AlertService } from '../../../../../services/alerts/alerts.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';
import { NgClass, NgIf } from '@angular/common';
@Component({
  selector: 'app-alert-scan-loading',
  imports: [NgIf, NgClass],
  templateUrl: './alert-scan-loading.component.html'
})
export class AlertScanLoadingComponent {
  constructor(private alertService: AlertService, protected licenseService: LicenseService) { }

  get isLightTheme(): boolean {
    return document.body.classList.contains('light-theme') || localStorage.getItem('theme') === 'light-theme';
  }

  cancelScan() {
    this.alertService.cancelScanIOCs();
  }
}
