import { Component } from '@angular/core';
@Component({
  selector: 'app-scroll-top',
  templateUrl: './scroll-top.component.html'
})
export class ScrollTopComponent {
  scrollToTop(): void {
    const candidates = [
      document.querySelector('[data-testid="dashboard-body"]'),
      document.getElementById('dashboard-container'),
      document.querySelector('app-network-intel'),
      document.scrollingElement,
    ].filter((element): element is Element => !!element);

    for (const element of candidates) {
      if ('scrollTo' in element) {
        (element as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }
}
