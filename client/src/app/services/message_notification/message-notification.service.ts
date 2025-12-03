import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageNotificationService {

  private messageSignal = signal<string | null>(null);
  message = computed(() => this.messageSignal());

  show(message: string, duration: number = 3000) {
    this.messageSignal.set(message);
    setTimeout(() => this.messageSignal.set(null), duration);
  }
}
