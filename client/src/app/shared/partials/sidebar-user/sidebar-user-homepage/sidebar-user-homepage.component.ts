import {Component, effect, OnInit, signal} from '@angular/core';
import {CommonModule, NgFor, NgOptimizedImage} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AppService} from '../../../../services/core/app/app.service';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {Router} from '@angular/router';
import {HomeSearchComponent} from "../../../../pages/homepage/home-search/home-search.component";
import {AlertCategorySummary} from '../../../model/alert-notification/alert.notification.model';
import {AlertModel} from '../../../model/company-profile/node.model';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';
import {ApiService} from '../../../services/api.service';
import {MessageNotificationService} from '../../../../services/message_notification/message-notification.service';
import {ConfirmationPopupComponent} from "../../confirmation-popup/confirmation-popup.component";
import {AlertScanLoadingComponent} from "./alert-scan-loading/alert-scan-loading.component";
import {AlertService} from '../../../../services/alerts/alerts.service';
import {AuthService} from '../../../../services/authetication/auth.service';
import {NgbCarouselModule} from "@ng-bootstrap/ng-bootstrap";
import {HomepageComponent} from "../../../../pages/homepage/homepage.component";
import {HomeInsightComponent} from "../../../../pages/homepage/home-insight/home-insight.component";
import {LicenseService} from '../../../../services/licenses/licenses.service';
import {overlayAnimation} from '../../../animations/popup.animations';
import {MessagePopupComponent} from "../../message-popup/message-popup.component";

@Component({
  selector: 'app-sidebar-user-homepage',
  imports: [NgFor, CommonModule, FormsModule, HomeSearchComponent, TooltipDirective, ConfirmationPopupComponent, AlertScanLoadingComponent, NgbCarouselModule, HomepageComponent, HomeInsightComponent, NgOptimizedImage, MessagePopupComponent],
  templateUrl: './sidebar-user-homepage.component.html',
  animations: [overlayAnimation],
})
export class SidebarUserHomepageComponent implements OnInit {
  alertCategories: AlertCategorySummary[] = [];
  criticalRisks: number = 0;
  highRisks: number = 0;
  mediumRisks: number = 0;
  lowRisks: number = 0;
  isConfirmationOpen = signal(false);
  noIocPopup = signal(false);
  constructor(public appService: AppService, protected alertService: AlertService, protected dashboardService: DashboardService, public router: Router, private apiService: ApiService,
    private messageNotificationService: MessageNotificationService, protected authService: AuthService, protected licenseService: LicenseService) {
    effect(() => {
      if (!this.alertService.isAlertScanLoading()) {
        this.initializeData();
      }
    });
  }

  ngOnInit(): void {
    if (this.isMember() && !this.licenseService.getLicenses().includes('free')) {
      this.checkScanProgress();
      this.initializeData()

    }
  }
  initializeData() {
    this.alertCategories = this.convertAlertsToCategories(this.appService.userSessionData().alerts);
    this.countRiskCount(this.appService.userSessionData().alerts);
  }
  checkScanProgress() {
    const stream = this.alertService.autoCheckScanStatus();
    if (!stream) {
      return;
    }
    stream.subscribe(res => {
      this.alertService.isAlertScanLoading.set(res.scan_running);
    });
  }
  isAdmin(): boolean {
    return this.appService.userSessionData().user.role === 'admin';
  }
  isMember(): boolean {
    return this.appService.userSessionData().user.role === 'member';
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
  countRiskCount(alerts: AlertModel[]) {

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
    const categories = this.appService.tenantData().iocs;
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
    const iocs = this.appService.tenantData().iocs;
    if (!iocs || iocs.length === 0) {
      this.noIocPopup.set(true);
      return;
    }
    this.alertService.scanIOCs();
  }
  clossNoIocPopup() {
    this.noIocPopup.set(false);
  }
  flushAll() {
    this.isConfirmationOpen.set(true);
  }
  flushAllConfirmation(value: boolean) {
    this.isConfirmationOpen.set(false);
    if (value) {
      this.alertService.isAlertScanLoading.set(true)
      this.apiService.post('profile/alerts/delete/all', null).subscribe({
        next: () => {
          this.appService.userSessionData().alerts = [];
          this.ngOnInit();
          this.alertService.isAlertScanLoading.set(false)
        },
        error: (err) => {
          this.alertService.isAlertScanLoading.set(false)
          this.messageNotificationService.show(err?.error?.detail || 'Failed to delete')
        },
      });
    }
  }
}
