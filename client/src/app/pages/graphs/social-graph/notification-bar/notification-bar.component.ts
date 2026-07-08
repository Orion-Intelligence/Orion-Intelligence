import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import type { NotificationData } from '../models/social-graph.models';

@Component({
  selector: 'app-notification-bar',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './notification-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBarComponent {
  data = input<NotificationData | null>();
}
