import { Component, EventEmitter, HostListener, Output, Input } from '@angular/core';
import { FocusDirective } from '../../directive/focus.directive';
import { popupAnimation } from '../../animations/popup.animations';
@Component({
  selector: 'app-confirmation-popup',
  imports: [
    FocusDirective
  ],
  templateUrl: './confirmation-popup.component.html',
  animations: [popupAnimation],
})
export class ConfirmationPopupComponent {
    @Input() message = 'Are you sure you want to perform this action?';
    @Output() confirmed = new EventEmitter<boolean>();

    @HostListener('click', ['$event'])
    onBackdropClick(event: MouseEvent) {
      if ((event.target as HTMLElement).classList.contains('confirmation-popup_backdrop')) {
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
