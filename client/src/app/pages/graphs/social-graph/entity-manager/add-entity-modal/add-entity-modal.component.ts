import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CustomEntity } from '../../../../../shared/model/social/social-scan.models';
export interface AddEntityData {
    type: CustomEntity['type'];
    value: string;
    label: string;
    mode?: 'add' | 'edit';
    entityId?: string;
    inputMode?: 'manual' | 'api';
    apiQuery?: string;
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
  close = output<undefined>();
  addEntity = output<AddEntityData>();
  entityValue = signal('');
  entityLabel = signal('');
  apiQuery = signal('');
  inputMode = signal<'manual' | 'api'>('api');
  isTouched = signal(false);
  validationError = computed(() => this.getValidationError());
  isValidInput = computed(() => this.validationError() === null);

  constructor() {
    effect(() => {
      this.entityValue.set(this.data()?.value || '');
      this.entityLabel.set(this.data()?.label || '');
      this.apiQuery.set(this.data()?.apiQuery || '');
      this.inputMode.set(this.data()?.mode === 'edit' ? 'manual' : (this.data()?.inputMode || 'api'));
      this.isTouched.set(false);
    });
  }

  onEntityValueChange(event: Event) {
    this.isTouched.set(true);
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.entityValue.set(nextValue);
  }

  onEntityLabelChange(event: Event) {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.entityLabel.set(nextValue);
  }

  onApiQueryChange(event: Event) {
    this.isTouched.set(true);
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.apiQuery.set(nextValue);
  }

  setInputMode(mode: 'manual' | 'api') {
    if (this.data()?.mode === 'edit') {
      return;
    }
    this.inputMode.set(mode);
    this.isTouched.set(false);
  }

  confirm() {
    this.isTouched.set(true);
    if (this.data() && this.isValidInput()) {
      this.addEntity.emit({
        ...this.data()!,
        value: this.entityValue().trim(),
        label: this.entityLabel().trim(),
        inputMode: this.inputMode(),
        apiQuery: this.apiQuery().trim()
      });
    }
  }

  private getValidationError(): string | null {
    const modalData = this.data();
    const manualValue = this.entityValue().trim();
    const queryValue = this.apiQuery().trim();
    if (!modalData) {
      return 'Entity type is missing.';
    }
    if (this.inputMode() === 'api') {
      if (!queryValue) {
        return 'Query is required.';
      }
      return null;
    }
    if (!manualValue) {
      return 'Value is required.';
    }
    if (modalData.type === 'email') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailPattern.test(manualValue)) {
        return 'Enter a valid email address.';
      }
      return null;
    }
    if (modalData.type === 'domain') {
      const domainPattern = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
      const normalizedDomain = manualValue.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      if (!domainPattern.test(normalizedDomain)) {
        return 'Enter a valid domain (example.com).';
      }
      return null;
    }
    if (modalData.type === 'wallet') {
      const walletPattern = /^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71}|[A-Za-z0-9]{12,120})$/;
      if (!walletPattern.test(manualValue)) {
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
      case 'domain-scan': return 'bi bi-globe2 text-sky-400';
      case 'subdomains-scan': return 'bi bi-diagram-3 text-sky-400';
      case 'dns-scan': return 'bi bi-broadcast text-sky-400';
      case 'wayback-scan': return 'bi bi-clock-history text-sky-400';
      case 'email-breach': return 'bi bi-person-badge text-indigo-400';
      case 'social-scanner': return 'bi bi-people text-indigo-400';
      case 'wanted-list': return 'bi bi-person-exclamation text-indigo-400';
      case 'national-identity': return 'bi bi-card-text text-indigo-400';
      case 'playstore-scanner': return 'bi bi-google-play text-indigo-400';
      case 'software-scanner': return 'bi bi-window text-indigo-400';
      case 'phone': return 'bi bi-telephone text-indigo-400';
      case 'ioc-extract': return 'bi bi-file-earmark-code text-indigo-400';
      case 'apk-scan': return 'bi bi-android2 text-indigo-400';
      case 'crypto-scanner': return 'bi bi-currency-bitcoin text-green-400';
      default: return 'bi bi-circle text-slate-400';
    }
  }

  getModalTitle(): string {
    const modalData = this.data();
    if (!modalData) {
      return 'Entity';
    }
    if (modalData.mode === 'edit') {
      return `Edit ${this.toTitleCase(modalData.type)}`;
    }
    return `Add ${this.toTitleCase(modalData.type)}`;
  }

  getSubmitLabel(): string {
    const modalData = this.data();
    if (modalData?.mode === 'edit') {
      return 'Save Changes';
    }
    return 'Add Entity';
  }

  private toTitleCase(value: string): string {
    if (!value) {
      return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
