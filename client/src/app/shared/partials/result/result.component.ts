import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Observable} from 'rxjs';
import {EmptyResultComponent} from '../empty-result/empty-result.component';
import {FormsModule} from '@angular/forms';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {LoadingFormComponent} from '../loading-form/loading-form.component';
import {fadeInDashboardItem} from '../../animations/dashboard.item.animation';
import {SidebarService} from '../../services/sidebar.service';
import {FiltersComponent} from '../filters/filters.component';
import {FilterModel} from '../../model/filter/filter.model';
import {SortType} from '../../constants/enums';
import {SuggestionComponent} from '../suggestion/suggestion.component';
import {EmptyQueryComponent} from '../empty-query/empty-query.component';
import {Suggestion} from '../../model/results/shared/common-result';
import {query} from '@angular/animations';
import {Category} from "../../enums/pages";
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ScrollTopComponent} from '../scroll-top/scroll-top.component';
import {TooltipDirective} from '../../directive/tooltip-directive.directive';
import {AppService} from '../../../services/core/app.service';

@Component({
  selector: 'app-result',
  standalone: true,
  templateUrl: './result.component.html',
  animations: [fadeInDashboardItem],
  imports: [CommonModule, EmptyResultComponent, FormsModule, NgOptimizedImage, LoadingFormComponent, FiltersComponent, SuggestionComponent, EmptyQueryComponent, RouterLink, ScrollTopComponent, TooltipDirective],
})
export class ResultComponent implements OnInit, OnChanges {
  @Input() result_count!: number;
  @Input() isLoading!: boolean;
  @Input() suggestion!: Suggestion | undefined;
  @Input() searchQuery = '';
  @Input() analyticsToggle = false;
  @Input() shrinkmenu = false;
  @Input() disableScroll = false;
  @Input() type!: Category;
  @Input() discussion = false;
  @Input() consolidated = false;
  @Input() showTabs = true;
  @Input() filterModel!: FilterModel
  @Input() showSorting: boolean = true

  @Output() reloadFilters = new EventEmitter<Record<string, string | null>>();
  @Output() resetFilter = new EventEmitter<void>();
  @Output() reloadData = new EventEmitter<void>();
  @Output() updateQuery = new EventEmitter<string>();
  @Output() onToggleSwitch = new EventEmitter<string>();
  @Output() onToggleSort = new EventEmitter<SortType>();

  selectedFilters: Record<string, string | null> = {};
  isFilterOpen$: Observable<boolean>;
  result_triggered = false
  SortType = SortType;
  selectedSortBy: SortType = SortType.DEFAULT;

  local_query = ""
  selectedSearchBy = 'Match any term';

  protected readonly query = query;
  protected readonly Category = Category;

  constructor(public app_service: AppService, public sidebarService: SidebarService, private route: ActivatedRoute) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnChanges(_: SimpleChanges): void {
    if (!this.local_query) {
      this.local_query = this.searchQuery
        ?.replace(/"/g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || '';
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const newFilters: any = {};
      const updatedSelectedFilters: Record<string, string> = {};

      if (this.filterModel)
        Object.keys(this.filterModel.filters).forEach(key => {
          const base = this.filterModel.filters[key];
          let value = params[key];

          if (key === 'mSearchParamSafeSearch') {
            if (value === 'true') value = 'yes';
            if (value === 'false') value = 'no';
          }

          if (value && base.options.includes(value)) {
            newFilters[key] = {...base, selected: value};
            updatedSelectedFilters[key] = value;
          } else {
            newFilters[key] = {...base};
          }
        });

      this.filterModel = {
        ...this.filterModel,
        filters: newFilters
      };

      this.selectedFilters = updatedSelectedFilters;
    });
    if (this.local_query) {
      this.result_triggered = true
    }
  }

  applyFilters(filters: Record<string, string | null>) {
    this.selectedFilters = filters;
    this.reloadFilters.emit(this.selectedFilters);
  }

  resetFilters() {
    this.selectedFilters = {};
    this.resetFilter.emit()
    this.result_triggered = true
  }

  onFormSubmit() {
    let query = "";
    let quoteCount = (this.local_query.match(/"/g) || []).length;

    if (this.local_query && quoteCount < 2) {
      query = this.local_query.replace(/"/g, ' ').replace(/\s+/g, ' ').trim();

      if (this.selectedSearchBy === 'Match indivisual terms') {
        if (query) {
          query = `"${query}"`;
        }
      } else if (this.selectedSearchBy === 'Match all terms') {
        if (query) {
          query = query.split(' ').map(t => `"${t}"`).join(' ');
        }
      }
    } else if (this.local_query) {
      query = this.local_query.replace(/^\s+|\s+$/g, '');
    }
    this.updateQuery.emit(query);
    this.searchQuery = query;
    this.reloadData.emit();
    this.result_triggered = true;
  }


  onGetSuggestion() {
    if (this.searchQuery && this.suggestion && this.suggestion.options.length > 0 && this.suggestion.options.length < 15) {
      return this.searchQuery.replace(this.suggestion?.text, this.suggestion?.options[0].text)
    } else {
      return ""
    }
  }

  onUpdateSuggestion(suggestion: string) {
    if (this.suggestion && this.suggestion.options.length) {
      this.searchQuery = suggestion
      this.updateQuery.emit(suggestion)
    }
    this.reloadData.emit()
    this.result_triggered = true
  }

  onTabClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('nav-link') || target.classList.contains('active')) return;

    const parent = target.closest('.nav-tabs');
    if (!parent) return;

    parent.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    target.classList.add('active');

    this.onToggleAnalytics(target.textContent?.trim() || '');
  }

  onToggleAnalytics(tab: string) {
    this.onToggleSwitch.emit(tab);
  }

  onToolToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const cfg = this.app_service.configData();
    cfg.settings.enable_advanced_tools = !cfg.settings.enable_advanced_tools;
    this.app_service.configData.set(cfg);
  }

  onSortChange(type: SortType): void {
    this.selectedSortBy = type;
    this.onToggleSort.emit(type);
  }
}
