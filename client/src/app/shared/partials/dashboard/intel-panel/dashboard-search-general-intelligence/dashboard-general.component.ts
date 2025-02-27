import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { DashboardService } from '../../../../../services/dashboard/dashboard.service';
import { FormsModule } from '@angular/forms';
import { FiltersComponent } from '../../../directory/directory-filters/directory-filters.component';
import { DirectoryService } from '../../../../../services/directory/directory.service';
import { DashboardSearchNoSuggestionComponent } from '../dashboard-search-no-suggestion/dashboard-search-no-suggestion.component';
import { Observable, filter } from 'rxjs';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage, FiltersComponent, DashboardSearchNoSuggestionComponent],
  templateUrl: './dashboard-general.component.html',
  styleUrls: ['./dashboard-general.component.css']
})
export class DashboardGeneral {

  searchQuery: string = '';
  isFilterOpen$: Observable<boolean>;
  currentSection: string = '';

  constructor(
    public dashboardService: DashboardService,
    private directoryService: DirectoryService,
    private router: Router
  ) {
    this.updateCurrentSection(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateCurrentSection(event.url);
    });
    this.isFilterOpen$ = this.directoryService.sidebarState$;
  }

  private updateCurrentSection(url: string) {

    if (url.includes('/dashboard')) {
      this.currentSection = 'dashboard';
    } else if (url.includes('/directory')) {
      this.currentSection = 'directory';
    } else {
      this.currentSection = 'other';
    }
  }

  onSearchSubmit(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.dashboardService.searchGeneralParamModel.q = this.searchQuery.trim();
      this.dashboardService.fetchGeneralResults().subscribe();
    }
  }

  openSidebar() {
    this.directoryService.openSidebar();
  }
}
