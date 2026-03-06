import { animate, style, transition, trigger } from '@angular/animations';

export const messageNotificationAnimation = trigger('messageNotificationAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(24px) scale(0.98)' }),
    animate('220ms ease-out', style({ opacity: 1, transform: 'translateX(0) scale(1)' })),
  ]),
  transition(':leave', [
    animate('180ms ease-in', style({ opacity: 0, transform: 'translateX(30px) scale(0.98)' })),
  ]),
]);
