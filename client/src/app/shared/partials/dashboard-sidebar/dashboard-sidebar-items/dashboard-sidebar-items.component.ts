import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncPipe, NgClass, NgForOf, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { LowerPipe } from '../../../pipes/lower.pipe';
import { SelectionStoreService } from '../../../../services/dashboard/selection.service';

@Component({
  selector: 'app-dashboard-sidebar-items',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, NgForOf, TooltipDirective, LowerPipe],
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

  constructor(protected selectionStore: SelectionStoreService) {
  }

  selectSection() {
    this.sectionSelected.emit(this.category);
  }

  selectOption(item: string) {
    this.optionSelected.emit(item);
  }
  replaceDashWithSpace(value: string): string {
    if (!value) return '';
    return value.replace(/-/g, ' ');
  }

}
