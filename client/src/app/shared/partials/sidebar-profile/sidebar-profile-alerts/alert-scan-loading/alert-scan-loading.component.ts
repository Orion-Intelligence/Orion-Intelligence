import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-alert-scan-loading',
  imports: [NgFor],
  templateUrl: './alert-scan-loading.component.html',
  styleUrl: './alert-scan-loading.component.css'
})
export class AlertScanLoadingComponent {
  skeletonCards = Array.from({ length: 4 });
}
