import { Component, OnChanges, SimpleChanges, input, output } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AppService } from '../../../services/core/app/app.service';
import { AlertNotification } from '../../model/alert-notification/alert.notification.model';
import { AlertModel } from '../../model/company-profile/node.model';
import { ApiService } from '../../services/api.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { overlayAnimation, sidebarAnimation } from '../../animations/sidebar.animations';
import { ExportChoiceModalComponent } from '../export-choice-modal/export-choice-modal.component';
import { ExportChoiceOption } from '../../model/report/export-choice.model';
import { AlertExportService } from '../../services/export/alert-export.service';
@Component({
  selector: 'app-alert-notification',
  imports: [CommonModule, NgClass, ExportChoiceModalComponent],
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
  isExportChoiceOpen: boolean = false;
  readonly alertExportOptions: ExportChoiceOption[] = [{ value: 'report', title: 'Export Report (PDF)', description: 'Generate PDF export for selected alert.', testId: 'notification-alert-export-option-report' }];
  readonly isNotificationOpen = input.required<boolean | null>();
  readonly closeNotification = output<undefined>();

  constructor(public appService: AppService, public apiService: ApiService, private messageNotificationService: MessageNotificationService, private alertExportService: AlertExportService) {
  }

  private decrementUnseenSummary(by: number = 1): void {
    const summary = this.appService.userSessionData().alert_summary;
    if (!summary) {
      return;
    }
    this.appService.userSessionData().alert_summary = {
      ...summary,
      unseen_total: Math.max(0, Number(summary.unseen_total || 0) - by)
    };
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

  private fetchNotifications(reset: boolean, attempt: number = 1): void {
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
        if (reset && nextPage === 1 && items.length === 0 && attempt < 3) {
          this.isLoadingMore = false;
          this.isLoadMoreTriggered = false;
          setTimeout(() => {
            this.fetchNotifications(true, attempt + 1);
          }, 800);
          return;
        }
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
        const alerts: AlertModel[] = Array.isArray(response)
          ? response
          : (Array.isArray(response?.items) ? response.items : []);
        this.appService.userSessionData().alerts = alerts;
        const selectedAlert = alerts.find(a => a.data_hash === hash) || null;
        if (!selectedAlert) {
          this.isFetchingDetail = false;
          return;
        }

        this.alertToShowReport = selectedAlert;
        this.alertToShowReport.report_seen = true;
        this.apiService.post('alert/seen', [this.alertToShowReport]).subscribe({
          next: () => {
            this.decrementUnseenSummary(1);
            this.fetchNotifications(true);
            this.isFetchingDetail = false;
            this.openExportChoice();
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

  openExportChoice(): void {
    this.isExportChoiceOpen = true;
  }

  closeExportChoice(): void {
    this.isExportChoiceOpen = false;
  }

  exportSelectedAlert(_type: string): void {
    if (!this.alertToShowReport) {
      this.closeExportChoice();
      return;
    }
    this.alertExportService.exportPdf([this.alertToShowReport], 'Brand Alerts');
    this.closeExportChoice();
  }

  close() {
    // TODO: The 'emit' function requires a mandatory void argument
    this.closeNotification.emit(undefined);
  }

  clearAll() {
    this.apiService.get<any>('profile/alerts').subscribe({
      next: (alerts) => {
        const allAlerts: AlertModel[] = Array.isArray(alerts)
          ? alerts
          : (Array.isArray(alerts?.items) ? alerts.items : []);
        if (allAlerts.length === 0) {
          this.fetchNotifications(true);
          return;
        }
        allAlerts.forEach(alert => {
          alert.report_seen = true;
        });
        this.apiService.post('alert/seen', allAlerts).subscribe({
          next: () => {
            const summary = this.appService.userSessionData().alert_summary;
            if (summary) {
              this.appService.userSessionData().alert_summary = {
                ...summary,
                unseen_total: 0
              };
            }
            this.getLatestAlerts();
            this.messageNotificationService.show("Clear all alerts successfully!", 'success');
            this.close();
          },
          error: (err) => {
            const mess = err?.error?.detail || 'Clear all alerts failed';
            this.messageNotificationService.show(mess);
          },
        });
      }
    });
  }

  getLatestAlerts() {
    this.apiService.get<any>('profile/alerts').subscribe({
      next: response => {
        this.appService.userSessionData().alerts = Array.isArray(response)
          ? response
          : (Array.isArray(response?.items) ? response.items : []);
        this.fetchNotifications(true);
      }
    });
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
  }
}
