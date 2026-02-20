import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
@Component({
  selector: 'app-pro-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pro-subscription.component.html'
})
export class ProSubscriptionComponent {
  selectedSubscription: string = 'monthly-highlighted';
  userName: string = '';
  userPhone: string = '';
  userEmail: string = '';
  submitted = false;

  @Input() permanent = false;

  @Output() close = new EventEmitter<void>();

  constructor(private api: ApiService, private router: Router) {
  }

  closePopup() {
    this.close.emit();
  }

  submitForm() {
    const payload = {
      plan: this.selectedSubscription,
      name: this.userName,
      phone: this.userPhone,
      email: this.userEmail
    };
    this.api.post('subscription/request', payload).subscribe(() => {
      this.submitted = true;
      this.router.navigate(['/notification'], {
        state: {
          title: 'Subscription Request Sent',
          description: 'Thank you for choosing Dark Web Shield Pro. Our team has received your subscription request and will contact you shortly with the next steps.'
        }
      }).then();
    });
  }
}
