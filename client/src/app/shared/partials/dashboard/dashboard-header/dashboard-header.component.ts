import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {HeaderProfileDropdownComponent} from '../../header-profile-dropdown/header-profile-dropdown.component';
import {EventEmitter, Output} from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, HeaderProfileDropdownComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {

  constructor(public dashboardService: DashboardService) {}

  @Output() menuClicked = new EventEmitter<void>();

  toggleMenu() {
    this.menuClicked.emit();
  }
}
