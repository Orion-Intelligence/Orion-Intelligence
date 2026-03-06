import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { messageNotificationAnimation } from '../../animations/message.notification.animation';
@Component({
  selector: 'app-message-notification',
  imports: [NgIf, CommonModule],
  templateUrl: './message-notification.component.html',
  animations: [messageNotificationAnimation],
})
export class MessageNotificationComponent {
  constructor(protected notificationService: MessageNotificationService) { }

  dismiss() {
    this.notificationService.clear();
  }
}
