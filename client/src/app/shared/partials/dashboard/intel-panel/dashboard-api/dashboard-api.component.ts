import { Component } from '@angular/core';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {FormsModule} from '@angular/forms';
import {DashboardEmailApiComponent} from './dashboard-email-api/dashboard-email-api.component';
import {NgIf} from '@angular/common';
import {ApiSubCategory, Category} from '../../../../../pages/dashboard/enums/pages';

@Component({
  selector: 'app-dashboard-api',
  imports: [
    FormsModule,
    DashboardEmailApiComponent,
    NgIf
  ],
  templateUrl: './dashboard-api.component.html',
  styleUrl: './dashboard-api.component.css'
})
export class DashboardApiComponent {
  constructor(public dashboardService: DashboardService) {
  }

  protected readonly category = Category;
  protected readonly ApiSubCategory = ApiSubCategory;
}
