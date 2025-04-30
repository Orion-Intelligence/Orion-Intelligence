import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AsyncPipe, NgClass, NgForOf, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-dashboard-sidebar-items',
  standalone: true,
  imports: [NgClass, NgOptimizedImage, AsyncPipe, RouterLink, NgForOf, MatTooltipModule],
  templateUrl: './dashboard-sidebar-items.component.html',
})
export class DashboardSidebarItemsComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() items: string[] = [];
  @Input() category: any;
  @Input() routePrefix: string = '';
  @Input() selectionStore: any;
  @Input() tooltip: string = '';

  @Output() sectionSelected = new EventEmitter<any>();
  @Output() optionSelected = new EventEmitter<string>();

  selectSection() {
    this.sectionSelected.emit(this.category);
  }

  selectOption(item: string) {
    this.optionSelected.emit(item);
  }

  itemTooltips: { [key: string]: string } = {
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
  };

}
