import { trigger, transition, style, animate, keyframes } from '@angular/animations';

export const popupAnimation = trigger('popupAnimation', [
    transition(':enter', [
        animate('400ms ease-out', keyframes([
            style({ opacity: 0, transform: 'scale(0.7)', offset: 0 }),
            style({ opacity: 1, transform: 'scale(1.05)', offset: 0.7 }),
            style({ transform: 'scale(0.95)', offset: 0.85 }),
            style({ transform: 'scale(1)', offset: 1 })
        ]))
    ]),
    transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.7)' }))
    ])
]);

export const overlayAnimation = trigger('overlayAnimation', [
    transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
    ])
]);
