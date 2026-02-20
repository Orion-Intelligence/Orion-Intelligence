import { Directive, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, take } from 'rxjs';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { FilterModel } from '../model/filter/filter.model';
export interface BaseListResponse {
    total_count: number;
}
export interface ListService<T extends BaseListResponse> {
    reload(params: any): void;
    setCurrentPage(page: number): void;
}
@Directive()
export abstract class BaseListingComponent<T extends BaseListResponse> implements OnInit {
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);
  protected dashboard = inject(DashboardService);
  protected destroyRef = inject(DestroyRef);
    abstract filterModel: FilterModel;
    selectedFilters: Record<string, string | null> = {};
    totalPages = 0;
    searchQuery = '';
    isLoading = signal(false);
    protected abstract data$: Observable<T | null>;
    protected abstract service: ListService<T>;
    abstract isFilterOpen$: Observable<boolean>;
    abstract openSidebar(): void;
    abstract closeSidebar(): void;

    ngOnInit(): void {
      this.data$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
        if (data) {
          this.totalPages = Math.ceil(data.total_count / 100);
          this.isLoading.set(false);
        }
      });
      this.route.queryParams.pipe(take(1)).subscribe(params => {
        this.initializeFilters(params);
        const page = parseInt(params['page'], 10) || 1;
        this.service.setCurrentPage(page);
        const mergedFilters = { ...this.dashboard.selectedFilters(), ...this.selectedFilters };
        this.selectedFilters = mergedFilters;
        this.isLoading.set(true);
        this.service.reload({ ...mergedFilters, q: this.searchQuery || null, page });
      });
    }

    private initializeFilters(params: any): void {
      const baseFilters = this.filterModel.filters;
      const initialSelected: Record<string, string> = {};
      Object.keys(baseFilters).forEach(key => {
        const value = params[key];
        if (value && baseFilters[key].options.includes(value)) {
          baseFilters[key].selected = value;
          initialSelected[key] = value;
        }
      });
      this.selectedFilters = initialSelected;
      this.searchQuery = params['q'] || '';
    }

    onPageChange(page: number): void {
      this.isLoading.set(true);
      this.service.setCurrentPage(page);
      const queryParams = { ...this.selectedFilters, q: this.searchQuery || null, page };
      this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
      this.service.reload(queryParams);
    }

    applyFilters(filters: Record<string, string | null>): void {
      this.selectedFilters = filters;
      this.reload();
    }

    onSearchSubmit(): void {
      this.reload();
    }

    resetFilters(): void {
      this.selectedFilters = {};
      Object.keys(this.filterModel.filters).forEach(key => delete (this.filterModel.filters as any)[key].selected);
      const currentUrl = this.router.url.split('?')[0];
      this.router.navigateByUrl(currentUrl, { replaceUrl: true }).then(() => this.reload());
    }

    protected reload(): void {
      this.isLoading.set(true);
      const queryParams = { ...this.selectedFilters, q: this.searchQuery || null, page: 1 };
      this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
      this.service.reload(queryParams);
    }
}
