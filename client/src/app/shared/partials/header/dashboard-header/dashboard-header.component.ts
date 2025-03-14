import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfileComponent } from '../../profile/profile.component';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { NavigationEnd, Router, UrlTree } from '@angular/router';
import { filter } from 'rxjs';
import { NgForOf, NgIf, NgOptimizedImage, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [FormsModule, ProfileComponent, NgIf, NgForOf, TitleCasePipe, NgOptimizedImage],
  templateUrl: './dashboard-header.component.html',
})
export class DashboardHeaderComponent implements OnInit {
  breadcrumb: { path: string; label: string }[] = [];

  constructor(public dashboardService: DashboardService, private router: Router) {}

  ngOnInit() {
    // Initialize breadcrumb with the current URL
    this.updateBreadcrumb(this.router.url);

    // Subscribe to navigation events for updates
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateBreadcrumb(event.urlAfterRedirects);
      });
  }

  updateBreadcrumb(url: string) {
    const urlTree: UrlTree = this.router.parseUrl(url);
    const segments = urlTree.root.children['primary']?.segments.map((segment) => segment.path) || [];

    // Update breadcrumb
    this.breadcrumb = segments.length > 1
      ? segments.slice(1).map((segment) => ({ path: segment, label: segment }))
      : segments.map((segment) => ({ path: segment, label: segment }));
  }

  goBack() {
    if (this.breadcrumb.length > 2) { // Only allow back if breadcrumb has more than 2 items
      // Get the current URL’s query parameters
      const currentUrlTree: UrlTree = this.router.parseUrl(this.router.url);
      const queryParams = currentUrlTree.queryParams;

      // Construct the path to the second-to-last breadcrumb
      const secondLastPath = '/dashboard/' + this.breadcrumb.slice(0, -1).map((crumb) => crumb.path).join('/');
      const secondLastUrlTree = this.router.createUrlTree([secondLastPath], { queryParams });
      const secondLastUrl = this.router.serializeUrl(secondLastUrlTree);

      // Navigate to the second-to-last breadcrumb
      this.router.navigateByUrl(secondLastUrl);
    }
    // If breadcrumb length <= 2, do nothing (button is disabled in HTML)
  }

  navigateToCrumb(index: number) {
    if (this.breadcrumb.length > 2) { // Only allow breadcrumb click if length > 2
      // Get the current URL’s query parameters
      const currentUrlTree: UrlTree = this.router.parseUrl(this.router.url);
      const queryParams = currentUrlTree.queryParams;

      // Construct the full path up to the clicked breadcrumb
      const basePath = '/dashboard/' + this.breadcrumb.slice(0, index + 1).map((crumb) => crumb.path).join('/');
      const fullPathTree: UrlTree = this.router.createUrlTree([basePath], { queryParams });
      const fullPath = this.router.serializeUrl(fullPathTree);

      // Navigate to the clicked breadcrumb’s path
      this.router.navigateByUrl(fullPath);
    }
    // If length <= 2, do nothing (click is disabled in HTML)
  }
}
