import { NgFor, NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
@Component({
  selector: 'app-heatmap-report',
  imports: [NgFor, NgIf],
  templateUrl: './heatmap-report.component.html'
})
export class HeatmapReportComponent {
  @Input() reports: any[] = [];

  @Output() close = new EventEmitter<void>();

  closePopup() {
    this.close.emit();
  }
}
