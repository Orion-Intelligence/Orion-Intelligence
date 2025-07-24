import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pro-subscription',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './pro-subscription.component.html'
})
export class ProSubscriptionComponent {
  @Output() close = new EventEmitter<void>();

  selectedSubscription: string = 'monthly-highlighted';
  userName: string = '';
  userPhone: string = '';
  userEmail: string = '';

  constructor() { }

  closePopup() {
    this.close.emit();
  }
  submitForm() {
    const subject = encodeURIComponent('Safe Zone Pro Request');
    const body = encodeURIComponent(
      `Name: ${this.userName}\nPhone: ${this.userPhone}\nEmail: ${this.userEmail}`
    );
    const mailtoLink = `mailto:support@genesistechnologies.org?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;

    this.closePopup();
  }
}
