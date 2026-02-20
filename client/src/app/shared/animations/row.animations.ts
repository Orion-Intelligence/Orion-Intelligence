import { animate, style, transition, trigger } from '@angular/animations';
export const expandFadeRow = trigger('expandFadeRow', [
  transition(':enter', [
    style({ height: 0, transform: 'translateY(-4px)', overflow: 'hidden' }),
    animate('180ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ height: '*', transform: 'translateY(0)' }))
  ])
]);
