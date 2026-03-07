
import { Component, EventEmitter, Input, Output } from '@angular/core';
@Component({
  selector: 'app-heatmap-report',
  imports: [],
  templateUrl: './heatmap-report.component.html'
})
export class HeatmapReportComponent {
  @Input() reports: any[] = [];

  @Output() close = new EventEmitter<void>();

  closePopup(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.close.emit();
  }
}
