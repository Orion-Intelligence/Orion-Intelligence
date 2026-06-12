import { Component, effect, OnInit, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { FilterModel } from '../../model/filter/filter.model';
import { last } from 'rxjs';
import { filterAnimation } from '../../animations/filter.animation';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ScrollService } from '../../services/scroll.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, TooltipDirective, DatePickerComponent, TranslatePipe],
  animations: [filterAnimation],
})
export class FiltersComponent implements OnInit {
  protected readonly Object = Object;
  protected readonly last = last;

  readonly filterModelInput = input<FilterModel | undefined>(undefined, { alias: 'filterModel' });
  selectedFilters: Record<string, string | null> = {};
  initialModel!: FilterModel;
  filterModel!: FilterModel;
  readonly isFilterOpen = input.required<boolean | null>();
  readonly filterChanged = output<Record<string, string | null>>();
  readonly filterReset = output<undefined>();
  readonly filterClose = output<undefined>();

  constructor(protected dashboard: DashboardService, private scrollService: ScrollService) {
    effect(() => {
      const currentFilters = this.dashboard.selectedFilters();
      this.selectedFilters = { ...currentFilters };
    });
    effect(() => {
      const filterModel = this.filterModelInput();
      if (filterModel === undefined) {
        return;
      }
      this.filterModel = filterModel;
      this.initialModel = structuredClone(filterModel);
    });
  }

  ngOnInit() {
    if (this.filterModel) {
      this.initialModel = structuredClone(this.filterModel);
    }
  }

  updateFilter( event: { key: string; value: string; } ) {
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
    this.scrollService.clearSavedPosition();
    this.dashboard.selectedFilters.set(this.selectedFilters);
    this.filterChanged.emit({ ...this.selectedFilters });
    this.closeFilter();
  }

  closeFilter() {
    // TODO: The 'emit' function requires a mandatory void argument
    this.filterClose.emit(undefined);
  }

  resetFilters() {
    this.scrollService.clearSavedPosition();
    this.dashboard.selectedFilters.set({});
    this.filterChanged.emit({ ...this.selectedFilters });
    // TODO: The 'emit' function requires a mandatory void argument
    this.filterReset.emit(undefined);
    this.closeFilter();
  }

  getOptionLabel(filterKey: string): string {
    let selectedKey = this.selectedFilters[filterKey];
    if (!selectedKey) {
      return 'Select';
    }
    selectedKey = selectedKey === "true" ? "yes" : selectedKey === "false" ? "no" : selectedKey;
    const options = this.filterModel.filters[filterKey].options;
    const option = options.find(opt => opt.key === selectedKey);
    return option ? option.label : 'Select';
  }
}
