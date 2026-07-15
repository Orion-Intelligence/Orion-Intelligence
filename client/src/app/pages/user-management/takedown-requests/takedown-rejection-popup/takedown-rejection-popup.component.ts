import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { popupAnimation } from '../../../../shared/animations/popup.animations';
import { FocusDirective } from '../../../../shared/directive/focus.directive';

@Component({
  selector: 'app-takedown-rejection-popup',
  standalone: true,
  imports: [FormsModule, FocusDirective],
  templateUrl: './takedown-rejection-popup.component.html',
  animations: [popupAnimation],
})
export class TakedownRejectionPopupComponent {
  readonly target = input('');
  readonly isSubmitting = input(false);
  readonly submitted = output<string>();
  readonly cancelled = output<void>();
  reason = '';

  get trimmedReason(): string {
    return this.reason.trim();
  }

  get canSubmit(): boolean {
    return !!this.trimmedReason && !this.isSubmitting();
  }

  onBackdrop(event: MouseEvent): void {
    const eventTargetElement = event.target as HTMLElement | null;
    if (eventTargetElement?.dataset?.['role'] === 'backdrop') {
      this.cancel();
    }
  }

  cancel(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.cancelled.emit();
  }

  submit(): void {
    if (!this.canSubmit) {
      return;
    }
    this.submitted.emit(this.trimmedReason);
  }
}
