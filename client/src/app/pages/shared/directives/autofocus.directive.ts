import { Directive, ElementRef, inject, OnInit } from '@angular/core';
@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements OnInit {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);

  ngOnInit(): void {
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    }, 0);
  }
}
