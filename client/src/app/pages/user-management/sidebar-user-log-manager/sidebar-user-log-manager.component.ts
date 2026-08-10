import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ApiService } from '../../../shared/services/api.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { DatePickerComponent } from '../../../shared/partials/filters/date-picker/date-picker.component';
import { SystemLogFile, SystemLogResponse } from './model/system-log.models';
import { UiDropdownComponent, UiDropdownOption } from '../../../shared/components/ui-dropdown/ui-dropdown.component';

@Component({
  selector: 'app-sidebar-user-log-manager',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ConfirmationPopupComponent, DatePickerComponent, UiDropdownComponent],
  templateUrl: './sidebar-user-log-manager.component.html',
  animations: [fadeInDashboardItem],
})
export class SidebarUserLogManagerComponent implements OnInit {
  readonly typeOptions: UiDropdownOption[] = [{ key: '', label: 'All' }, { key: 'INFO', label: 'INFO' }, { key: 'WARNING', label: 'WARNING' }, { key: 'ERROR', label: 'ERROR' }];
  logType = '';
  logDateRange = '';
  logDateFilters: Record<string, string | null> = { daterange: null };
  page = 1;
  limit = 100;
  loading = false;
  errorMessage = '';
  isFlushAllConfirmationOpen = false;
  response: SystemLogResponse = { entries: [], total: 0, page: 1, limit: 100, page_count: 0, available_dates: [], files: [] };

  constructor(private apiService: ApiService, private licenseService: LicenseService, private router: Router) {
  }

  ngOnInit(): void {
    if (!this.licenseService.isAdmin()) {
      this.router.navigate(['/dashboard/profile/account']).then();
      return;
    }
    this.loadLogs();
  }

  loadLogs(): void {
    let params = new HttpParams().set('page', this.page).set('limit', this.limit).set('_ts', String(Date.now()));
    if (this.logType) {
      params = params.set('log_type', this.logType);
    }
    if (this.logDateRange) {
      params = params.set('date_range', this.logDateRange);
    }

    this.loading = true;
    this.errorMessage = '';
    this.apiService.get<SystemLogResponse>('profile/system-logs', { params })
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: (response) => {
          this.response = response ?? this.emptyResponse();
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'Failed to load logs';
        }
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.loadLogs();
  }

  onLogTypeChange(value: string | null): void {
    this.logType = value ?? '';
    this.applyFilters();
  }

  onLogDateRangeChange(event: { key: string; value: string }): void {
    this.logDateRange = event.value;
    this.logDateFilters = { daterange: event.value || null };
    this.applyFilters();
  }

  nextPage(): void {
    if (this.page >= this.response.page_count) {
      return;
    }
    this.page += 1;
    this.loadLogs();
  }

  previousPage(): void {
    if (this.page <= 1) {
      return;
    }
    this.page -= 1;
    this.loadLogs();
  }

  deleteFile(file: SystemLogFile): void {
    if (!confirm(`Delete ${file.file} from ${file.date}?`)) {
      return;
    }
    this.apiService.delete<{ success: boolean }>(`profile/system-logs/${file.date}/${file.file}`).subscribe({
      next: () => {
        this.page = 1;
        this.loadLogs();
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail || 'Failed to delete log file';
      }
    });
  }

  flushLogs(): void {
    this.isFlushAllConfirmationOpen = true;
  }

  confirmFlushLogs(confirmed: boolean): void {
    this.isFlushAllConfirmationOpen = false;
    if (!confirmed) {
      return;
    }
    this.apiService.delete<{ success: boolean; deleted: number }>('profile/system-logs').subscribe({
      next: () => {
        this.logType = '';
        this.logDateRange = '';
        this.logDateFilters = { daterange: null };
        this.page = 1;
        this.response = this.emptyResponse();
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail || 'Failed to flush logs';
      }
    });
  }

  getTypeClass(type: string): string {
    if (type === 'ERROR') {
      return 'border-red-400/30 bg-red-500/10 text-red-300';
    }
    if (type === 'WARNING') {
      return 'border-amber-400/30 bg-amber-500/10 text-amber-300';
    }
    return 'border-sky-400/30 bg-sky-500/10 text-sky-300';
  }

  formatBytes(bytes: number): string {
    if (!bytes) {
      return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
  }

  private emptyResponse(): SystemLogResponse {
    return { entries: [], total: 0, page: 1, limit: this.limit, page_count: 0, available_dates: [], files: [] };
  }
}
