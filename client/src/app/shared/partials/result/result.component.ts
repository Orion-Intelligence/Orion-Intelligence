import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Observable} from 'rxjs';
import {EmptyResultComponent} from '../empty-result/empty-result.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../animations/dashboard.item.animation';
import {SidebarService} from '../../../services/shared/sidebar.service';
import {FiltersComponent} from '../filters/filters.component';
import {FilterModel} from '../../model/filter/filter.model';
import {SuggestionComponent} from '../suggestion/suggestion.component';
import {EmptyQueryComponent} from '../empty-query/empty-query.component';
import {Suggestion} from '../../model/results/shared/common-result';
import {query} from '@angular/animations';

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  animations: [fadeInDashboardItem],
  imports: [CommonModule, EmptyResultComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, SuggestionComponent, EmptyQueryComponent,],
})
export class ResultComponent implements OnInit {
  @Input() result_count!: number;
  @Input() isLoading!: boolean;
  @Input() suggestion!: Suggestion | undefined;
  @Input() searchQuery: string = '';
  @Input() analyticsToggle: boolean = false;
  @Input() shrinkmenu: boolean = false;

  @Output() reloadFilters = new EventEmitter<[string | null, string | null]>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();
  @Output() onToggleSwitch = new EventEmitter<void>();
  @Input() filterModel!: FilterModel

  selectedFilters: { [key: string]: string | null } = {};
  isFilterOpen$: Observable<boolean>;
  result_triggered = false
  local_query = ""

  constructor(public sidebarService: SidebarService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnInit(): void {
    this.local_query = this.searchQuery
  }

  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    this.reloadFilters.emit([this.selectedFilters['mNetwork'], this.selectedFilters['mSearchParamSafeSearch']]);
  }

  resetFilters() {
    this.selectedFilters = {};
    this.reloadFilters.emit(["", ""]);
    this.reloadData.emit()
    this.result_triggered = true
  }

  onFormSubmit() {
    this.local_query = this.searchQuery
    this.reloadData.emit()
    this.result_triggered = true
  }

  onGetSuggestion(){
    if (this.suggestion && this.suggestion.options.length>0 && this.suggestion.options.length<15 ) {
      return  this.local_query.replace(this.suggestion?.text, this.suggestion?.options[0].text)
    }else {
      return ""
    }
  }

  onUpdateSuggestion(suggestion:string) {
    if (this.suggestion && this.suggestion.options.length) {
      this.searchQuery = suggestion
      this.updateQuery.emit(suggestion)
    }
    this.reloadData.emit()
    this.result_triggered = true
  }

  onSearchChange($event: any) {
    this.updateQuery.emit($event)
  }

  onToggleAnalytics() {
    this.onToggleSwitch.emit()
  }

  protected readonly query = query;
}
