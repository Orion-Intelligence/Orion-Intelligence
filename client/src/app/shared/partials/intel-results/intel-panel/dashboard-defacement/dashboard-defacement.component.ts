import {Component} from '@angular/core';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {PaginationComponent} from '../../../pagination/pagination.component';
import {FiltersComponent} from '../../../filters/filters.component';
import {Observable} from 'rxjs';
import {DirectoryCallbackModel} from '../../../../model/directory/directory.model';
import {FilterModel} from '../../../../model/filter/filter.model';
import {directory_filters} from '../../../../constants/filters';
import {SidebarService} from '../../../../../services/shared/sidebar.service';
import {DirectoryService} from '../../../../../services/directory/directory.service';
import {
  DashboardDefacementResultGridComponent
} from '../dashboard-results/dashboard-defacement-result-grid/dashboard-defacement-result-grid.component';

@Component({
  selector: 'app-dashboard-defacement',
  imports: [AsyncPipe, PaginationComponent, DashboardDefacementResultGridComponent, FiltersComponent, NgOptimizedImage],
  templateUrl: './dashboard-defacement.component.html'
})
export class DashboardDefacementComponent {
  directoryData$: Observable<DirectoryCallbackModel | null>;
  isFilterOpen$: Observable<boolean>;
  filterModel: FilterModel = directory_filters;
  selectedFilters: { [key: string]: string | null } = {};
  totalPages: number = 0;

  constructor(private sidebarService: SidebarService, private directoryService: DirectoryService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
    this.directoryData$ = this.directoryService.directoryData$;

    this.directoryData$.subscribe(data => {
      if (data) {
        this.totalPages = Math.ceil(data.total_count / 10);
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

  private reloadDirectory() {
    const filteredParams = Object.fromEntries(Object.entries(this.selectedFilters).filter(([_, value]) => value !== null && value !== ''));

    this.directoryService.reloadDirectoryData(filteredParams);
  }
}
