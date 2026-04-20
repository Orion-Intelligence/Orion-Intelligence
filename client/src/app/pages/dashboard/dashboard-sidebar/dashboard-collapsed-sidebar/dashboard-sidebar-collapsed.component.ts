import { Component, input, output } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { LowerPipe } from '../../../../shared/pipes/lower.pipe';
import { sidebarItemTooltips } from '../../../../shared/constants/shared-enums';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { SidebarHomepageService } from '../../../../services/dashboard/sidebar.service';
@Component({
  selector: 'app-dashboard-sidebar-collapsed',
  standalone: true,
  imports: [NgClass, AsyncPipe, RouterLink, TooltipDirective, LowerPipe],
  templateUrl: './dashboard-sidebar-collapsed.component.html',
})
export class SidebarSectionComponent {
  protected readonly itemTooltips = sidebarItemTooltips;

  readonly title = input('');
  readonly icon = input('');
  readonly items = input<string[]>([]);
  readonly category = input<any>();
  readonly routePrefix = input('');
  readonly selectionStore = input<any>();
  readonly tooltip = input('');
  readonly sectionSelected = output<any>();
  readonly optionSelected = output<string>();

  constructor(protected licenseService: LicenseService, private sidebarHomepageService: SidebarHomepageService) {}

  selectSection() {
    this.sidebarHomepageService.selectSection(this.category(), this.sectionSelected);
  }

  selectOption(event: Event, item: string) {
    this.sidebarHomepageService.selectOption(event, item, this.optionSelected);
  }

  requestSubscription(moduleName: string) {
    this.sidebarHomepageService.requestSubscription(moduleName);
  }

  getItemTooltip(item: string): string {
    const mapped = this.itemTooltips[item];
    if (mapped) {
      return mapped;
    }
    return item.replace(/-/g, ' ');
  }

  getItemIcon(item: string): string {
    const normalized = item.toLowerCase().replace(/\s+/g, '-');
    const mapped = {
      iocs: 'ioc',
      'file-scanner': 'archive',
      'crypto-scanner': 'cryptocurrency',
    }[normalized] || normalized;
    return `/assets/images/sidebar/sub_${mapped}.svg`;
  }
}
