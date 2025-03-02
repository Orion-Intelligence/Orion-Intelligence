import { trigger, transition, style, animate } from '@angular/animations';

export const fadeInDashboard = trigger('fadeIn', [
  transition('* <=> *', [
    style({ opacity: 0.5, transform: 'translateY(5px) scale(1)' }), // Start slightly faded, 10px lower, and 2% smaller
    animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0) scale(1)' })) // Smoothly return to normal
  ])
]);

