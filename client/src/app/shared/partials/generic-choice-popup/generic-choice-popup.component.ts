import { Component, input, output } from '@angular/core';
import { popupAnimation } from '../../animations/popup.animations';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type GenericChoicePopupAction = 'primary' | 'secondary' | 'cancel';

@Component({
  selector: 'app-generic-choice-popup',
  imports: [TranslatePipe],
  templateUrl: './generic-choice-popup.component.html',
  animations: [popupAnimation],
})
export class GenericChoicePopupComponent {
  readonly title = input('Confirm Action');
  readonly message = input('Choose how you want to continue.');
  readonly primaryLabel = input('Use Previous Result');
  readonly secondaryLabel = input('Run New Scan');
  readonly cancelLabel = input('common.actions.cancel');
  readonly selected = output<GenericChoicePopupAction>();

  onBackdrop(event: MouseEvent): void {
    const eventTargetElement = event.target as HTMLElement | null;
    if (eventTargetElement?.dataset?.['role'] === 'backdrop') {
      this.selected.emit('cancel');
    }
  }

  choosePrimary(): void {
    this.selected.emit('primary');
  }

  chooseSecondary(): void {
    this.selected.emit('secondary');
  }

  cancel(): void {
    this.selected.emit('cancel');
  }
}
