import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {ProfileComponent} from '../../profile/profile.component';
import {EventEmitter, Output} from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, ProfileComponent],
  templateUrl: './dashboard-header.component.html'
})
export class DashboardHeaderComponent {

  constructor(public dashboardService: DashboardService) {}

  @Output() menuClicked = new EventEmitter<void>();

  toggleMenu() {
    this.menuClicked.emit();
  }
}
