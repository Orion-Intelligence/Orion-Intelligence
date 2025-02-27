import { Component } from '@angular/core';
import {AsyncPipe, NgClass, NgForOf, NgOptimizedImage} from "@angular/common";
import {FiltersComponent} from "../../../directory/directory-filters/directory-filters.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {filter, Observable} from 'rxjs';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {DirectoryService} from '../../../../../services/directory/directory.service';
import {NavigationEnd, Router} from '@angular/router';

@Component({
  selector: 'app-dashboard-api',
  imports: [
    AsyncPipe,
    FiltersComponent,
    FormsModule,
    NgForOf,
    NgOptimizedImage,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './dashboard-api.component.html',
  styleUrl: './dashboard-api.component.css'
})
export class DashboardApiComponent {
  ery: string = '';
  isFilterOpen$: Observable<boolean>;
  currentSection: string = '';
  searchQuery: string = '';

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
