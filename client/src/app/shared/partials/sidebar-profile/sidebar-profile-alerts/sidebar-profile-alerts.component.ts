import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../../services/core/app/app.service';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { Router, RouterOutlet } from '@angular/router';
import { HomeSearchComponent } from "../../../../pages/homepage/home-search/home-search.component";
import { AlertCategorySummary } from '../../../model/alert-notification/alert.notification.model';
import { AlertModel } from '../../../model/company-profile/company.profile.model';

@Component({
  selector: 'app-sidebar-profile-alerts',
  imports: [NgFor, CommonModule, FormsModule, HomeSearchComponent, RouterOutlet],
  templateUrl: './sidebar-profile-alerts.component.html',
})
export class SidebarProfileAlertsComponent implements OnInit {
  alertCategories: AlertCategorySummary[] = [];

  constructor(public appService: AppService, protected dashboardService: DashboardService, public router: Router) {
  }

  ngOnInit(): void {
    this.alertCategories = this.convertAlertsToCategories(this.appService.userProfile().alerts);
  }

  convertAlertsToCategories(alerts: AlertModel[]): AlertCategorySummary[] {
    const activeAlerts = alerts.filter(a => a.status !== 'ignore');
    const grouped: Record<string, AlertModel[]> = {};
    for (const alert of activeAlerts) {
      const key = alert.type || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alert);
    }
    const summaries: AlertCategorySummary[] = Object.entries(grouped).map(([category, group]) => {
      const uniqueIocs = Array.from(new Set(group.map(a => a.ioc_value)));
      const oldest = group
        .map(a => new Date(a.first_seen || new Date()))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      const tags = Array.from(
        new Set(
          group
            .flatMap(a => a.content_types || [])
            .filter(Boolean)
        )
      );
      const summary: AlertCategorySummary = {
        categoryName: category,
        risk: 'Medium',
        iocCount: uniqueIocs.length,
        detectedDate: oldest,
        tags
      };
      return summary;
    });

    return summaries;
  }
  entityFiltersCount(): number {
    const categories = this.appService.configData().localSettings.entityfilterCategories;
    return Object.values(categories).reduce((count, val) => {
      if (Array.isArray(val)) return count + val.length;
      return count + 1;
    }, 0);
  }
  editIocs() {
    this.router.navigate(['/dashboard/profile/ioc']);
  }
  openAlerts(type: string) {
    this.router.navigate([`/dashboard/profile/alerts/${type}`]);
  }
}
