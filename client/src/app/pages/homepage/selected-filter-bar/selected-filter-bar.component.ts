import { Component, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { filter_mapping } from '../../../shared/constants/filters';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { Router } from '@angular/router';
import { countFilterValues } from '../../../shared/utils/filter-values.util';
@Component({
  selector: 'app-selected-filter-bar',
  imports: [CommonModule],
  templateUrl: './selected-filter-bar.component.html',
  animations: [fadeInDashboardItem],
})
export class SelectedFilterBarComponent implements OnInit {
  protected readonly filter_mapping = filter_mapping;

  categories: Record<string, string[]> = {};
  isFilterBarExpanded: boolean = false;
  maxVisibleTags = 8;
  Object: any;
  readonly showSorting = input.required<boolean>();
  readonly clearAll = output<void>();
  readonly searchFiltersChange = output<void>();

  get selectedFilters() {
    return this.dashboardService.selectedFilters();
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
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
    this.app_service.set('matchType', "or");
    // TODO: The 'emit' function requires a mandatory void argument
    this.clearAll.emit();
  }

  clearFilters(scope: 'sidebar' | 'entity' | 'all'): void {
    if (scope === 'sidebar' || scope === 'all') {
      this.dashboardService.selectedFilters.set({});
    }
    if (scope === 'entity' || scope === 'all') {
      if (this.isConsolidatedRoute()) {
        this.app_service.set('entityfilterCategories', {});
      }
    }
    if (scope=='all'){
      this.app_service.set('matchType', "or");
    }
    // TODO: The 'emit' function requires a mandatory void argument
    this.clearAll.emit();
  }

  removeEntityTypeFilterTag(tagToRemoveId: string) {
    const categories = { ...this.app_service.configData().localSettings.entityfilterCategories };
    for (const key in categories) {
      const value = categories[key];
      if (Array.isArray(value)) {
        categories[key] = value.filter(tag => tag !== tagToRemoveId);
      }
      else if (value === tagToRemoveId) {
        delete categories[key];
      }
    }
    this.app_service.set('entityfilterCategories', categories);
    // TODO: The 'emit' function requires a mandatory void argument
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
        .filter(([key, value]) => key !== 'matchtype' || value !== 'or')
        .length;
    }
    else {
      return Object.entries(this.dashboardService.selectedFilters())
        .filter(([key, value]) => key !== 'matchtype' && value !== null)
        .length;
    }
  }

  entityFiltersCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    return countFilterValues(categories);
  }

  getVisibleTags(): string[] {
    const allTags = Object.values(this.app_service.configData().localSettings.entityfilterCategories).flat();
    return allTags.slice(0, this.maxVisibleTags);
  }

  getHiddenTagCount(): number {
    const categories = this.app_service.configData().localSettings.entityfilterCategories;
    const totalTags = countFilterValues(categories);
    return Math.max(0, totalTags - this.maxVisibleTags);
  }
}
