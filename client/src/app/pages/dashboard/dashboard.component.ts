import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {DashboardSidebarComponent} from '../../shared/partials/dashboard/dashboard-sidebar/dashboard-sidebar.component';

@Component({
  selector: 'app-directory',
  imports: [
    DashboardSidebarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

}
