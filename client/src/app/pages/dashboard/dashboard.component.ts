import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { DashboardSidebarComponent } from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import { RouterOutlet } from '@angular/router';
import { fadeInDashboard } from '../app/animations/dashboard.animations';

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
export class DashboardComponent implements AfterViewInit {
  isMenuOpen = true;
  animationState: any;

  constructor(private cdr: ChangeDetectorRef) {}

  toggleNavigation() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  prepareRoute(outlet: RouterOutlet) {
    this.animationState = outlet?.activatedRouteData?.['animation'] || null;
    return this.animationState;
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
