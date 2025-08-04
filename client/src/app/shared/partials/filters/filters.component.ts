import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FilterModel } from '../../model/filter/filter.model';
import { last } from 'rxjs';
import { filterAnimation } from '../../animations/filter.animation';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { MultipleSelectionComponent } from './multiple-selection/multiple-selection.component';
import { AppService } from '../../../services/core/app/app.service';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule, NgOptimizedImage, TooltipDirective, NgbModule, DatePickerComponent, MultipleSelectionComponent],
  animations: [filterAnimation],
})
export class FiltersComponent implements OnInit {
  @Input() filterModel!: FilterModel;
  @Input() isFilterOpen!: boolean | null;
  @Output() filterChanged = new EventEmitter<Record<string, string | null>>();
  @Output() filterReset = new EventEmitter<void>();
  @Output() filterClose = new EventEmitter<void>();

  initialModel!: FilterModel;
  selectedFilters: Record<string, string | null> = {};
  protected readonly Object = Object;
  protected readonly last = last;

  constructor(private app_service: AppService) {
  }

  ngOnInit() {
    this.initialModel = structuredClone(this.filterModel)
    this.initializeFilters();
    this.loadFiltersFromSettings();
  }

  updateFilter(event: { key: string; value: string }) {
    this.selectedFilters[event.key] = event.value;

    if (this.filterModel.filters[event.key]) {
      this.filterModel.filters[event.key].selected = event.value;
    }
  }

  onSelectionChange(key: string, value: string | null) {
    this.selectedFilters[key] = value;

    if (this.filterModel.filters[key]) {
      this.filterModel.filters[key].selected = value ?? '';
    }
  }

  applyFilters() {
    this.filterChanged.emit({ ...this.selectedFilters });
    this.saveFiltersToSettings();
    this.closeFilter();
  }

  closeFilter() {
    this.filterClose.emit();
  }

  resetFilters() {
    this.closeFilter();
    this.initializeFilters();
    this.filterReset.emit();
  }

  getOptionLabel(filterKey: string): string {
    let selectedKey = this.selectedFilters[filterKey];
    if (!selectedKey) return 'Select ' + this.filterModel.filters[filterKey].title;
    selectedKey = selectedKey === "true" ? "yes" : selectedKey === "false" ? "no" : selectedKey;

    const options = this.filterModel.filters[filterKey].options;
    const option = options.find(opt => opt.key === selectedKey);
    return option ? option.label : 'Select ' + this.filterModel.filters[filterKey].title;
  }

  private initializeFilters() {
    this.selectedFilters = Object.keys(this.initialModel.filters)
      .reduce((acc, key) => {
        const defaultValue = this.initialModel.filters[key].selected;
        const isDefault = defaultValue === 'all' || defaultValue === '' || (Array.isArray(defaultValue) && defaultValue.length === 0);
        this.filterModel.filters[key].selected = isDefault ? '' : defaultValue
        return {
          ...acc,
          [key]: isDefault ? null : defaultValue
        };
      }, {});
  }

  private saveFiltersToSettings() {
    const filtersToSave = Object.keys(this.filterModel.filters).reduce((acc, key) => {
      acc[key] = {
        title: this.filterModel.filters[key].title,
        selected: this.filterModel.filters[key].selected
      };
      return acc;
    }, {} as Record<string, { title: string; selected: string | string[] }>);

    this.app_service.set('sidebarFilters', filtersToSave);
  }
  private loadFiltersFromSettings() {
    const saved = this.app_service.getConfig().localSettings.sidebarFilters;
    if (!saved) return;

    for (const key of Object.keys(this.filterModel.filters)) {
      const current = this.filterModel.filters[key];
      const savedEntry = saved[key];

      if (savedEntry && savedEntry.title === current.title) {
        current.selected = savedEntry.selected;
        if (typeof savedEntry.selected === 'string') {
          this.selectedFilters[key] = savedEntry.selected;
        }
      }
    }
  }


}
