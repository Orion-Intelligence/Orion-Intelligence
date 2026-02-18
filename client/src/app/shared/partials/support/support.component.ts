import { Component, EventEmitter, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';


@Component({
  selector: 'app-support',
  imports: [NgIf, FormsModule],
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  @Output() closePopup = new EventEmitter<void>();

  supportModel = {
    email: '',
    subject: '',
    message: ''
  };

  constructor(
    private apiService: ApiService,
    private messageNotificationService: MessageNotificationService
  ) { }

  close() {
    this.resetForm();
    this.closePopup.emit();
  }

  submit() {

    if (!this.supportModel.email ||
      !this.supportModel.subject ||
      !this.supportModel.message) return;

    console.log(this.supportModel.email);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.supportModel.email)) {

      return;
    }


    this.apiService.post('support', this.supportModel).subscribe({
      next: () => {
        this.messageNotificationService.show("Message sent successfully!");
        this.close();
      },
      error: (err) => {
        const mess = err?.error?.detail || 'Failed to send message';
        this.messageNotificationService.show(mess);
      }
    });
  }

  private resetForm() {
    this.supportModel = {
      email: '',
      subject: '',
      message: ''
    };
  }

}
