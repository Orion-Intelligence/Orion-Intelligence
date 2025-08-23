import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { filter_mapping } from '../../../shared/constants/filters';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { Router } from '@angular/router';


@Component({
  selector: 'app-selected-filter-bar',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './selected-filter-bar.component.html',
  animations: [fadeInDashboardItem],
})
export class SelectedFilterBarComponent implements OnInit {

  @Input() showSorting!: boolean;
  @Output() clearAll = new EventEmitter<void>();
  @Output() searchFiltersChange = new EventEmitter<void>();

  categories: Record<string, string[]> = {};
  isFilterBarExpanded: boolean = false;

  maxVisibleTags = 8;
  Object: any;

  get selectedFilters() {
    return this.dashboardService.selectedFilters();
  }

  constructor(protected app_service: AppService, protected dashboardService: DashboardService, private router: Router) {
  }

  isConsolidatedRoute(): boolean {
    return true;
  }

  ngOnInit(): void {
    this.categories = this.app_service.configData().localSettings.entityfilterCategories;
  }

  clearMatchType(): void {
    this.dashboardService.selectedFilters.update((filters) => {
      const updated = { ...filters };
      delete updated["matchtype"];
      return updated;
    });
    this.app_service.set('matchType', "semantic");
    this.clearAll.emit();
  }

  clearFilters(scope: 'sidebar' | 'entity' | 'all'): void {
    if (scope === 'sidebar' || scope === 'all') {
      this.dashboardService.selectedFilters.set({})
    }

    if (scope === 'entity' || scope === 'all') {
      if (this.isConsolidatedRoute()) {
        this.app_service.set('entityfilterCategories', {});
      }
    }
    this.app_service.set('matchType', "semantic");
    this.clearAll.emit();
  }

  removeEntityTypeFilterTag(tagToRemoveId: string) {
    const categories = { ...this.app_service.configData().localSettings.entityfilterCategories };
    for (const key in categories) {
      const value = categories[key];
      if (Array.isArray(value)) {
        categories[key] = value.filter(tag => tag !== tagToRemoveId);
      } else if (value === tagToRemoveId) {
        delete categories[key];
      }
    }

    this.app_service.set('entityfilterCategories', categories);
    this.searchFiltersChange.emit();
  }

  toggleFilterBarCollapse(): void {
    this.isFilterBarExpanded = !this.isFilterBarExpanded;
  }

  sidebarFilters() {
    return Object.keys(this.dashboardService.selectedFilters());
  }

  sidebarFilterCount(all: boolean = false): number {
    if (all) {
      return Object.entries(this.dashboardService.selectedFilters())
        .filter(([key, value]) => key !== 'matchtype' || value !== 'semantic')
        .length;
    } else {
      return Object.entries(this.dashboardService.selectedFilters())
        .filter(([key, value]) => key !== 'matchtype' && value !== null)
        .length;
    }
  }

  entityFiltersCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    return Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) return count + val.length;
      return count + 1;
    }, 0);
  }

  getVisibleTags(): string[] {
    const allTags = Object.values(this.app_service.configData().localSettings.entityfilterCategories).flat();
    return allTags.slice(0, this.maxVisibleTags);
  }

  getHiddenTagCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    const totalTags = Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) return count + val.length;
      return count + 1;
    }, 0);
    return Math.max(0, totalTags - this.maxVisibleTags);
  }

  protected readonly filter_mapping = filter_mapping;
}
