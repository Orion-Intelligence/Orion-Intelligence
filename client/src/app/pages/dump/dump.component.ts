import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {PaginationComponent} from '../../shared/partials/pagination/pagination.component';
import {FiltersComponent} from '../../shared/partials/filters/filters.component';
import {DumpService} from '../../services/dump/dump.service';
import {FilterModel} from '../../shared/model/filter/filter.model';
import {dump_filters} from '../../shared/constants/filters';
import {DumpListComponent} from './dump-list/dump-list.component';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {DumpCallbackModel} from '../../shared/model/dump/dump.mode';

@Component({
  selector: 'app-dump',
  standalone: true,
  templateUrl: './dump.component.html',
  imports: [
    NgOptimizedImage,
    PaginationComponent,
    AsyncPipe,
    FiltersComponent,
    DumpListComponent,
  ],
  styleUrls: ['../../../assets/styles/shared/listing/directory.component.css']
})
export class DumpComponent implements OnInit {
  dumpData$: Observable<DumpCallbackModel | null>;
  filterModel: FilterModel = dump_filters;
  selectedFilters: Record<string, string | null> = {};
  totalPages = 0;

  constructor(private dumpService: DumpService, private route: ActivatedRoute, private router: Router) {
    this.dumpData$ = this.dumpService.dumpData$;

    this.dumpData$.subscribe(data => {
      if (data) {
        this.totalPages = Math.ceil(data.total_count / 100);
      }
    });
  }

  get isFilterOpen$() {
    return this.dumpService.isFilterOpen$;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const baseFilters = this.filterModel.filters;
      const newFilters: any = {};
      const initialSelectedFilters: Record<string, string> = {};

      Object.keys(baseFilters).forEach(key => {
        const base = baseFilters[key];
        const value = params[key];

        if (value && base.options.includes(value)) {
          newFilters[key] = {...base, selected: value};
          initialSelectedFilters[key] = value;
        } else {
          newFilters[key] = {...base};
        }
      });

      this.filterModel = {
        ...this.filterModel,
        filters: newFilters
      };

      this.selectedFilters = initialSelectedFilters;
    });
  }

  onPageChange(currentPage: number): void {
    this.dumpService.setCurrentPage(currentPage);
    this.dumpService.reloadDumpData({...this.selectedFilters, page: currentPage});
  }

  openSidebar(): void {
    this.dumpService.toggleFilter(true);
  }

  closeSidebar(): void {
    this.dumpService.toggleFilter(false);
  }

  applyFilters(filters: Record<string, string | null>): void {
    this.selectedFilters = filters;
    this.reloadDump();
  }

  resetFilters(): void {
    this.selectedFilters = {};

    Object.keys(this.filterModel.filters).forEach(key => {
      delete (this.filterModel.filters as any)[key].selected;
    });

    const currentUrl = this.router.url.split('?')[0];
    this.router.navigateByUrl(currentUrl, {replaceUrl: true}).then(() => {
      this.reloadDump();
    });
  }

  private reloadDump(): void {
    const filteredParams = Object.fromEntries(
      Object.entries(this.selectedFilters).filter(
        ([, value]) => value !== null && value !== ''
      )
    );

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filteredParams,
      queryParamsHandling: 'merge',
    }).then();

    this.dumpService.reloadDumpData({...filteredParams, page: 1});
  }
}
