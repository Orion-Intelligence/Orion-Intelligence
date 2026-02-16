import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CustomEntity } from '../../../../shared/model/social/social-scan.models';

export type AddEntityData = {
    type: CustomEntity['type'];
    value: string;
    label: string;
    mode?: 'add' | 'edit';
    entityId?: string;
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
  entityLabel = signal('');
  isTouched = signal(false);

  validationError = computed(() => this.getValidationError());
  isValidInput = computed(() => this.validationError() === null);

  constructor() {
    effect(() => {
      this.entityValue.set(this.data()?.value || '');
      this.entityLabel.set(this.data()?.label || '');
      this.isTouched.set(false);
    });
  }

  onEntityValueChange(event: Event) {
    this.isTouched.set(true);
    this.entityValue.set((event.target as HTMLInputElement).value);
  }

  onEntityLabelChange(event: Event) {
    this.entityLabel.set((event.target as HTMLInputElement).value);
  }

  confirm() {
    this.isTouched.set(true);
    if (this.data() && this.isValidInput())
    {
      this.addEntity.emit({ ...this.data()!, value: this.entityValue().trim(), label: this.entityLabel().trim() });
    }
  }

  private getValidationError(): string | null {
    const modalData = this.data();
    const value = this.entityValue().trim();
    if (!modalData)
    {
      return 'Entity type is missing.';
    }
    if (!value)
    {
      return 'Value is required.';
    }
    if (modalData.type === 'email')
    {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailPattern.test(value))
      {
        return 'Enter a valid email address.';
      }
      return null;
    }
    if (modalData.type === 'domain')
    {
      const domainPattern = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
      const normalizedDomain = value.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      if (!domainPattern.test(normalizedDomain))
      {
        return 'Enter a valid domain (example.com).';
      }
      return null;
    }
    if (modalData.type === 'wallet')
    {
      const walletPattern = /^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71}|[A-Za-z0-9]{12,120})$/;
      if (!walletPattern.test(value))
      {
        return 'Enter a valid wallet address.';
      }
      return null;
    }
    return null;
  }
  
  getIconForEntityType(type: CustomEntity['type']): string {
    switch (type) {
      case 'wallet': return 'bi bi-wallet2 text-green-400';
      case 'email': return 'bi bi-envelope-at text-yellow-400';
      case 'domain': return 'bi bi-globe text-sky-400';
    }
  }

  getModalTitle(): string {
    const modalData = this.data();
    if (!modalData)
    {
      return 'Entity';
    }
    if (modalData.mode === 'edit')
    {
      return `Edit ${this.toTitleCase(modalData.type)}`;
    }
    return `Add ${this.toTitleCase(modalData.type)}`;
  }

  getSubmitLabel(): string {
    const modalData = this.data();
    if (modalData?.mode === 'edit')
    {
      return 'Save Changes';
    }
    return 'Add Entity';
  }

  private toTitleCase(value: string): string {
    if (!value)
    {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
