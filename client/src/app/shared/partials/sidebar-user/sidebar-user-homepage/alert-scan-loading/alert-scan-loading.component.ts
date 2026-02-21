import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { AlertService } from '../../../../../services/alerts/alerts.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-alert-scan-loading',
  imports: [NgIf],
  templateUrl: './alert-scan-loading.component.html'
})
export class AlertScanLoadingComponent implements AfterViewInit {
    @ViewChild('overlay') overlayRef!: ElementRef;

    constructor(private el: ElementRef, private alertService: AlertService, protected licenseService: LicenseService) { }

    ngAfterViewInit() {
      this.adjustOverlayHeight();
    }

    @HostListener('window:resize')
    onResize() {
      this.adjustOverlayHeight();
    }

    private adjustOverlayHeight() {
      const parentTop = this.el.nativeElement.getBoundingClientRect().top;
      const overlayEl = this.overlayRef.nativeElement as HTMLElement;
      overlayEl.style.height = `${window.innerHeight - parentTop}px`;
    }

    cancelScan() {
      this.alertService.cancelScanIOCs();
    }
}
