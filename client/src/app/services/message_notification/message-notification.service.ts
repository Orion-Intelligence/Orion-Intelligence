import { Injectable, signal, computed } from '@angular/core';

type MessageType = 'success' | 'fail';

@Injectable({ providedIn: 'root' })
export class MessageNotificationService {
  private messageSignal = signal<string | null>(null);
  private typeSignal = signal<MessageType>('fail');

  message = computed(() => this.messageSignal());
  type = computed(() => this.typeSignal());

  show(message: string, type: MessageType = 'fail', duration: number = 3000) {
    this.messageSignal.set(message);
    this.typeSignal.set(type);
    setTimeout(() => this.messageSignal.set(null), duration);
  }
}
