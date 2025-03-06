import { trigger, transition, style, animate } from '@angular/animations';

export const dashboardGlobalAnimation = trigger('dashboard-global-animation', [
  transition('* <=> *', [
    style({ opacity: 0.5, transform: 'translateY(0px) scale(1)' }),
    animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
  ])
]);

