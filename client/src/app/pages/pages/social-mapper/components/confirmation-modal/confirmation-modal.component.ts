import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmationModalData {
    title: string;
    message: string;
    confirmText: string;
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationModalComponent {
  data = input.required<ConfirmationModalData | null>();

  confirm = output<void>();
  cancel = output<void>();
}