import { animate, style, transition, trigger } from '@angular/animations';
export const filterAnimation = trigger('filterAnimation', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('175ms ease-in-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate('175ms ease-in-out', style({ opacity: 0 }))
  ])
]);
