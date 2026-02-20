import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { SubscriptionService } from '../../../services/dashboard/subscription.service';
@Component({
  selector: 'app-trail-notification',
  imports: [NgIf],
  templateUrl: './trail-notification.component.html'
})
export class TrailNotificationComponent {
    @Input() trialNotificationCheck: boolean = false;

    constructor(public subscriptionService: SubscriptionService) {
    }
}
