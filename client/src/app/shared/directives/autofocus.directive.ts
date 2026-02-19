import { Directive, ElementRef, inject, OnInit } from '@angular/core';
@Directive({
    selector: '[appAutofocus]',
    standalone: true,
})
export class AutofocusDirective implements OnInit {
    private readonly elementRef = inject(ElementRef<HTMLInputElement>);
    ngOnInit(): void {
        // Use a timeout to ensure the element is fully rendered and visible
        // before we attempt to focus it.
        setTimeout(() => {
            this.elementRef.nativeElement.focus();
        }, 0);
    }
}
