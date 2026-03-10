
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExportChoiceOption } from '../../model/report/export-choice.model';

@Component({
  selector: 'app-export-choice-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-choice-modal.component.html'
})
export class ExportChoiceModalComponent {
  @Input() visible = false;
  @Input() title = 'Export Report';
  @Input() subtitle = 'Choose export format:';
  @Input() options: ExportChoiceOption[] = [];
  @Input() overlayTestId = 'graph-report-export-overlay';
  @Input() modalTestId = 'graph-report-export-modal';
  @Input() closeTestId = 'graph-report-export-close';

  @Output() closed = new EventEmitter<void>();
  @Output() optionSelected = new EventEmitter<string>();

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('export-choice-overlay')) {
      this.closed.emit();
    }
  }

  select(value: string): void {
    this.optionSelected.emit(value);
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
  }
}
