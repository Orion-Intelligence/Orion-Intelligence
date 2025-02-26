import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSearchGeneralIntelligenceComponent } from '../dashboard-search-general-intelligence/dashboard-search-general-intelligence.component';
import { Pages } from '../../../../constants/pages';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-search-content-items',
  standalone: true,
  imports: [
    CommonModule,
    DashboardSearchGeneralIntelligenceComponent
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
