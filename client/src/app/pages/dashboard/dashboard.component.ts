import {Component} from '@angular/core';
import {NgClass, NgOptimizedImage, NgStyle} from '@angular/common';
import {DashboardSidebarComponent} from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import {DashboardHeaderComponent} from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import {
  DashboardSearchContentItemsComponent
} from '../../shared/partials/dashboard/dashboard-search-content-items/dashboard-search-content-items.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass,
    DashboardSearchContentItemsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  isMenuOpen = false;

  toggleSideNav() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  hideSideNav() {
    this.isMenuOpen = false;
  }

  selectedSection: string = 'general_intelligence';

  updateSelectedSection(section: string) {
    this.selectedSection = section;
  }
}
