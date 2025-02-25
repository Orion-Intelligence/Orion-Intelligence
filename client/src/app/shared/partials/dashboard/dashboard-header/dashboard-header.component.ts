import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {HeaderProfileDropdownComponent} from '../../header-profile-dropdown/header-profile-dropdown.component';
import {EventEmitter, Output} from '@angular/core';
import {Observable} from 'rxjs';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, HeaderProfileDropdownComponent, AsyncPipe],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  searchQuery$: Observable<string>;
  currentPage$: Observable<string>;

  constructor(public dashboardService: DashboardService) {
    this.currentPage$ = dashboardService.currentPage$;
    this.searchQuery$ = dashboardService.searchQuery$;
  }

  @Output() menuClicked = new EventEmitter<void>();

  toggleMenu() {
    this.menuClicked.emit();
  }

  onSearchQueryUpdate(value: string) {
    this.dashboardService.setSearchQuery(value);
  }
}
