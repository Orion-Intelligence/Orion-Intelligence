import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardSidebarComponent } from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import { RouterOutlet } from '@angular/router';
import {fadeInDashboard} from '../app/animations/dashboard.animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass,
    RouterOutlet,
  ],
  templateUrl: './dashboard.component.html',
  animations: [fadeInDashboard]
})
export class DashboardComponent {
  isMenuOpen = false;

  constructor() {}

  toggleSideNav() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  hideSideNav() {
    this.isMenuOpen = false;
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'] || null;
  }
}
