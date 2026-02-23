import { animate, style, transition, trigger } from '@angular/animations';

export const sidebarModeAnimation = trigger('sidebarMode', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-12px) scale(0.985)' }),
    animate('260ms cubic-bezier(0.16,1,0.3,1)', style({ opacity: 1, transform: 'translateX(0) scale(1)' })),
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4,0,1,1)', style({ opacity: 0, transform: 'translateX(-10px) scale(0.99)' })),
  ]),
]);
