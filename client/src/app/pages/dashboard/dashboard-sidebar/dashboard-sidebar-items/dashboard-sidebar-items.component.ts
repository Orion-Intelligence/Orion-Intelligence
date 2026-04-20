import { Component, input, output } from '@angular/core';
import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { LowerPipe } from '../../../../shared/pipes/lower.pipe';
import { SelectionStoreService } from '../../../../services/dashboard/selection.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { SubscriptionService } from '../../../../services/dashboard/subscription.service';
import { SidebarHomepageService } from '../../../../services/dashboard/sidebar.service';
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

  constructor(protected selectionStore: SelectionStoreService, protected licenseService: LicenseService, protected subscriptionService: SubscriptionService, private sidebarHomepageService: SidebarHomepageService) {
  }

  selectSection() {
    this.sidebarHomepageService.selectSection(this.category(), this.sectionSelected);
  }

  selectOption(event: Event, item: string) {
    this.sidebarHomepageService.selectOption(event, item, this.optionSelected);
  }

  requestSubscription(moduleName: string) {
    this.sidebarHomepageService.requestSubscription(moduleName);
  }

  replaceDashWithSpace(value: string): string {
    if (!value) {
      return '';
    }
    return value.replace(/-/g, ' ');
  }
}
