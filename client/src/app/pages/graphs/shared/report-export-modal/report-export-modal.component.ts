import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphReportExportType } from '../services/graph-report-export.service';
@Component({
  selector: 'app-report-export-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-export-modal.component.html'
})
export class ReportExportModalComponent {
    @Input() visible = false;
    @Input() title = 'Export Report';
    @Output() closed = new EventEmitter<void>();
    @Output() exportSelected = new EventEmitter<GraphReportExportType>();

    onOverlayClick(event: MouseEvent): void {
      if ((event.target as HTMLElement).classList.contains('report-export-overlay')) {
        this.closed.emit();
      }
    }

    select(type: GraphReportExportType): void {
      this.exportSelected.emit(type);
    }
}
