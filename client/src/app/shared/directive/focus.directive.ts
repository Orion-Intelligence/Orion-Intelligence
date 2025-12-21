import { Directive, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[triggerAutoFocus]'
})
export class FocusDirective implements AfterViewInit {

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.el.nativeElement.focus();
  }

}
