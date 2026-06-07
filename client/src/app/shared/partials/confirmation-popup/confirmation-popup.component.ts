import { Component, input, output } from '@angular/core';
import { FocusDirective } from '../../directive/focus.directive';
import { popupAnimation } from '../../animations/popup.animations';
import { TranslatePipe } from '../../pipes/translate.pipe';
@Component({
  selector: 'app-confirmation-popup',
  imports: [
    FocusDirective,
    TranslatePipe
  ],
  templateUrl: './confirmation-popup.component.html',
  animations: [popupAnimation],
})
export class ConfirmationPopupComponent {
  readonly message = input('Are you sure you want to perform this action?');
  readonly confirmed = output<boolean>();

  onBackdrop(event: MouseEvent) {
    const eventTargetElement = event.target as HTMLElement | null;
    if (eventTargetElement?.dataset?.['role'] === 'backdrop') {
      this.confirmed.emit(false);
    }
  }

  onYes() {
    this.confirmed.emit(true);
  }

  onNo() {
    this.confirmed.emit(false);
  }
}
