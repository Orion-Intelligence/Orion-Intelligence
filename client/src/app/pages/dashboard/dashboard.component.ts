import {AfterViewInit, ChangeDetectorRef, Component} from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import {DashboardSidebarComponent} from '../../shared/partials/dashboard-sidebar/dashboard-sidebar.component';
import {DashboardHeaderComponent} from '../../shared/partials/header/dashboard-header/dashboard-header.component';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {ProSubscriptionComponent} from '../../shared/partials/pro-subscription/pro-subscription.component';
import {DashboardService} from '../../services/dashboard/dashboard.service';

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
    ProSubscriptionComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements AfterViewInit {
  isMenuOpen = true;
  animationState: any;

  constructor(protected dashboardService: DashboardService, private cdr: ChangeDetectorRef, public router: Router) {
  }

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

  hideSubscription() {
    this.dashboardService.showSubscription.set(false)
  }
}
