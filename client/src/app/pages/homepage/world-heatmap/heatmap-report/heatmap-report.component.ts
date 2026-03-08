
import { Component, EventEmitter, Input, Output } from '@angular/core';
@Component({
  selector: 'app-heatmap-report',
  imports: [],
  templateUrl: './heatmap-report.component.html'
})
export class HeatmapReportComponent {
  @Input() reports: any[] = [];
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() hasMore = false;

  @Output() close = new EventEmitter<void>();
  @Output() loadMore = new EventEmitter<void>();

  closePopup(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.close.emit();
  }

  onLoadMore(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.loadingMore || !this.hasMore) {
      return;
    }
    this.loadMore.emit();
  }
}
