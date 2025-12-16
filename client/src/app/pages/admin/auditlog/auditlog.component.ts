import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { Observable, BehaviorSubject, take } from 'rxjs';
import { FilterModel } from '../../../shared/model/filter/filter.model';
import { audit_filters } from '../../../shared/constants/filters';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditlogListComponent } from './auditlog-list/auditlog-list.component';
import { AuditLogCallbackModel } from '../../../shared/model/auditlog/auditlog.model';
import { AuditlogService } from '../../../services/auditlog/auditlog.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-auditlog',
  imports: [FormsModule, PaginationComponent, AsyncPipe, AuditlogListComponent, FiltersComponent, NgOptimizedImage],
  templateUrl: './auditlog.component.html'
})
export class AuditlogComponent implements OnInit {
  auditData$: Observable<AuditLogCallbackModel | null>;
  filterModel: FilterModel = audit_filters;
  selectedFilters: Record<string, string | null> = {};
  totalPages = 0;
  searchQuery: any;
  isLoading = signal(false);
  isFilterOpen$ = new BehaviorSubject<boolean>(false);

  constructor(protected dashboard: DashboardService, private auditService: AuditlogService, private route: ActivatedRoute, private router: Router) {
    this.auditData$ = this.auditService.auditData$;
    this.auditData$.subscribe(data => {
      if (data) {
        this.totalPages = Math.ceil(data.total_count / 100);
        this.isLoading.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      const baseFilters = this.filterModel.filters;
      const newFilters: any = {};
      const initialSelectedFilters: Record<string, string> = {};

      Object.keys(baseFilters).forEach(key => {
        const base = baseFilters[key];
        const value = params[key];

        if (value && base.options.includes(value)) {
          newFilters[key] = { ...base, selected: value };
          initialSelectedFilters[key] = value;
        } else {
          newFilters[key] = { ...base };
        }
      });

      this.filterModel = {
        ...this.filterModel,
        filters: newFilters
      };

      this.selectedFilters = initialSelectedFilters;
      this.searchQuery = params['q'] || '';
      this.applyFilters(this.dashboard.selectedFilters())
    });
  }

  onPageChange(currentPage: number): void {
    this.isLoading.set(true);
    this.auditService.setCurrentPage(currentPage);
    this.auditService.reloadAuditData({ ...this.selectedFilters, page: currentPage });
  }

  openSidebar(): void {
    this.isFilterOpen$.next(true);
  }

  closeSidebar(): void {
    this.isFilterOpen$.next(false);
  }

  applyFilters(filters: Record<string, string | null>): void {
    this.selectedFilters = filters;
    this.auditService.reloadAuditData({ ...this.selectedFilters, page: 1 });

    const filteredParams = Object.fromEntries(
      Object.entries(this.selectedFilters).filter(
        ([, value]) => value !== null && value !== ''
      )
    );

    this.isLoading.set(true);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filteredParams,
      queryParamsHandling: 'merge',
    }).then();
  }

  resetFilters(): void {
    this.selectedFilters = {};
    Object.keys(this.filterModel.filters).forEach(key => {
      delete (this.filterModel.filters as any)[key].selected;
    });
    const currentUrl = this.router.url.split('?')[0];
    this.router.navigateByUrl(currentUrl, { replaceUrl: true }).then(() => {
      this.applyFilters(this.dashboard.selectedFilters())
    });
  }
}
