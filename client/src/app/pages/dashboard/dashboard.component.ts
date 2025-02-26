import {Component, OnInit} from '@angular/core';
import {NgClass, NgIf} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {DashboardSidebarComponent} from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';
import {DashboardHeaderComponent} from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import {
  DashboardSearchContentItemsComponent
} from '../../shared/partials/dashboard/dashboard-search-content-items/dashboard-search-content-items.component';
import {DashboardService} from '../../services/dashboard/dashboard.service';
import {Pages} from '../../constants/pages';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DashboardSidebarComponent,
    DashboardHeaderComponent,
    NgClass,
    DashboardSearchContentItemsComponent,
    NgIf
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isMenuOpen = false;
  isLoaded = false

  constructor(private router: Router, private route: ActivatedRoute, private dashboardService: DashboardService) {
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const searchQuery = params['q'];
      this.dashboardService.searchGeneralParamModel.q = searchQuery
      if (!searchQuery) {
        this.router.navigate(['/']).then();
      } else {
        this.isLoaded = true
        this.dashboardService.setSearchQuery(searchQuery);
        this.dashboardService.setCurrentPage(Pages.GENERAL_INTELLIGENCE);
      }
    });
  }

  toggleSideNav() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  hideSideNav() {
    this.isMenuOpen = false;
  }
}
