import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, Input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { ApiService } from '../../../shared/services/api.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';
import { formatRelativeAge, parseBackupTimestamp } from '../../../shared/utils/backup-age.util';
import type { BackupJob, BackupRecord } from './model/backup-restore.model';

@Component({
  selector: 'app-backup-restore',
  standalone: true,
  imports: [CommonModule, ConfirmationPopupComponent, TranslatePipe],
  animations: [fadeInDashboardItem],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './backup-restore.component.html',
})
export class BackupRestoreComponent implements OnInit, OnDestroy {
  private jobTimer: ReturnType<typeof setTimeout> | null = null;
  private jobWasRunning = false;

  backups: BackupRecord[] = [];
  isLoading = true;
  backupToDelete: BackupRecord | null = null;
  backupToRestore: BackupRecord | null = null;
  fileToImport: File | null = null;
  importConfirmationMessage = '';
  isInstantConfirmationOpen = signal<boolean>(false);
  isDeleteConfirmationOpen = signal<boolean>(false);
  isRestoreConfirmationOpen = signal<boolean>(false);
  isImportConfirmationOpen = signal<boolean>(false);
  isRestoring = false;
  isCreating = false;
  isImporting = false;
  job: BackupJob | null = null;
  readonly MAX_BACKUPS = 2;
  instantConfirmationMessage = 'Start instant backup now?';
  downloadingId: string | null = null;

  @Input() scope: 'admin' | 'tenant' = 'admin';

  get isTenantScope(): boolean {
    return this.scope === 'tenant';
  }

  private get basePath(): string {
    return this.isTenantScope ? 'tenant/backups' : 'admin/backups';
  }

  constructor(private apiService: ApiService, private messageNotificationService: MessageNotificationService, private translationService: TranslationService, private route: ActivatedRoute, private licenseService: LicenseService, private http: HttpClient) {
  }

  ngOnInit(): void {
    const routeScope = this.route.snapshot.data.scope;
    if (routeScope === 'tenant' || routeScope === 'admin') {
      this.scope = routeScope;
    }
    else if (!this.licenseService.isAdmin()) {
      this.scope = 'tenant';
    }
    this.loadBackups();
    this.pollJob();
  }

  ngOnDestroy(): void {
    if (this.jobTimer !== null) {
      clearTimeout(this.jobTimer);
    }
  }

  private schedulePoll(delay: number): void {
    if (this.jobTimer !== null) {
      clearTimeout(this.jobTimer);
    }
    this.jobTimer = setTimeout(() => {
      this.jobTimer = null;
      this.pollJob();
    }, delay);
  }

  private applyJob(job: BackupJob): void {
    this.job = job;
    this.isCreating = job.status === 'running' && job.operation === 'backup';
    this.isRestoring = job.status === 'running' && job.operation === 'restore';
    if (job.status === 'running') {
      this.jobWasRunning = true;
    }
  }

  private pollJob(): void {
    this.apiService.get<BackupJob>(`${this.basePath}/status`).subscribe({
      next: (job) => {
        this.applyJob(job);
        if (job.status === 'running') {
          this.schedulePoll(2000);
          return;
        }
        if (this.jobWasRunning) {
          this.jobWasRunning = false;
          this.backupToRestore = null;
          this.messageNotificationService.show(this.translationService.translate(job.message), job.status === 'done' ? 'success' : 'fail');
          this.loadBackups();
        }
      },
      error: () => {
        this.schedulePoll(5000);
      }
    });
  }

  loadBackups(): void {
    this.isLoading = true;
    this.apiService.get<BackupRecord[]>(this.basePath)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (backups) => this.backups = backups || [],
        error: () => {
          this.messageNotificationService.show(this.translationService.translate('Failed to load backups'));
        }
      });
  }

  openInstantConfirmation(): void {
    this.instantConfirmationMessage = this.backups.length >= this.MAX_BACKUPS
      ? `You already have ${this.MAX_BACKUPS} backups. The oldest backup will be deleted if you proceed.`
      : 'Start instant backup now?';
    this.isInstantConfirmationOpen.set(true);
  }

  confirmInstantBackup(value: boolean): void {
    this.isInstantConfirmationOpen.set(false);
    if (!value) {
      return;
    }
    this.isCreating = true;
    this.apiService.post<BackupJob>(`${this.basePath}/instant`, {}).subscribe({
      next: () => {
        window.location.assign('/static/maintenance.html');
      },
      error: () => {
        this.isCreating = false;
        this.messageNotificationService.show(this.translationService.translate('Failed to create backup'));
      }
    });
  }

  openDeleteConfirmation(backup: BackupRecord): void {
    this.backupToDelete = backup;
    this.isDeleteConfirmationOpen.set(true);
  }

  confirmDeleteBackup(value: boolean): void {
    this.isDeleteConfirmationOpen.set(false);
    if (!value || !this.backupToDelete) {
      this.backupToDelete = null;
      return;
    }
    const backup = this.backupToDelete;
    this.isLoading = true;
    this.apiService.delete(`${this.basePath}/${backup.id}`)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.backupToDelete = null;
      }))
      .subscribe({
        next: () => {
          this.backups = this.backups.filter(item => item.id !== backup.id);
          this.messageNotificationService.show(this.translationService.translate('Backup deleted successfully'));
        },
        error: () => {
          this.messageNotificationService.show(this.translationService.translate('Failed to delete backup'));
        }
      });
  }

  openRestoreConfirmation(backup: BackupRecord): void {
    this.backupToRestore = backup;
    this.isRestoreConfirmationOpen.set(true);
  }

  confirmRestoreBackup(value: boolean): void {
    this.isRestoreConfirmationOpen.set(false);
    if (!value || !this.backupToRestore) {
      this.backupToRestore = null;
      return;
    }
    const backup = this.backupToRestore;
    this.isRestoring = true;
    this.apiService.post<BackupJob>(`${this.basePath}/${backup.id}/restore`, {}).subscribe({
      next: (job) => {
        if (!this.isTenantScope) {
          window.location.assign('/static/maintenance.html');
          return;
        }
        this.applyJob(job);
        this.schedulePoll(1000);
      },
      error: () => {
        this.isRestoring = false;
        this.backupToRestore = null;
        this.messageNotificationService.show(this.translationService.translate('Failed to restore backup'));
      }
    });
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) {
      return;
    }
    const takenAt = parseBackupTimestamp(file.name);
    const when = takenAt
      ? `${this.translationService.translate('This export is from')} ${takenAt.toLocaleString()} (${formatRelativeAge(takenAt)}).`
      : this.translationService.translate('The date of this export is unknown (the file was renamed), so it may be older than it looks.');
    this.importConfirmationMessage = `${when} ${this.translationService.translate('Restoring replaces the tenant (and its sub tenants, if any) with that state - anything changed since is lost.')}`;
    this.fileToImport = file;
    this.isImportConfirmationOpen.set(true);
  }

  confirmImportBackup(value: boolean): void {
    this.isImportConfirmationOpen.set(false);
    const file = this.fileToImport;
    this.fileToImport = null;
    if (!value || !file) {
      return;
    }
    const payload = new FormData();
    payload.append('file', file, file.name);
    this.isImporting = true;
    this.http.post<BackupJob>(`/api/${this.basePath}/import`, payload)
      .pipe(finalize(() => (this.isImporting = false)))
      .subscribe({
        next: (job) => {
          this.applyJob(job);
          this.schedulePoll(1000);
        },
        error: (error) => {
          this.messageNotificationService.show(this.translationService.translate(error?.error?.detail ?? 'Failed to import backup'), 'fail');
        }
      });
  }

  openVisibility(backup: BackupRecord): void {
    const scope = this.isTenantScope ? 'tenant' : 'admin';
    window.open(`/backup-visibility/${backup.id}?scope=${scope}`, '_blank');
  }

  downloadBackup(backup: BackupRecord): void {
    this.downloadingId = backup.id;
    this.http.get(`/api/${this.basePath}/${backup.id}/download`, { responseType: 'blob' })
      .pipe(finalize(() => (this.downloadingId = null)))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${backup.filename}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.messageNotificationService.show(this.translationService.translate('Failed to download backup'));
        }
      });
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString();
  }
}
