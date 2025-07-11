import { AfterViewInit, ChangeDetectorRef, Component, Renderer2 } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { dashboardGlobalAnimation } from '../../shared/animations/dashboard.global.animations';
import { DashboardSidebarComponent } from '../../shared/partials/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/header/dashboard-header/dashboard-header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { GraphsComponent } from "../../shared/partials/charts/charts.component";
import { GraphModel } from '../../shared/model/charts/charts.model'
import { CustomizeBarChartComponent } from "../../shared/partials/customize-bar-chart/customize-bar-chart.component";

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
    GraphsComponent,
    CustomizeBarChartComponent
  ],
  templateUrl: './dashboard.component.html',
  animations: [dashboardGlobalAnimation]
})
export class DashboardComponent implements AfterViewInit {
  isMenuOpen = true;
  animationState: any;


  constructor(private cdr: ChangeDetectorRef, public router: Router, private renderer: Renderer2) {
  }
  barGraphData: GraphModel = {
    type: 'bar',
    title: 'Bar Sales Breakdown',
    data: [
      { name: 'Mon', value: 14000, target: 40000 },
      { name: 'Tue', value: 32000, target: 40000 },
      { name: 'Wed', value: 33567, target: 40000 },
      { name: 'Thu', value: 22000, target: 40000 },
      { name: 'Fri', value: 38000, target: 40000 },
    ]
  };
  // pieGraphData: GraphModel = {
  //   type: 'pie',
  //   title: 'Pie Sales Breakdown',
  //   data: [
  //     { name: 'Total Sales', value: 900 },
  //     { name: 'In Store Sales', value: 500 },
  //     { name: 'Download Sales', value: 300 },
  //     { name: 'Mail Sales', value: 100 },
  //   ]
  // };
  // barGraphData: GraphModel = {
  //   type: 'bar',
  //   title: 'Bar Sales Breakdown',
  //   data: [
  //     { name: 'Total Sales', value: 900 },
  //     { name: 'In Store Sales', value: 500 },
  //     { name: 'Download Sales', value: 300 },
  //     { name: 'Mail Sales', value: 100 },
  //   ]
  // };
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
