import { animate, style, transition, trigger } from '@angular/animations';

const enterEase = 'cubic-bezier(0.16, 1, 0.3, 1)';
const leaveEase = 'cubic-bezier(0.4, 0, 1, 1)';

export const caseSectionMotion = trigger('caseSectionMotion', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(5px)' }),
    animate(`150ms ${enterEase}`, style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate(`110ms ${leaveEase}`, style({ opacity: 0, transform: 'translateY(-3px)' }))
  ])
]);

export const caseModeSwapMotion = trigger('caseModeSwapMotion', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`130ms ${enterEase}`, style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate(`80ms ${leaveEase}`, style({ opacity: 0 }))
  ])
]);

export const caseListItemMotion = trigger('caseListItemMotion', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden', transform: 'translateY(4px)' }),
    animate(`170ms ${enterEase}`, style({ height: '*', opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    style({ overflow: 'hidden' }),
    animate(`130ms ${leaveEase}`, style({ height: 0, opacity: 0, transform: 'translateY(-2px)' }))
  ])
]);

export const caseInlineMotion = trigger('caseInlineMotion', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`110ms ${enterEase}`, style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate(`80ms ${leaveEase}`, style({ opacity: 0 }))
  ])
]);

export const caseDrawerOverlayMotion = trigger('caseDrawerOverlayMotion', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(`120ms ${enterEase}`, style({ opacity: 1 }))
  ]),
  transition(':leave', [
    animate(`100ms ${leaveEase}`, style({ opacity: 0 }))
  ])
]);

export const caseDrawerMotion = trigger('caseDrawerMotion', [
  transition(':enter', [
    style({ transform: 'translateX(102%)' }),
    animate(`240ms ${enterEase}`, style({ transform: 'translateX(0)' }))
  ]),
  transition(':leave', [
    animate(`170ms ${leaveEase}`, style({ transform: 'translateX(102%)' }))
  ])
]);
