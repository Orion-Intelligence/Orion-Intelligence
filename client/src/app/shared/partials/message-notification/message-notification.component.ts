import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';

@Component({
  selector: 'app-message-notification',
  imports: [NgIf, CommonModule],
  templateUrl: './message-notification.component.html',
  styleUrl: './message-notification.component.css'
})
export class MessageNotificationComponent {
  message$;

  constructor(private notificationService: MessageNotificationService) {
    this.message$ = this.notificationService.message$;
  }
}
