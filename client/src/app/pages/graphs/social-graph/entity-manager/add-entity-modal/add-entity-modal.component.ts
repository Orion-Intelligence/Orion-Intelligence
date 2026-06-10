import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { CustomEntity } from '../../../../../shared/model/social/social-scan.models';
import { SocialEntityUiService } from '../../services/social-entity-ui.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

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
  imports: [CommonModule, TitleCasePipe, TranslatePipe],
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

  constructor(readonly socialEntityUiService: SocialEntityUiService) {
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

  getModalTitle(): string {
    const modalData = this.data();
    if (!modalData) {
      return 'Entity';
    }
    if (modalData.mode === 'edit') {
      return `Edit ${this.socialEntityUiService.toTitleCase(modalData.type)}`;
    }
    return `Add ${this.socialEntityUiService.toTitleCase(modalData.type)}`;
  }

  getSubmitLabel(): string {
    const modalData = this.data();
    if (modalData?.mode === 'edit') {
      return 'Save Changes';
    }
    return 'Add Entity';
  }
}
