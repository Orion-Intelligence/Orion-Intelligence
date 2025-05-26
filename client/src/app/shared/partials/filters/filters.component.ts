import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FilterModel } from '../../model/filter/filter.model';
import { last } from 'rxjs';
import { filterAnimation } from '../../animations/filter.animation';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { MultipleSelectionComponent } from './multiple-selection/multiple-selection.component';
import { ActivatedRoute } from '@angular/router';
import {ALT} from '@angular/cdk/keycodes';

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
  @Output() filterChanged = new EventEmitter<{ [key: string]: string | null }>();
  @Output() filterReset = new EventEmitter<void>();
  @Output() filterClose = new EventEmitter<void>();

  selectedFilters: { [key: string]: string | null } = {};

  constructor(private route: ActivatedRoute) { }


  ngOnInit() {
    this.initializeFilters();
    this.readFiltersFromUrl();
  }

  private initializeFilters() {
    this.selectedFilters = Object.keys(this.filterModel.filters)
      .reduce((acc, key) => ({
        ...acc,
        [key]: null,
      }), {});
  }

  private readFiltersFromUrl() {
    this.route.queryParams.subscribe(params => {
      Object.keys(this.filterModel.filters).forEach(key => {
        this.selectedFilters[key] = params[key] ?? null;
      });
    });
  }

  updateFilter(event: { key: string; value: string }) {
    this.selectedFilters[event.key] = event.value;
  }
  onSelectionChange(key: string, value: string | null) {
    this.selectedFilters[key] = value;
  }

  applyFilters() {
    this.filterChanged.emit({ ...this.selectedFilters });
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

  protected readonly Object = Object;
  protected readonly last = last;
  protected readonly JSON = JSON;
}
