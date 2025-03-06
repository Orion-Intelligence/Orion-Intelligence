import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {dashboardGlobalAnimation} from '../../shared/animations/dashboard.global.animations';
import {DashboardSidebarComponent} from '../../shared/partials/intel-results/dashboard-sidebar/dashboard-sidebar.component';
import {DashboardHeaderComponent} from '../../shared/partials/intel-results/dashboard-header/dashboard-header.component';

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
  animations: [dashboardGlobalAnimation]
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
