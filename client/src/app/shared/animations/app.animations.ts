import { animate, style, transition, trigger } from '@angular/animations';
export const appAnimation = trigger('appAnimation', [
  transition('* <=> *', [
    style({ opacity: 0 }),
    animate('500ms ease-out', style({ opacity: 1 }))
  ])
]);
