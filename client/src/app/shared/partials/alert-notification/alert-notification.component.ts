import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { filterAnimation } from '../../animations/filter.animation';
import { AppService } from '../../../services/core/app/app.service';
import { Router } from '@angular/router';
import { AlertNotification } from '../../model/alert-notification/alert.notification.model';
import { AlertModel } from '../../model/company-profile/company.profile.model';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';


@Component({
  selector: 'app-alert-notification',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './alert-notification.component.html',
  animations: [filterAnimation],
})
export class AlertNotificationComponent implements OnInit {
  @Input() isNotificationOpen!: boolean | null;

  @Output() closeNotification = new EventEmitter<void>();
  alertNotifications: AlertNotification[] = [];

  constructor(public appService: AppService, public router: Router, public apiService: ApiService, private messageNotificationService: MessageNotificationService) {
  }

  ngOnInit(): void {
    this.alertNotifications = this.convertToAlertNotifications(this.appService.userProfile().alerts);
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
        return 'Low';

      case 'breach':
      case 'exploit':
        return 'Critical';

      case 'defacement':
        return 'High';

      case 'social':
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
    this.router.navigate([`/dashboard/${category}/all/${hash}`]);
    const alerts = this.appService.userProfile().alerts;
    const alert = alerts.find(a => a.data_hash === hash);

    if (alert) {
      alert.report_seen = true;
    }
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
}
