import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CustomEntity } from '../../../../shared/model/social/social-scan.models';

export type AddEntityData = {
    type: CustomEntity['type'];
    value: string;
}

@Component({
  selector: 'app-add-entity-modal',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './add-entity-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntityModalComponent {
  data = input.required<AddEntityData | null>();
  
  close = output<void>();
  addEntity = output<AddEntityData>();

  entityValue = signal('');

  constructor() {
    effect(() => {
      this.entityValue.set(this.data()?.value || '');
    });
  }

  onEntityValueChange(event: Event) {
    this.entityValue.set((event.target as HTMLInputElement).value);
  }

  confirm() {
    if (this.data() && this.entityValue().trim()) {
      this.addEntity.emit({ ...this.data()!, value: this.entityValue().trim() });
    }
  }
  
  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
    }
  }
}