import {Component} from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  templateUrl: './scroll-top.component.html'
})
export class ScrollTopComponent {
  scrollToTop(): void {
    const container = document.getElementById('dashboard-container');
    if (container) {
      container.scrollTo({top: 0, behavior: 'smooth'});
    }
  }
}
