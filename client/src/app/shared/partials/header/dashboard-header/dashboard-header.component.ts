import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ProfileComponent} from '../../profile/profile.component';
import {NavigationEnd, Router, UrlTree} from '@angular/router';
import {filter} from 'rxjs';
import {NgForOf, NgIf, NgOptimizedImage, TitleCasePipe} from '@angular/common';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [FormsModule, ProfileComponent, NgIf, NgForOf, TitleCasePipe, NgOptimizedImage, TooltipDirective],
  templateUrl: './dashboard-header.component.html',
})
export class DashboardHeaderComponent implements OnInit {
  breadcrumb: { path: string; label: string }[] = [];

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.updateBreadcrumb(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateBreadcrumb(event.urlAfterRedirects);
      });
  }

  updateBreadcrumb(url: string) {
    const urlTree: UrlTree = this.router.parseUrl(url);
    const segments = urlTree.root.children['primary']?.segments.map((segment) => segment.path) ?? [];

    this.breadcrumb = segments.length > 1
      ? segments.slice(1).map((segment) => ({path: segment, label: segment}))
      : segments.map((segment) => ({path: segment, label: segment}));
  }

  goBack() {
    const currentUrlTree: UrlTree = this.router.parseUrl(this.router.url);
    const queryParams = currentUrlTree.queryParams;

    if (this.router.url.includes('/consolidated')) {
      this.router.navigate(['/dashboard/consolidated/all'], {queryParams}).then();
      return;
    }

    if (this.breadcrumb.length > 2) {
      const secondLastPath = '/dashboard/' + this.breadcrumb.slice(0, -1).map(crumb => crumb.path).join('/');
      const secondLastUrlTree = this.router.createUrlTree([secondLastPath], {queryParams});
      const secondLastUrl = this.router.serializeUrl(secondLastUrlTree);
      this.router.navigateByUrl(secondLastUrl).then();
    }
  }

  navigateToCrumb(index: number) {
    if (this.breadcrumb.length > 2) {
      const currentUrlTree: UrlTree = this.router.parseUrl(this.router.url);
      const queryParams = currentUrlTree.queryParams;

      const basePath = '/dashboard/' + this.breadcrumb.slice(0, index + 1).map((crumb) => crumb.path).join('/');
      const fullPathTree: UrlTree = this.router.createUrlTree([basePath], {queryParams});
      const fullPath = this.router.serializeUrl(fullPathTree);

      this.router.navigateByUrl(fullPath).then();
    }
  }
}
