import {
    trigger,
    transition,
    style,
    animate
} from '@angular/animations';

export const chatBotAnimation =
    trigger('chatBotAnimation', [
        transition(':enter', [
            style({ opacity: 0, transform: 'translateY(-20px)' }),
            animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
    ]);