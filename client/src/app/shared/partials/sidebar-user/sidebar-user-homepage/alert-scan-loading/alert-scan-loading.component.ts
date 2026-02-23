import { Component } from '@angular/core';
import { AlertService } from '../../../../../services/alerts/alerts.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-alert-scan-loading',
  imports: [NgIf],
  templateUrl: './alert-scan-loading.component.html'
})
export class AlertScanLoadingComponent {
  constructor(private alertService: AlertService, protected licenseService: LicenseService) { }

  cancelScan() {
    this.alertService.cancelScanIOCs();
  }
}
