import { Component, input } from '@angular/core';

import { SubscriptionService } from '../../../services/dashboard/subscription.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-trail-notification',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './trail-notification.component.html'
})
export class TrailNotificationComponent {
  readonly trialNotificationCheck = input<boolean>(false);

  constructor(public subscriptionService: SubscriptionService) {
  }
}
