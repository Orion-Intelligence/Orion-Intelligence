import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InfoModalData {
    type: 'info' | 'warning';
    title: string;
    message: string;
    confirmText: string;
}

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoModalComponent {
  data = input.required<InfoModalData | null>();
  close = output<void>();

  iconContainerClass = computed(() => {
    return this.data()?.type === 'warning' ? 'bg-red-500/10' : 'bg-indigo-500/10';
  });

  iconClass = computed(() => {
    switch(this.data()?.type) {
        case 'warning': return 'bi bi-exclamation-triangle text-red-500';
        case 'info':
        default:
            return 'bi bi-cone-striped text-indigo-400';
    }
  });
}