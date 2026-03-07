import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { LowerPipe } from '../../../pipes/lower.pipe';
import { sidebarItemTooltips } from '../../../constants/shared-enums';
@Component({
  selector: 'app-dashboard-sidebar-collapsed',
  standalone: true,
  imports: [NgClass, AsyncPipe, RouterLink, TooltipDirective, LowerPipe],
  templateUrl: './dashboard-sidebar-collapsed.component.html',
})
export class SidebarSectionComponent {
  protected readonly itemTooltips = sidebarItemTooltips;

  @Input() title = '';
  @Input() icon = '';
  @Input() items: string[] = [];
  @Input() category: any;
  @Input() routePrefix = '';
  @Input() selectionStore: any;
  @Input() tooltip = '';

  @Output() sectionSelected = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<string>();

  selectSection() {
    this.sectionSelected.emit(this.category);
  }

  selectOption(item: string) {
    this.optionSelected.emit(item);
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
