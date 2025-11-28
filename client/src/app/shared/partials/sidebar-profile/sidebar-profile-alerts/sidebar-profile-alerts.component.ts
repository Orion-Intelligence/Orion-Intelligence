import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../../services/core/app/app.service';
import { DashboardService } from '../../../../services/dashboard/dashboard.service';
import { Router } from '@angular/router';
import { HomeSearchComponent } from "../../../../pages/homepage/home-search/home-search.component";
import { AlertCategorySummary } from '../../../model/alert-notification/alert.notification.model';
import { AlertModel } from '../../../model/company-profile/company.profile.model';
import { TooltipDirective } from '../../../directive/tooltip-directive.directive';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-sidebar-profile-alerts',
  imports: [NgFor, CommonModule, FormsModule, HomeSearchComponent, TooltipDirective],
  templateUrl: './sidebar-profile-alerts.component.html',
})
export class SidebarProfileAlertsComponent implements OnInit {
  alertCategories: AlertCategorySummary[] = [];
  criticalRisks: number = 0;
  highRisks: number = 0;
  mediumRisks: number = 0;
  lowRisks: number = 0;
  isLoading: boolean = false;
  constructor(public appService: AppService, protected dashboardService: DashboardService, public router: Router, private apiService: ApiService) {
  }

  ngOnInit(): void {
    this.alertCategories = this.convertAlertsToCategories(this.appService.userProfile().alerts);
    this.countRisk(this.appService.userProfile().alerts);
  }

  convertAlertsToCategories(alerts: AlertModel[]): AlertCategorySummary[] {
    const activeAlerts = alerts.filter(a => a.status !== 'ignore');
    const grouped: Record<string, AlertModel[]> = {};
    for (const alert of activeAlerts) {
      const key = alert.type || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alert);
    }
    const summaries: AlertCategorySummary[] = Object.entries(grouped).map(
      ([category, group]) => {
        const uniqueIocs = Array.from(new Set(group.map(a => a.ioc_value)));
        const oldest = group
          .map(a => new Date(a.first_seen || new Date()))
          .sort((a, b) => a.getTime() - b.getTime())[0];
        const tags = Array.from(
          new Set(group.flatMap(a => a.content_types || []).filter(Boolean))
        );
        return {
          categoryName: category,
          risk: this.getRiskLevel(category),
          iocCount: uniqueIocs.length,
          detectedDate: oldest,
          tags
        };
      }
    );
    const ALL_CATEGORIES = [
      "general",
      "defacement",
      "breach",
      "exploit",
      "social",
      "discussion",
      "stealerlogs",
      "feed",
      "advanced scanning",
      "playstore-scanning",
      "social-scanner",
      "email-breach",
      "advanced scanning",
      "repo scanning",
      "seo scanning"
    ];
    for (const cat of ALL_CATEGORIES) {
      if (!summaries.find(s => s.categoryName === cat)) {
        summaries.push({
          categoryName: cat,
          risk: this.getRiskLevel(cat),
          iocCount: 0,
          detectedDate: null,
          tags: []
        });
      }
    }

    return summaries;
  }
  countRisk(alerts: AlertModel[]) {

    this.criticalRisks = 0;
    this.highRisks = 0;
    this.mediumRisks = 0;
    this.lowRisks = 0;

    alerts.forEach(alert => {
      const risk = this.getRiskLevel(alert.type ?? '').toLowerCase();

      switch (risk) {
        case 'critical':
          this.criticalRisks++;
          break;
        case 'high':
          this.highRisks++;
          break;
        case 'medium':
          this.mediumRisks++;
          break;
        case 'low':
          this.lowRisks++;
          break;
        default:
          break;
      }
    });
  }


  getRiskLevel(type: string): string {
    const normalized = type.toLowerCase();
    switch (normalized) {
      case 'general':
      case 'seo scanning':
        return 'Low';

      case 'breach':
      case 'exploit':
      case 'feed':
      case 'playstore-scanning':
      case 'social-scanner':
      case 'email-breach':
      case 'stealerlogs':
        return 'Critical';

      case 'defacement':
      case 'advanced scanning':
      case 'repo scanning':
        return 'High';

      case 'social':
      case 'discussion':
        return 'Medium';

      default:
        return 'Unknown';
    }
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
    const cat = this.alertCategories.find(c => c.categoryName === type);
    if (!cat || cat.iocCount === 0) return;
    this.router.navigate([`/dashboard/profile/alerts/${type}`]);
  }
  scanIOCs() {
    this.isLoading = true;
    this.apiService.post<any>('profile/alert/scan', null).subscribe({
      next: (response) => {
        console.log('Alert Scan Job Completed:', response);
        const status = response?.status || 'unknown';
        const totalDuration = response?.total_duration_seconds;

        let successMessage = `IOC Scan completed.`;

        if (typeof totalDuration === 'number') {
          successMessage = `IOC Scan completed in ${totalDuration.toFixed(2)} seconds.`;
        }

        if (status === 'completed_with_errors') {
          successMessage += ' Some scans completed with errors.';
        }
        this.isLoading = false;
        alert(successMessage);
      },
      error: (err) => {
        console.error('Scan failed with an error:', err);
        alert(err?.error?.detail || 'IOC Scan failed to start or complete.');
        this.isLoading = false;
      },
    });
  }
}
