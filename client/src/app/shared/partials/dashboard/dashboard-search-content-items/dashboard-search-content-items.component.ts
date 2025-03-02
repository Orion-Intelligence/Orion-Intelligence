import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { Subscription } from 'rxjs';
import {DashboardApiComponent} from '../intel-panel/dashboard-api/dashboard-api.component';
import {DashboardLeakComponent} from '../intel-panel/dashboard-leak/dashboard-leak.component';
import {DashboardGeneral} from '../intel-panel/dashboard-general/dashboard-general.component';
import {Category} from '../../../../pages/dashboard/enums/pages';
import {HomepageComponent} from '../../../../pages/homepage/homepage.component';
import {DirectoryComponent} from '../../../../pages/directory/directory.component';

@Component({
  selector: 'app-dashboard-search-content-items',
  standalone: true,
  imports: [
    CommonModule,
    DashboardApiComponent,
    DashboardLeakComponent,
    DashboardGeneral,
    HomepageComponent,
    DirectoryComponent
  ],
  templateUrl: './dashboard-search-content-items.component.html',
})
export class DashboardSearchContentItemsComponent implements OnInit, OnDestroy {
  private subscription!: Subscription;

  constructor(public dashboardService: DashboardService) {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  protected readonly Category = Category;
}
