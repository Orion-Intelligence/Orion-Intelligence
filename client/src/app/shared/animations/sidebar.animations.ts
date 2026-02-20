import { trigger, transition, style, animate } from '@angular/animations';
export const sidebarAnimation = trigger('sidebarAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(100%)' }),
    animate('180ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
  ])
]);
export const overlayAnimation = trigger('overlayAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('200ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0 }))
  ])
]);
