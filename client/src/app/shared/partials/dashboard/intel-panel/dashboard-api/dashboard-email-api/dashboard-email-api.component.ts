import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgOptimizedImage} from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-email-api',
  imports: [
    FormsModule,
    NgForOf,
    NgOptimizedImage,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard-email-api.component.html',
  styleUrl: './dashboard-email-api.component.css'
})
export class DashboardEmailApiComponent {
  username: string = '';
  email: string = '';

  constructor(public dashboardService: DashboardService) {
  }

  onSearchSubmit($event: SubmitEvent) {

  }
}
