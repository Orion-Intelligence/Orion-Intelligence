import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor() {
    this.resetOnReload();
  }

  private resetOnReload(): void {
    const navEntries = performance.getEntriesByType?.('navigation') as PerformanceNavigationTiming[];
    const isHardReload = navEntries?.[0]?.type === 'reload';

    if (isHardReload) {
      sessionStorage.setItem('scrollPosition', '0');
      sessionStorage.setItem('selectedItem', '');
      window.scrollTo(0, 0);
    }
  }

  saveSession(itemId: string): void {
    if (itemId) {
      sessionStorage.setItem('selectedItem', itemId);
      let scrollableContainer: HTMLElement | null = document.getElementById('item-' + itemId);
      while (scrollableContainer && !this.isScrollable(scrollableContainer)) {
        scrollableContainer = scrollableContainer.parentElement;
      }
      const scrollPosition = scrollableContainer ? scrollableContainer.scrollTop : window.scrollY;
      sessionStorage.setItem('scrollPosition', scrollPosition.toString());
    }
  }

  scrollToSavedPosition(): void {
    const savedPosition = sessionStorage.getItem('scrollPosition');
    const savedItemId = sessionStorage.getItem('selectedItem');

    if (savedPosition !== null && savedItemId) {
      const position = parseInt(savedPosition, 10);
      let scrollableContainer: HTMLElement | null = document.getElementById('item-' + savedItemId);
      while (scrollableContainer && !this.isScrollable(scrollableContainer)) {
        scrollableContainer = scrollableContainer.parentElement;
      }
      if (scrollableContainer) {
        scrollableContainer.scrollTop = position;
      } else {
        window.scrollTo({top: position, behavior: 'auto'});
      }
    }
  }

  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
  }
}
