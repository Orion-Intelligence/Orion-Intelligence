import { Component, input } from '@angular/core';

import { SubscriptionService } from '../../../services/dashboard/subscription.service';
@Component({
  selector: 'app-trail-notification',
  standalone: true,
  imports: [],
  templateUrl: './trail-notification.component.html'
})
export class TrailNotificationComponent {
  readonly trialNotificationCheck = input<boolean>(false);

  constructor(public subscriptionService: SubscriptionService) {
  }
}
