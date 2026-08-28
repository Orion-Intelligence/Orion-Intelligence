import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AppService } from '../../../services/core/app/app.service';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { ApiService } from '../../../shared/services/api.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/services/translation.service';

interface BackupRecord {
  id: string;
  filename: string;
  backup_type: 'auto' | 'instant';
  created_at: string;
}

@Component({
  selector: 'app-backup-restore',
  standalone: true,
  imports: [CommonModule, ConfirmationPopupComponent, TranslatePipe],
  animations: [fadeInDashboardItem],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './backup-restore.component.html',
})
export class BackupRestoreComponent implements OnInit {
  backups: BackupRecord[] = [];
  isLoading = true;
  backupToDelete: BackupRecord | null = null;
  backupToRestore: BackupRecord | null = null;
  isInstantConfirmationOpen = signal<boolean>(false);
  isDeleteConfirmationOpen = signal<boolean>(false);
  isRestoreConfirmationOpen = signal<boolean>(false);
  isRestoring = false;
  isCreating = false;
  readonly MAX_BACKUPS = 5;
  instantConfirmationMessage = 'Start instant backup now?';

  constructor(private apiService: ApiService, protected appService: AppService, private messageNotificationService: MessageNotificationService, private translationService: TranslationService) {
  }

  ngOnInit(): void {
    this.loadBackups();
  }

  loadBackups(): void {
    this.isLoading = true;
    this.apiService.get<BackupRecord[]>('admin/backups')
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (backups) => this.backups = backups || [],
        error: () => this.messageNotificationService.show(this.translationService.translate('Failed to load backups'))
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
    this.apiService.post<BackupRecord>('admin/backups/instant', {})
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe({
        next: () => {
          this.messageNotificationService.show(this.translationService.translate('Backup created successfully'),'success');
          this.loadBackups();
        },
        error: () => this.messageNotificationService.show(this.translationService.translate('Failed to create backup'))
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
    this.apiService.delete(`admin/backups/${backup.id}`)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.backupToDelete = null;
      }))
      .subscribe({
        next: () => {
          this.backups = this.backups.filter(item => item.id !== backup.id);
          this.messageNotificationService.show(this.translationService.translate('Backup deleted successfully'));
        },
        error: () => this.messageNotificationService.show(this.translationService.translate('Failed to delete backup'))
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
    this.apiService.post<any>(`admin/backups/${backup.id}/restore`, {})
      .pipe(finalize(() => {
        this.isRestoring = false;
        this.backupToRestore = null;
      }))
      .subscribe({
        next: () => this.messageNotificationService.show(this.translationService.translate('Backup restored successfully'), 'success'),
        error: () => this.messageNotificationService.show(this.translationService.translate('Failed to restore backup'))
      });
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString();
  }
}
