import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from '@angular/common';
import { DirectoryService } from '../../../../services/directory/directory.service';
import { Observable } from 'rxjs';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-filters',
  templateUrl: './directory-filters.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgOptimizedImage,
    CommonModule
  ],
})
export class FiltersComponent {
  @Input() currentSection: string = ''; // Accepting currentSection from parent

  isFilterOpen$: Observable<boolean>;
  filterModel = {
    network: '',
    index: '',
    content_type: ''
  };

  constructor(private directoryService: DirectoryService) {
    this.isFilterOpen$ = this.directoryService.sidebarState$;
  }

  closeSidebar() {
    this.directoryService.closeSidebar();
  }

  onSubmit() {
    this.reloadDirectory();
  }

  resetFilters() {
    this.filterModel = {
      network: '',
      index: '',
      content_type: ''
    };
    this.reloadDirectory();
  }

  private reloadDirectory() {
    const filteredParams = Object.fromEntries(
      Object.entries(this.filterModel).filter(([_, value]) => value !== '')
    );

    this.directoryService.reloadDirectoryData(filteredParams);
  }
}
