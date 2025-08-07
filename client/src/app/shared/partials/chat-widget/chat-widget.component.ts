import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-widget',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css'
})
export class ChatWidgetComponent {
  chatMessages = [
    { id: 1, sender: 'bot', text: 'Hi there! How can I help you today?', time: new Date() }
  ];
  isBotTyping: boolean = false;
  newMessage = '';
  chatOpen = false;

  sendMessage(event: Event): void {
    event.preventDefault();

    if (!this.newMessage.trim()) return;

    this.chatMessages.push({
      id: Date.now(),
      text: this.newMessage,
      sender: 'user',
      time: new Date()
    });

    const userMessage = this.newMessage;
    this.newMessage = '';

    this.isBotTyping = true;

    setTimeout(() => {
      this.chatMessages.push({
        id: Date.now(),
        text: `Bot response to: "${userMessage}"`,
        sender: 'bot',
        time: new Date()
      });
      this.isBotTyping = false;
    }, 1500);
  }


  getBotResponse(userInput: string): string {

    if (userInput.toLowerCase().includes('help')) {
      return 'Sure! Please tell me more about what you need help with.';
    } else if (userInput.toLowerCase().includes('issue')) {
      return 'Can you describe the issue in detail? I’ll try to assist.';
    }
    return 'I’m here to assist! Feel free to ask anything.';
  }
}
