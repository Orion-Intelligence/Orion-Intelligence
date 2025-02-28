import {Component} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {filter, Observable} from 'rxjs';
import {DirectoryService} from '../../../../../services/directory/directory.service';
import {NavigationEnd, Router} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard-leak',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './dashboard-leak.component.html',
  styleUrl: './dashboard-leak.component.css'
})
export class DashboardLeakComponent {
  ery: string = '';
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

}
