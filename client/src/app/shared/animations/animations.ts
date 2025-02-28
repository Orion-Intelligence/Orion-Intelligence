import { trigger, transition, style, animate } from '@angular/animations';

export const fadeAnimation = trigger('fadeAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('175ms ease-in-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('175ms ease-in-out', style({ opacity: 0 }))
  ])
]);
