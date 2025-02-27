import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardGeneral } from '../intel-panel/dashboard-general/dashboard-general.component';
import { Pages } from '../../../../constants/pages';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { Subscription } from 'rxjs';
import {DashboardApiComponent} from '../intel-panel/dashboard-api/dashboard-api.component';
import {DashboardMonitorComponent} from '../intel-panel/dashboard-monitor/dashboard-monitor.component';
import {DashboardLeakComponent} from '../intel-panel/dashboard-leak/dashboard-leak.component';

@Component({
  selector: 'app-dashboard-search-content-items',
  standalone: true,
  imports: [
    CommonModule,
    DashboardGeneral,
    DashboardApiComponent,
    DashboardMonitorComponent,
    DashboardLeakComponent
  ],
  templateUrl: './dashboard-search-content-items.component.html',
  styleUrl: './dashboard-search-content-items.component.css'
})
export class DashboardSearchContentItemsComponent implements OnInit, OnDestroy {
  protected readonly Pages = Pages;
  currentPage: string = '';
  private subscription!: Subscription;

  constructor(public dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.subscription = this.dashboardService.currentPage$.subscribe(page => {
      this.currentPage = page;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
