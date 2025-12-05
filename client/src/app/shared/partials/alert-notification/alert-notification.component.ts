import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { filterAnimation } from '../../animations/filter.animation';
import { AppService } from '../../../services/core/app/app.service';
import { Router } from '@angular/router';
import { AlertNotification } from '../../model/alert-notification/alert.notification.model';
import { AlertModel } from '../../model/company-profile/company.profile.model';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-alert-notification',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './alert-notification.component.html',
  animations: [filterAnimation],
})
export class AlertNotificationComponent implements OnChanges {
  @Input() isNotificationOpen!: boolean | null;

  @Output() closeNotification = new EventEmitter<void>();
  alertNotifications: AlertNotification[] = [];

  constructor(public appService: AppService, public router: Router, public apiService: ApiService, private messageNotificationService: MessageNotificationService,
    protected licenseService: LicenseService
  ) {
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isNotificationOpen']) {
      const value = changes['isNotificationOpen'].currentValue;
      if (value === true) {
        this.alertNotifications = this.convertToAlertNotifications(this.appService.userProfile().alerts);
      }
    }
  }

  convertToAlertNotifications(alerts: AlertModel[]): AlertNotification[] {
    return alerts
      .filter(alert => alert.type && alert.ioc_value && alert.last_seen && alert.data_hash &&
        !alert.report_seen)
      .map(alert => {
        const notification: AlertNotification = {
          categoryName: alert.type!,
          risk: this.getRiskLevel(alert.type!),
          iocNames: [alert.ioc_type!],
          subCategory: alert.content_types?.[0]!,
          lastSeen: new Date(alert.last_seen!),
          hash: alert.data_hash!
        };

        return notification;
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
  timeAgo(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  seeDetails(category: string, hash: string) {
    this.close();
    this.licenseService.loadLicenses().subscribe(licenses => {
      const hasEnterprise = licenses.includes('enterprise');

      if (hasEnterprise) {
        const alerts = this.appService.userProfile().alerts;
        const _alert = alerts.find(a => a.data_hash === hash);
        if (_alert?.type) {
          const value = _alert.ioc_value || '-';
          let scanType: string;
          let route: string = '/dashboard/scanner/basic-scan';

          switch (_alert.type.toLowerCase()) {
            case "advance scanning":
              scanType = "advance";
              route = "/dashboard/scanner/port-scan";
              this.router.navigate([route], {
                queryParams: { page: 1, domain: encodeURIComponent(value), canType: scanType }
              });
              break;

            case "seo scanning":
              scanType = "seo";
              route = "/dashboard/scanner/seo-scan";
              this.router.navigate([route], {
                queryParams: { page: 1, domain: encodeURIComponent(value), canType: scanType }
              });
              break;

            case "repo scanning":
              scanType = "repo";
              route = "/dashboard/scanner/repository-scan";
              this.router.navigate([route], {
                queryParams: { page: 1, domain: encodeURIComponent(value), canType: scanType }
              });
              break;
            case "email-breach":
              const _username = value.split('@')[0];
              scanType = "repo";
              route = "/dashboard/api/email-breach";
              this.router.navigate([route], {
                queryParams: { username: _username, email: value }
              });
              break;
            case "playstore-scanning":
              scanType = "repo";
              route = "/dashboard/api/playstore-scanner";
              this.router.navigate([route], {
                queryParams: { playstore: value }
              });
              break;
            case "social-scanner":
              scanType = "repo";
              route = "/dashboard/api/social-scanner";
              this.router.navigate([route], {
                queryParams: { username: value }
              });
              break;
            case "stealerlogs":
              route = "/dashboard/stealerlogs/credential";
              const queryParams: any = {
                q: "",
                page: 1,
                category: "credential",
                fullsearch: true,
                matchtype: "or",
                must: false
              };
              if (this.isDomain(value)) {
                queryParams.domain = value;
              } else {
                queryParams.user = value;
              }
              this.router.navigate([route], { queryParams });
              break;
            default:
              this.router.navigate([`/dashboard/${category}/all/${hash}`]);
              break;
          }
        }
        if (_alert) {
          _alert.report_seen = true;
        }
        this.apiService.post('alert/seen', [_alert]).subscribe({
          next: () => {
          },
          error: (err) => {
            console.error(err);
            alert(err?.error?.detail || 'Update failed');
          },
        });
      } else {
        this.messageNotificationService.show("Please purchase enterprise license to view reports")
      }
    });
  }

  close() {
    this.closeNotification.emit();
  }
  clearAll() {
    const alerts = this.appService.userProfile().alerts;

    if (!alerts) return;

    alerts.forEach(alert => {
      alert.report_seen = true;
    });

    this.apiService.post('alert/seen', alerts).subscribe({
      next: () => {
        this.getLatestAlerts()
        this.messageNotificationService.show("Clear all alerts successfully!")
        this.close();
      },
      error: (err) => {
        const mess = err?.error?.detail || 'Clear all alerts failed'
        this.messageNotificationService.show(mess)
      },
    });



  }
  getLatestAlerts() {
    this.apiService.get<any>('profile/alerts').subscribe({
      next: response => {
        this.appService.userProfile().alerts = response
        this.alertNotifications = this.convertToAlertNotifications(this.appService.userProfile().alerts);
      }
    })
  }
  isDomain(value: string): boolean {
    if (!value) return false;
    value = value.replace(/https?:\/\//, "").replace(/^www\./, "");

    const domainRegex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*$/;

    return domainRegex.test(value);
  }
}
