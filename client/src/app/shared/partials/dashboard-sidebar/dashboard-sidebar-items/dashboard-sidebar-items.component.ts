import { Component, input, output } from '@angular/core';
import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { LowerPipe } from '../../../pipes/lower.pipe';
import { SelectionStoreService } from '../../../../services/dashboard/selection.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { SubscriptionService } from '../../../../services/dashboard/subscription.service';
import { ScrollService } from '../../../services/scroll.service';
@Component({
  selector: 'app-dashboard-sidebar-items',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, TooltipDirective, LowerPipe],
  templateUrl: './dashboard-sidebar-items.component.html',
})
export class DashboardSidebarItemsComponent {
  readonly title = input('');
  readonly icon = input('');
  readonly items = input<string[]>([]);
  readonly category = input<any>();
  readonly routePrefix = input('');
  readonly tooltip = input('');
  readonly sectionSelected = output<any>();
  readonly optionSelected = output<string>();

  constructor(protected selectionStore: SelectionStoreService, protected licenseService: LicenseService, protected subscriptionService: SubscriptionService, protected scrollService: ScrollService) {
  }

  selectSection() {
    this.scrollService.clearSavedPosition();
    this.scrollService.scrollReportToTop();
    this.sectionSelected.emit(this.category());
  }

  selectOption(event: Event, item: string) {
    event.stopPropagation();
    this.scrollService.clearSavedPosition();
    this.scrollService.scrollReportToTop();
    this.optionSelected.emit(item);
  }

  requestSubscription(moduleName: string) {
    if (!this.licenseService.canAccess(moduleName) && typeof window !== 'undefined' && window.innerWidth < 900) {
      window.dispatchEvent(new CustomEvent('close-dashboard-sidebar'));
    }
    this.licenseService.demoSubscription(moduleName);
  }

  replaceDashWithSpace(value: string): string {
    if (!value) {
      return '';
    }
    return value.replace(/-/g, ' ');
  }
}
