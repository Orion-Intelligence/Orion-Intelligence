import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MessageNotificationService {

    private messageSubject = new BehaviorSubject<string | null>(null);
    message$ = this.messageSubject.asObservable();

    show(message: string, duration: number = 3000) {
        this.messageSubject.next(message);

        setTimeout(() => {
            this.messageSubject.next(null);
        }, duration);
    }
}
