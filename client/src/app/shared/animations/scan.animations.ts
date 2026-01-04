import { animate, animateChild, query, style, transition, trigger } from '@angular/animations';

export const scanAnimation = trigger('scanAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px) scale(0.985)' }),
    animate('260ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
  ]),
  transition(':leave', [
    animate('220ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(6px) scale(0.985)' })),
  ]),
]);

export const scanParentAnimation = trigger('scanParentAnimation', [
  transition('* => *', [
    query('@scanAnimation', animateChild(), { optional: true }),
  ]),
]);
