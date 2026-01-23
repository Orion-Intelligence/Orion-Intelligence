import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import {Router, RouterOutlet} from '@angular/router';
import { dashboardGlobalAnimation } from '../../shared/animations/dashboard.global.animations';
import { DashboardSidebarComponent } from '../../shared/partials/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/header/dashboard-header/dashboard-header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProSubscriptionComponent } from '../../shared/partials/pro-subscription/pro-subscription.component';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { AppService } from '../../services/core/app/app.service';
import {AuthService} from '../../services/authetication/auth.service';

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
    ProSubscriptionComponent,
  ],
  templateUrl: './dashboard.component.html',
  animations: [dashboardGlobalAnimation]
})
export class DashboardComponent implements AfterViewInit, OnInit {
  isMenuOpen = true;
  animationState: any;

  constructor(protected dashboardService: DashboardService, private cdr: ChangeDetectorRef, public router: Router, public authService:AuthService, protected appService: AppService) {
  }
  ngOnInit(): void {
    this.appService.set('isSidebarOpen', this.isMenuOpen);
  }

  toggleNavigation() {
    this.isMenuOpen = !this.isMenuOpen;
    this.appService.set('isSidebarOpen', this.isMenuOpen);
  }

  prepareRoute(outlet: RouterOutlet) {
    this.animationState = outlet?.activatedRouteData?.['animation'] || null;
    return this.animationState;
  }

  isCtiGraph(): boolean {
    return this.router.url.includes('/dashboard/ctigraph') || this.router.url.includes('/dashboard/social-mapper');
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  hideSubscription() {
    this.dashboardService.showSubscription.set(false)
  }
}
