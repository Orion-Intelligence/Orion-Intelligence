import { Component, effect, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FilterModel } from '../../model/filter/filter.model';
import { last } from 'rxjs';
import { filterAnimation } from '../../animations/filter.animation';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
@Component({
    selector: 'app-filters',
    templateUrl: './filters.component.html',
    standalone: true,
    imports: [FormsModule, CommonModule, NgOptimizedImage, TooltipDirective, NgbModule, DatePickerComponent],
    animations: [filterAnimation],
})
export class FiltersComponent implements OnInit {
    selectedFilters: Record<string, string | null> = {};
    @Input()
    filterModel!: FilterModel;
    @Input()
    isFilterOpen!: boolean | null;
    @Output()
    filterChanged = new EventEmitter<Record<string, string | null>>();
    @Output()
    filterReset = new EventEmitter<void>();
    @Output()
    filterClose = new EventEmitter<void>();
    initialModel!: FilterModel;
    protected readonly Object = Object;
    protected readonly last = last;
    constructor(protected dashboard: DashboardService) {
        this.initialModel = structuredClone(this.filterModel);
        effect(() => {
            const currentFilters = this.dashboard.selectedFilters();
            this.selectedFilters = { ...currentFilters };
        });
    }
    ngOnInit() {
        this.initialModel = structuredClone(this.filterModel);
    }
    updateFilter(event: {
        key: string;
        value: string;
    }) {
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
        this.dashboard.selectedFilters.set(this.selectedFilters);
        this.filterChanged.emit({ ...this.selectedFilters });
        this.closeFilter();
    }
    closeFilter() {
        this.filterClose.emit();
    }
    resetFilters() {
        this.dashboard.selectedFilters.set({});
        this.filterChanged.emit({ ...this.selectedFilters });
        this.filterReset.emit();
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
