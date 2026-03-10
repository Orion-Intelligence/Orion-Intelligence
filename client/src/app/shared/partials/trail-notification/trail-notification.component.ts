import { Component, Input } from '@angular/core';

import { SubscriptionService } from '../../../services/dashboard/subscription.service';
@Component({
  selector: 'app-trail-notification',
  standalone: true,
  imports: [],
  templateUrl: './trail-notification.component.html'
})
export class TrailNotificationComponent {
    @Input() trialNotificationCheck: boolean = false;

    constructor(public subscriptionService: SubscriptionService) {
    }
}
