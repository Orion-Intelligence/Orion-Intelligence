import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

export type NotificationType = 'added' | 'scanned' | 'scanning' | 'busy';
export interface NotificationData {
    type: NotificationType;
    message: string;
    icon: string;
    style: string;
}
@Component({
  selector: 'app-notification-bar',
  standalone: true,
  imports: [CommonModule, NgClass, TranslatePipe],
  templateUrl: './notification-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBarComponent {
  data = input<NotificationData | null>();
}
