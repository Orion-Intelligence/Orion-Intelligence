import {Component} from '@angular/core';
import {NgClass, NgOptimizedImage, NgStyle} from '@angular/common';
import {DashboardSidebarComponent} from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import {DashboardHeaderComponent} from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass
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
}
