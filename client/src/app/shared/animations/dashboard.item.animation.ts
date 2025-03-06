import { trigger, transition, style, animate } from '@angular/animations';

export const fadeInDashboardItem = trigger('fadeInDashboardItem', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-5px)' }),
    animate('400ms ease-in-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
]);
