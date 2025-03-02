import {Component} from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import {DashboardSidebarComponent} from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import {DashboardHeaderComponent} from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import {DashboardSearchContentItemsComponent} from '../../shared/partials/dashboard/dashboard-search-content-items/dashboard-search-content-items.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass,
    DashboardSearchContentItemsComponent,
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  isMenuOpen = false;

  constructor() {
  }

  toggleSideNav() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  hideSideNav() {
    this.isMenuOpen = false;
  }
  vars = {
    mSearchCallbackCurrentPageNumber: 1,
  };

}
