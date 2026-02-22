import { animate, style, transition, trigger } from '@angular/animations';

export const advancedRowMotionAnimation = trigger('advancedRowMotion', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-6px) scale(0.995)' }),
    animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
  ]),
  transition(':leave', [
    animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-4px) scale(0.995)' })),
  ]),
]);
