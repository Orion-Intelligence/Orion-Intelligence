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
  templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent implements OnInit {
  breadcrumb: string[] = [];

  constructor(public dashboardService: DashboardService, private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumb();
    });

    this.updateBreadcrumb();
  }

  updateBreadcrumb() {
    const urlTree: UrlTree = this.router.parseUrl(this.router.url);
    const segments = urlTree.root.children['primary']?.segments.map(segment => segment.path) || [];
    this.breadcrumb = segments.length > 1 ? segments.slice(1) : segments;
  }
}
