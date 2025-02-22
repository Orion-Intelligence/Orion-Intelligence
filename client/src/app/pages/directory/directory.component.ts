import { Component } from '@angular/core';
import {ToolbarComponent} from '../../shared/partials/toolbar/toolbar.component';
import {FiltersComponent} from '../../shared/partials/directory/directory-filters/directory-filters.component';
import {FooterComponent} from '../../shared/partials/footer/footer.component';
import {DirectoryListComponent} from '../../shared/partials/directory/directory-list/directory-list.component';
import {DirectoryPaginationComponent} from '../../shared/partials/directory/directory-pagination/directory-pagination.component';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {DirectoryService} from '../../services/directory/directory.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-directory',
  templateUrl: './directory.component.html',
  imports: [
    ToolbarComponent,
    FiltersComponent,
    DirectoryListComponent,
    FooterComponent,
    DirectoryPaginationComponent,
    NgOptimizedImage,
    AsyncPipe,
  ]
})
export class DirectoryComponent {
  isFilterOpen$: Observable<boolean>;

  constructor(private directoryService: DirectoryService) {
    this.isFilterOpen$ = this.directoryService.sidebarState$;
  }

  openSidebar() {
    this.directoryService.openSidebar();
  }

}
