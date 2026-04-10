import { Directive, ElementRef, OnInit } from '@angular/core';
@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements OnInit {
  constructor(private readonly inputElementRef: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.inputElementRef.nativeElement.focus();
    }, 0);
  }
}
