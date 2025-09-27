import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor() {
    this.resetOnReload();
  }

  public resetOnReload(ingore = false): void {
    const navEntries = performance.getEntriesByType?.('navigation') as PerformanceNavigationTiming[];
    const isHardReload = navEntries?.[0]?.type === 'reload';

    if (isHardReload || ingore) {
      sessionStorage.setItem('scrollPosition', '0');
      sessionStorage.setItem('selectedItem', '');
      window.scrollTo(0, 0);
    }
  }

  saveSession(itemId: string): void {
    // if (itemId) {
    //   sessionStorage.setItem('selectedItem', itemId);
    //   let scrollableContainer: HTMLElement | null = document.getElementById('item-' + itemId);
    //   while (scrollableContainer && !this.isScrollable(scrollableContainer)) {
    //     scrollableContainer = scrollableContainer.parentElement;
    //   }
    //   const scrollPosition = scrollableContainer ? scrollableContainer.scrollTop : window.scrollY;
    //   sessionStorage.setItem('scrollPosition', scrollPosition.toString());
    // }
  }

  openCTI(event: MouseEvent, itemId: string): void {
    // event.stopPropagation()
    // if (itemId) {
    //   const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
    //   const singleInput = itemId;
    //
    //   const params = new URLSearchParams({
    //     selectedType: 'document', singleInput: singleInput
    //   });
    //
    //   const fullUrl = `${baseUrl}?${params.toString()}`;
    //   window.open(fullUrl, '_blank');
    // }
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


  public scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    const el = (document.scrollingElement || document.documentElement) as HTMLElement;
    if (el && typeof (el as any).scrollTo === 'function') {
      el.scrollTo({top: 0, left: 0, behavior});
    } else {
      window.scrollTo({top: 0, left: 0, behavior});
    }
  }

  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
  }
}
