import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { AlertNotification } from '../../model/alert-notification/alert.notification.model';
import { AlertModel } from '../../model/company-profile/node.model';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { overlayAnimation, sidebarAnimation } from '../../animations/sidebar.animations';
import { NgxPrintModule } from 'ngx-print';
import { AlertExportComponentComponent } from '../sidebar-user/sidebar-user-homepage/alert-export-component/alert-export-component.component';
@Component({
  selector: 'app-alert-notification',
  imports: [CommonModule, NgClass, NgxPrintModule, AlertExportComponentComponent],
  templateUrl: './alert-notification.component.html',
  animations: [sidebarAnimation, overlayAnimation],
})
export class AlertNotificationComponent implements OnChanges {
  private appendTimer: ReturnType<typeof setTimeout> | null = null;
  alertNotifications: AlertNotification[] = [];
  readonly batchSize: number = 20;
  readonly incrementalDelayMs: number = 120;
  readonly incrementalChunkSize: number = 1;
  currentPage: number = 0;
  totalCount: number = 0;
  hasMore: boolean = false;
  countsByType: Record<string, number> = {};
  isLoadingMore: boolean = false;
  isLoadMoreTriggered: boolean = false;
  isFetchingDetail: boolean = false;
  alertToShowReport: AlertModel | null = null;
  @ViewChild('printBtn') printBtn!: ElementRef<HTMLButtonElement>;
  @Input() isNotificationOpen!: boolean | null;
  @Output() closeNotification = new EventEmitter<void>();

  constructor(public appService: AppService, public apiService: ApiService, private messageNotificationService: MessageNotificationService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isNotificationOpen']) {
      const value = changes['isNotificationOpen'].currentValue;
      if (value === true && this.alertNotifications.length === 0) {
        this.fetchNotifications(true);
      }
    }
  }

  canLoadMore(): boolean {
    return this.hasMore || this.alertNotifications.length < this.totalCount;
  }

  private fetchNotifications(reset: boolean): void {
    if (this.isLoadingMore) {
      return;
    }

    this.clearAppendTimer();
    const nextPage = reset ? 1 : this.currentPage + 1;
    this.isLoadingMore = true;
    this.apiService.get<any>(`profile/alerts?paginate=true&compact=true&unseen_only=true&include_counts=true&page=${nextPage}&limit=${this.batchSize}`).subscribe({
      next: response => {
        const items = (response?.items || []).map((n: any) => ({
          ...n,
          lastSeen: n?.lastSeen ? new Date(n.lastSeen) : n?.lastSeen
        }));
        this.totalCount = response?.total || 0;
        this.currentPage = response?.page || nextPage;
        this.hasMore = !!response?.has_more;
        this.countsByType = response?.counts_by_type || {};
        this.isLoadingMore = false;
        this.isLoadMoreTriggered = false;
        this.appendNotificationsIncrementally(items, reset);
      },
      error: () => {
        this.isLoadingMore = false;
        this.isLoadMoreTriggered = false;
      }
    });
  }

  loadMoreNotifications(): void {
    if (!this.canLoadMore()) {
      return;
    }
    this.isLoadMoreTriggered = true;
    this.fetchNotifications(false);
  }

  private clearAppendTimer(): void {
    if (this.appendTimer) {
      clearTimeout(this.appendTimer);
      this.appendTimer = null;
    }
  }

  private appendNotificationsIncrementally(items: AlertNotification[], reset: boolean): void {
    this.alertNotifications = reset ? [] : [...this.alertNotifications];

    if (items.length === 0) {
      return;
    }

    let index = 0;
    const appendNext = () => {
      if (index >= items.length) {
        this.appendTimer = null;
        return;
      }

      const nextChunk = items.slice(index, index + this.incrementalChunkSize);
      this.alertNotifications = [...this.alertNotifications, ...nextChunk];
      index += this.incrementalChunkSize;
      this.appendTimer = setTimeout(() => {
        requestAnimationFrame(appendNext);
      }, this.incrementalDelayMs);
    };

    requestAnimationFrame(appendNext);
  }

  timeAgo(date: Date | string): string {
    if (!date) {
      return '';
    }
    const d = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) {
      return `${seconds} sec ago`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  seeDetails(_category: string, hash: string) {
    this.isFetchingDetail = true;
    this.apiService.get<any>('profile/alerts').subscribe({
      next: response => {
        this.appService.userSessionData().alerts = response;
        const selectedAlert = this.appService.userSessionData().alerts.find(a => a.data_hash === hash) || null;
        if (!selectedAlert) {
          this.isFetchingDetail = false;
          return;
        }

        this.alertToShowReport = selectedAlert;
        this.alertToShowReport.report_seen = true;
        this.apiService.post('alert/seen', [this.alertToShowReport]).subscribe({
          next: () => {
            this.fetchNotifications(true);
            this.isFetchingDetail = false;
            setTimeout(() => {
              this.printBtn?.nativeElement?.click();
            }, 0);
          },
          error: () => {
            this.isFetchingDetail = false;
          },
        });
      },
      error: () => {
        this.isFetchingDetail = false;
      },
    });
  }

  close() {
    this.closeNotification.emit();
  }

  clearAll() {
    const alerts = this.appService.userSessionData().alerts;
    if (!alerts) {
      return;
    }
    alerts.forEach(alert => {
      alert.report_seen = true;
    });
    this.apiService.post('alert/seen', alerts).subscribe({
      next: () => {
        this.getLatestAlerts();
        this.messageNotificationService.show("Clear all alerts successfully!");
        this.close();
      },
      error: (err) => {
        const mess = err?.error?.detail || 'Clear all alerts failed';
        this.messageNotificationService.show(mess);
      },
    });
  }

  getLatestAlerts() {
    this.apiService.get<any>('profile/alerts').subscribe({
      next: response => {
        this.appService.userSessionData().alerts = response;
        this.fetchNotifications(true);
      }
    });
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
  }
}
