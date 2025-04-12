import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {FiltersComponent} from '../../shared/partials/filters/filters.component';
import {DirectoryListComponent} from './directory-list/directory-list.component';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {FilterModel} from '../../shared/model/filter/filter.model';
import {directory_filters} from '../../shared/constants/filters';
import {SidebarService} from '../../shared/services/sidebar.service';
import {DirectoryService} from '../../services/directory/directory.service';
import {DirectoryCallbackModel} from '../../shared/model/directory/directory.model';
import {
  PaginationComponent
} from '../../shared/partials/pagination/pagination.component';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-directory', templateUrl: './directory.component.html', imports: [FiltersComponent, DirectoryListComponent, NgOptimizedImage, AsyncPipe, FiltersComponent, PaginationComponent,],
})
export class DirectoryComponent {
  directoryData$: Observable<DirectoryCallbackModel | null>;
  isFilterOpen$: Observable<boolean>;
  filterModel: FilterModel = directory_filters;
  selectedFilters: { [key: string]: string | null } = {};
  totalPages: number = 0;

  constructor(private router: Router, private route: ActivatedRoute, private sidebarService: SidebarService, private directoryService: DirectoryService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
    this.directoryData$ = this.directoryService.directoryData$;

    this.directoryData$.subscribe(data => {
      if (data) {
        this.totalPages = Math.ceil(data.total_count / 500);
      }
    });

  }

  openSidebar() {
    this.sidebarService.openSidebar();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    this.reloadDirectory();
  }

  resetFilters() {
    this.selectedFilters = {};
    this.reloadDirectory();
  }

  onPageChange(currentPage: number) {
    this.directoryService.setCurrentPage(currentPage);
    this.directoryService.reloadDirectoryData({page: currentPage});
  }

  private reloadDirectory(): void {
    const filteredParams = Object.fromEntries(Object.entries(this.selectedFilters).filter(([_, value]) => value !== null && value !== ''));

    this.router.navigate([], {
      relativeTo: this.route, queryParams: filteredParams, queryParamsHandling: 'merge',
    }).then();

    this.directoryService.reloadDirectoryData(filteredParams);
  }
}
