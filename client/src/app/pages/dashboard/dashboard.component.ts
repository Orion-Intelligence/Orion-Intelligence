import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { dashboardGlobalAnimation } from '../../shared/animations/dashboard.global.animations';
import { DashboardSidebarComponent } from './dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/header/dashboard-header/dashboard-header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProSubscriptionComponent } from '../../shared/partials/pro-subscription/pro-subscription.component';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { AppService } from '../../services/core/app/app.service';
import { AuthService } from '../../services/authetication/auth.service';
import { filter } from 'rxjs';
import { DemoTourComponent } from "../demo-tour/demo-tour/demo-tour.component";
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass,
    RouterOutlet,
    ScrollingModule,
    ProSubscriptionComponent,
    DemoTourComponent
  ],
  templateUrl: './dashboard.component.html',
  animations: [dashboardGlobalAnimation]
})
export class DashboardComponent implements AfterViewInit, OnInit {
  isMenuOpen = true;
  animationState: any;

  constructor(protected dashboardService: DashboardService, private cdr: ChangeDetectorRef, public router: Router, public authService: AuthService, protected appService: AppService) {
  }

  ngOnInit(): void {
    const hasSavedSidebarPreference = typeof window !== 'undefined' && localStorage.getItem('isSidebarOpen') !== null;
    this.isMenuOpen = hasSavedSidebarPreference
      ? this.appService.getConfig().localSettings.isSidebarOpen
      : !this.isCompactViewport();
    this.appService.set('isSidebarOpen', this.isMenuOpen);
    this.redirectMobileDemoDashboardEntry(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.redirectMobileDemoDashboardEntry(event.urlAfterRedirects);
      });
  }

  private redirectMobileDemoDashboardEntry(url: string): void {
    if (!this.authService.getIsMobileDemo() || url.startsWith('/dashboard/strategic/all')) {
      return;
    }
    if (url === '/dashboard' || url === '/dashboard/home' || url.startsWith('/dashboard/profile')) {
      const queryParams = this.router.parseUrl(url).queryParams;
      this.router.navigate(['/dashboard/strategic/all'], { queryParams: { ...queryParams, page: 1 }, replaceUrl: true }).then();
    }
  }

  toggleNavigation() {
    this.isMenuOpen = !this.isMenuOpen;
    this.appService.set('isSidebarOpen', this.isMenuOpen);
  }

  isCompactViewport(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }

  prepareRoute(outlet: RouterOutlet) {
    this.animationState = outlet?.activatedRouteData?.['animation'] || null;
    return this.animationState;
  }

  isCtiGraph(): boolean {
    return this.router.url.includes('/dashboard/ctigraph') || this.router.url.includes('/dashboard/social-graph') || this.router.url.includes('/dashboard/social-intel') || this.router.url.includes('/dashboard/social-mapper');
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  hideSubscription() {
    this.dashboardService.showSubscription.set(false);
  }

  shouldShowDemoTour(): boolean {
    const { user } = this.appService.userSessionData();
    return this.authService.isAuthenticated() && !!user.username && !user.demo_tour && !(user.role == 'admin');
  }
}
