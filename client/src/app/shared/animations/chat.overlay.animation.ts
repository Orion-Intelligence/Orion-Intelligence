import { animate, style, transition, trigger } from '@angular/animations';

export const overlayFadeAnimation = trigger('overlayFade', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('180ms ease-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0 }))
  ])
]);
