import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-scroll-top',
  imports: [TranslatePipe],
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
