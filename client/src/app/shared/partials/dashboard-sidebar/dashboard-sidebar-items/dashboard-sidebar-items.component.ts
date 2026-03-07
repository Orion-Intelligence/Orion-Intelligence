import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { LowerPipe } from '../../../pipes/lower.pipe';
import { SelectionStoreService } from '../../../../services/dashboard/selection.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { SubscriptionService } from '../../../../services/dashboard/subscription.service';
@Component({
  selector: 'app-dashboard-sidebar-items',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, TooltipDirective, LowerPipe],
  templateUrl: './dashboard-sidebar-items.component.html',
})
export class DashboardSidebarItemsComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() items: string[] = [];
  @Input() category: any;
  @Input() routePrefix = '';
  @Input() tooltip = '';

  @Output() sectionSelected = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<string>();

  constructor(protected selectionStore: SelectionStoreService, protected licenseService: LicenseService, protected subscriptionService: SubscriptionService) {
  }

  selectSection() {
    this.sectionSelected.emit(this.category);
  }

  selectOption(item: string) {
    this.optionSelected.emit(item);
  }

  replaceDashWithSpace(value: string): string {
    if (!value) {
      return '';
    }
    return value.replace(/-/g, ' ');
  }
}
