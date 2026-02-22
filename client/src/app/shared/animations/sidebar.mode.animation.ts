import { animate, style, transition, trigger } from '@angular/animations';

export const sidebarModeAnimation = trigger('sidebarMode', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-10px) scale(0.99)' }),
    animate('220ms cubic-bezier(0.22,1,0.36,1)', style({ opacity: 1, transform: 'translateX(0) scale(1)' })),
  ]),
  transition(':leave', [
    animate('170ms ease-out', style({ opacity: 0, transform: 'translateX(-8px) scale(0.99)' })),
  ]),
]);
