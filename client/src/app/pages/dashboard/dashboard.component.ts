import { AfterViewInit, ChangeDetectorRef, Component, Renderer2 } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { dashboardGlobalAnimation } from '../../shared/animations/dashboard.global.animations';
import { DashboardSidebarComponent } from '../../shared/partials/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardHeaderComponent } from '../../shared/partials/header/dashboard-header/dashboard-header.component';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
  ],
  templateUrl: './dashboard.component.html',
  animations: [dashboardGlobalAnimation]
})
export class DashboardComponent implements AfterViewInit {
  isMenuOpen = true;
  animationState: any;

  constructor(private cdr: ChangeDetectorRef, public router: Router, private renderer: Renderer2) {
  }
  ngOnInit(): void {
    this.renderer.addClass(document.body, 'dark-theme');
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
}
