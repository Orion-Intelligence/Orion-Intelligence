import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgFor, NgIf, CommonModule } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { filter_mapping } from '../../../shared/constants/filters';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { Router } from '@angular/router';
import { countFilterValues } from '../../../shared/utils/filter-values.util';
@Component({
  selector: 'app-selected-filter-bar',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './selected-filter-bar.component.html',
  animations: [fadeInDashboardItem],
  styles: [`
    :host-context(.light-theme) .selected-filter-shell {
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
      border-color: #d7dee8 !important;
    }

    :host-context(.light-theme) .selected-filter-chip {
      background: #eef4fb !important;
      border-color: #c7d5e6 !important;
      color: #1d4ed8 !important;
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
    }

    :host-context(.light-theme) .selected-filter-clear-btn {
      border-color: #93c5fd !important;
      color: #1d4ed8 !important;
    }

    :host-context(.light-theme) .selected-filter-clear-btn:hover {
      background: #eff6ff !important;
    }

    :host-context(.light-theme) .selected-filter-chevron {
      filter: brightness(0) saturate(100%) invert(28%) sepia(15%) saturate(1038%) hue-rotate(176deg) brightness(93%) contrast(90%);
    }

    :host-context(.light-theme) .selected-filter-close-icon {
      filter: brightness(0) saturate(100%) invert(28%) sepia(15%) saturate(1038%) hue-rotate(176deg) brightness(93%) contrast(90%);
      opacity: .92;
    }
  `],
})
export class SelectedFilterBarComponent implements OnInit {
  protected readonly filter_mapping = filter_mapping;

  categories: Record<string, string[]> = {};
  isFilterBarExpanded: boolean = false;
  maxVisibleTags = 8;
  Object: any;

  @Input() showSorting!: boolean;

  @Output() clearAll = new EventEmitter<void>();
  @Output() searchFiltersChange = new EventEmitter<void>();

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
