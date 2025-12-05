import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-popup',
  imports: [],
  templateUrl: './confirmation-popup.component.html',
  styleUrl: './confirmation-popup.component.css'
})
export class ConfirmationPopupComponent {
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
