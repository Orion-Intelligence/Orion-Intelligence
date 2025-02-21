import { Component } from '@angular/core';
import {DashboardHeaderComponent} from '../../shared/partials/dashboard/dashboard-header/dashboard-header.component';
import {DashboardSideBarComponent} from '../../shared/partials/dashboard/dashboard-side-bar/dashboard-side-bar.component';
import {NgOptimizedImage} from '@angular/common';
@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardHeaderComponent,
    DashboardSideBarComponent,
    NgOptimizedImage
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {

}
