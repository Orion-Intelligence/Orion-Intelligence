import { Injectable } from '@angular/core';
import { LicenseService } from '../../services/licenses/licenses.service';
import { DashboardService } from '../../services/dashboard/dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor(protected licenseService: LicenseService, protected dashboardService: DashboardService) {
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

  openCTI(event: MouseEvent, itemId: string): void {
    if (!this.licenseService.canUseCtiGraph()) {
      this.dashboardService.showSubscription.set(true);
      return
    }
    event.stopPropagation()
    if (itemId) {
      const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
      const params = new URLSearchParams({
        selectedType: 'document', singleInput: itemId
      });

      const fullUrl = `${baseUrl}?${params.toString()}`;
      window.open(fullUrl, '_blank');
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
        window.scrollTo({ top: position, behavior: 'auto' });
      }
    }
  }
  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
  }
}
