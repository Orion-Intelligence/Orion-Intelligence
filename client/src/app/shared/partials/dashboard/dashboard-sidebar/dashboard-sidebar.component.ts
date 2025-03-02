import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NgOptimizedImage, NgClass, NgForOf, NgIf} from '@angular/common';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { ApiSubCategory, Category, GeneralSubCategory, LeakSubCategory } from '../../../../pages/dashboard/enums/pages';
import { AppService } from '../../../../services/core/app.service';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {filter} from 'rxjs';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, NgForOf, NgIf, RouterLink],
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent implements OnInit {
  @Output() menuClosed = new EventEmitter<void>();
  apiAllowed: boolean = false;

  apiCategories = Object.values(ApiSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(LeakSubCategory);
  category = Category;

  constructor(
    public dashboardService: DashboardService,
    private appService: AppService,
    private router: Router
  ) {
    this.appService.configData$.subscribe(data => {
      this.apiAllowed = !!(data && data.settings['api_allowed'] === '1');
    });
  }

  ngOnInit() {
    // Listen for URL changes and update section accordingly
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSelectedSectionFromURL();
      });

    // Initial check when component loads
    this.updateSelectedSectionFromURL();
  }

  updateSelectedSectionFromURL() {
    const currentURL = this.router.url;

    if (currentURL.includes('/dashboard/directory')) {
      this.dashboardService.tracker.setSection(Category.DIRECTORY);
    } else if (currentURL.includes('/dashboard/home')) {
      this.dashboardService.tracker.setSection(Category.HOMEPAGE);
    }
  }

  onSectionSelected(section: Category) {
    if (this.dashboardService.tracker.getSelectedSection() === section) {
      return;
    } else {
      this.dashboardService.tracker.setSection(section);

      let firstSubcategory: string | undefined;
      switch (section) {
        case Category.GENERAL_INTELLIGENCE:
          firstSubcategory = this.generalCategories[0];
          break;
        case Category.LEAKS:
          firstSubcategory = this.leakCategories[0];
          break;
        case Category.API:
          firstSubcategory = this.apiCategories[0];
          break;
      }

      if (firstSubcategory) {
        this.onOptionSelected(firstSubcategory, false);
      }
    }
  }

  onOptionSelected(option: string, close = true) {
    this.dashboardService.tracker.setOption(option);
    this.dashboardService.searchGeneralParamModel.pSearchParamType = option.toLowerCase();
    this.dashboardService.fetchGeneralSearchResults().subscribe();

    if (close) {
      this.closeMenu();
    }
  }

  closeMenu() {
    this.menuClosed.emit();
  }
}
