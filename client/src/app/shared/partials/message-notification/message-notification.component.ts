import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { messageNotificationAnimation } from '../../animations/message.notification.animation';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-message-notification',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './message-notification.component.html',
  animations: [messageNotificationAnimation],
})
export class MessageNotificationComponent {
  constructor(protected notificationService: MessageNotificationService) { }

  dismiss() {
    this.notificationService.clear();
  }
}
