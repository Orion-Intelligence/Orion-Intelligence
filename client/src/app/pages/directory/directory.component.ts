import {Component} from '@angular/core';
import {Observable} from 'rxjs';
import {FiltersComponent} from '../../shared/partials/filters/filters.component';
import {DirectoryListComponent} from '../../shared/partials/directory/directory-list/directory-list.component';
import {DirectoryPaginationComponent} from '../../shared/partials/directory/directory-pagination/directory-pagination.component';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {FilterModel} from '../../shared/model/filter/filter';
import {directory_filters} from './constants/directory.filter';
import {SidebarService} from '../../services/shared/sidebar.service';
import {DirectoryService} from '../../services/directory/directory.service';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  imports: [
    FiltersComponent,
    DirectoryListComponent,
    DirectoryPaginationComponent,
    NgOptimizedImage,
    AsyncPipe,
    FiltersComponent,
  ],
})
export class DirectoryComponent {
  isFilterOpen$: Observable<boolean>;
  filterModel: FilterModel = directory_filters;
  selectedFilters: { [key: string]: string | null } = {};

  constructor(private sidebarService: SidebarService, private directoryService:DirectoryService) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  openSidebar() {
    this.sidebarService.openSidebar();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  applyFilters(filters: { [key: string]: string | null }) {
    this.selectedFilters = filters;
    console.log("Applying Filters:", this.selectedFilters);
    this.reloadDirectory();
  }

  resetFilters() {
    this.selectedFilters = {};
    this.reloadDirectory();
  }

  private reloadDirectory() {
    const filteredParams = Object.fromEntries(
      Object.entries(this.selectedFilters).filter(([_, value]) => value !== null && value !== '')
    );

    this.directoryService.reloadDirectoryData(filteredParams);
  }
}
