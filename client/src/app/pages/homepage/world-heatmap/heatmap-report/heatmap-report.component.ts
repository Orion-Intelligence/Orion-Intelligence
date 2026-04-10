
import { Component, input, output } from '@angular/core';
@Component({
  selector: 'app-heatmap-report',
  imports: [],
  templateUrl: './heatmap-report.component.html'
})
export class HeatmapReportComponent {
  readonly reports = input<any[]>([]);
  readonly loading = input(false);
  readonly loadingMore = input(false);
  readonly hasMore = input(false);
  readonly close = output<undefined>();
  readonly loadMore = output<undefined>();

  closePopup(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    // TODO: The 'emit' function requires a mandatory void argument
    this.close.emit(undefined);
  }

  onLoadMore(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    // TODO: The 'emit' function requires a mandatory void argument
    this.loadMore.emit(undefined);
  }
}
