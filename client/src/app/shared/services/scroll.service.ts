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
      return;
    }
    event.stopPropagation();
    if (itemId) {
      const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
      const params = new URLSearchParams({
        selectedType: 'document', singleInput: itemId
      });
      const fullUrl = `${baseUrl}?${params.toString()}`;
      window.open(fullUrl, '_blank');
    }
  }

  saveCurrentPosition(itemId = ''): void {
    const container = document.getElementById('dashboard-container');
    const position = container ? container.scrollTop : window.scrollY;
    sessionStorage.setItem('scrollPosition', String(position));
    sessionStorage.setItem('selectedItem', itemId);
  }

  scrollToSavedPosition(): void {
    const savedPosition = sessionStorage.getItem('scrollPosition');
    const savedItemId = sessionStorage.getItem('selectedItem');
    if (savedPosition === null) {
      return;
    }

    const position = parseInt(savedPosition, 10);
    const applyScroll = () => {
      let scrollableContainer: HTMLElement | null = savedItemId ? document.getElementById('item-' + savedItemId) : null;
      while (scrollableContainer && !this.isScrollable(scrollableContainer)) {
        scrollableContainer = scrollableContainer.parentElement;
      }

      const dashboardContainer = document.getElementById('dashboard-container');
      if (scrollableContainer) {
        scrollableContainer.scrollTop = position;
      }
      else if (dashboardContainer) {
        dashboardContainer.scrollTop = position;
      }
      else {
        window.scrollTo({ top: position, behavior: 'auto' });
      }
    };

    applyScroll();
    requestAnimationFrame(applyScroll);
    setTimeout(applyScroll, 80);
  }

  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
  }
}
