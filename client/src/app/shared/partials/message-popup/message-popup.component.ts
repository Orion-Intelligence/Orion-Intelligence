import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-message-popup',
  imports: [],
  templateUrl: './message-popup.component.html'
})
export class MessagePopupComponent {
  @Input() message = 'Are you sure you want to perform this action?';

  @Output() confirmed = new EventEmitter<boolean>();

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('confirmation-popup_backdrop')) {
      this.confirmed.emit(false);
    }
  }

  dismiss() {
    this.confirmed.emit(true);
  }
}
