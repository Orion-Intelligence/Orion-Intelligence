import { Component, EventEmitter, Output } from '@angular/core';
import { NgOptimizedImage, NgClass, NgForOf } from '@angular/common';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import {ApiSubCategory, Category, GeneralSubCategory, LeakSubCategory} from '../../../../pages/dashboard/enums/pages';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass,
    NgForOf
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent {
  @Output() menuClosed = new EventEmitter<void>();

  apiCategories = Object.values(ApiSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(LeakSubCategory);
  category = Category;

  constructor(public dashboardService: DashboardService) {}

  onSectionSelected(section: Category) {
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
      this.onOptionSelected(firstSubcategory);
    }
  }

  onOptionSelected(option: string) {
    this.dashboardService.tracker.setOption(option);
  }

  closeMenu() {
    this.menuClosed.emit();
  }

}
