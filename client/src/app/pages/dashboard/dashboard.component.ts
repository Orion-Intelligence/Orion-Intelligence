import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { dashboardGlobalAnimation } from '../../shared/animations/dashboard.global.animations';
import { DashboardSidebarComponent } from '../../shared/partials/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/header/dashboard-header/dashboard-header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { GraphsComponent } from "../../shared/partials/charts/charts.component";
import { GraphModel } from '../../shared/model/charts/charts.model'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass,
    RouterOutlet,
    ScrollingModule,
    NgIf,
    GraphsComponent
  ],
  templateUrl: './dashboard.component.html',
  animations: [dashboardGlobalAnimation]
})
export class DashboardComponent implements AfterViewInit {
  isMenuOpen = true;
  animationState: any;

  pieGraphData: GraphModel = {
    type: 'pie',
    title: 'Pie Sales Breakdown',
    data: [
      { name: 'Total Sales', value: 900 },
      { name: 'In Store Sales', value: 500 },
      { name: 'Download Sales', value: 300 },
      { name: 'Mail Sales', value: 100 },
    ]
  };
  barGraphData: GraphModel = {
    type: 'bar',
    title: 'Bar Sales Breakdown',
    data: [
      { name: 'Total Sales', value: 900 },
      { name: 'In Store Sales', value: 500 },
      { name: 'Download Sales', value: 300 },
      { name: 'Mail Sales', value: 100 },
    ]
  };

  constructor(private cdr: ChangeDetectorRef, public router: Router) { }

  toggleNavigation() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  prepareRoute(outlet: RouterOutlet) {
    this.animationState = outlet?.activatedRouteData?.['animation'] || null;
    return this.animationState;
  }

  isCtiGraph(): boolean {
    return this.router.url.includes('/dashboard/ctigraph');
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
}
