import { animate, style, transition, trigger } from '@angular/animations';
export const appAnimation = trigger('appAnimation', [
  transition('* <=> *', [
    style({ opacity: 0 }),
    animate('500ms ease-out', style({ opacity: 1 }))
  ])
]);

export const quotaBannerAnimation = trigger('quotaBannerAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-8px)' }),
    animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);
