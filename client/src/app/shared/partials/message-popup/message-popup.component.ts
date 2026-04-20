import { Component, HostListener, input, output } from '@angular/core';
@Component({
  selector: 'app-message-popup',
  imports: [],
  templateUrl: './message-popup.component.html'
})
export class MessagePopupComponent {
  readonly message = input('Are you sure you want to perform this action?');
  readonly confirmed = output<boolean>();

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
