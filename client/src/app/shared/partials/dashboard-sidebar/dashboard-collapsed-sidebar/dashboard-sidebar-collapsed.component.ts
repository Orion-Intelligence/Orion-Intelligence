import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';
import {LowerPipe} from '../../../model/pipes/lower.pipe';

@Component({
  selector: 'app-dashboard-sidebar-collapsed',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, NgForOf, TooltipDirective, LowerPipe],
  templateUrl: './dashboard-sidebar-collapsed.component.html',
})
export class SidebarSectionComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() items: string[] = [];
  @Input() category: any;
  @Input() routePrefix = '';
  @Input() selectionStore: any;
  @Input() tooltip = '';

  @Output() sectionSelected = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<string>();
  itemTooltips: Record<string, string> = {
    'All': 'Comprehensive Overview',
    'General': 'Broad Data Pool',
    'Forums': 'Forum Intelligence',
    'News': 'Trending Alerts',
    'Stolen': 'Stolen Info Logs',
    'Drugs': 'Narcotics Tracker',
    'Hacking': 'Hacking Insights',
    'Marketplaces': 'Trade Monitoring',
    'Cryptocurrency': 'Crypto Transactions',
    'Leaks': 'Data Leaks',
    'Databases': 'Breach Records',
    'Tracking': 'Breach Tracker',
    'CVE': 'CVE',
    'Mitre': 'Mitre',
    'Listing': 'Listing',
    'Credential': 'Credential',
    'Email': 'Email',
    'Telegram': 'telegram',
    'Archive': 'archive',
  };

  selectSection() {
    this.sectionSelected.emit(this.category);
  }

  selectOption(item: string) {
    this.optionSelected.emit(item);
  }
}
