import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { FeederOwnerUser, FeederScriptItem } from '../../../../../../shared/model/profile/feeder.model';
import { LicenseName } from '../../../../../../shared/model/licenses/license.rules';
import { MessageNotificationService } from '../../../../../../services/message_notification/message-notification.service';
import { FeederService } from '../feeder.service';

@Component({
  selector: 'app-sidebar-user-feeder-owner-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sidebar-user-feeder-owner-dialog.component.html',
})
export class SidebarUserFeederOwnerDialogComponent implements OnChanges {
  isOwnerLoading = false;
  isOwnerSaving = false;
  selectedOwnerUserId = '';
  ownerUsers: FeederOwnerUser[] = [];

  @Input() script: FeederScriptItem | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  constructor(private feederService: FeederService, private messageNotificationService: MessageNotificationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['script'] && this.script) {
      this.selectedOwnerUserId = '';
      this.loadOwnerUsers();
    }
  }

  getAvailableOwnerUsers(): FeederOwnerUser[] {
    return this.ownerUsers.filter((user) => user.id !== this.script?.owner_id);
  }

  confirmOwnerTransfer(): void {
    if (!this.script || !this.selectedOwnerUserId) {
      return;
    }

    this.isOwnerSaving = true;
    this.feederService.transferOwner(this.script.id, this.selectedOwnerUserId)
      .pipe(finalize(() => {
        this.isOwnerSaving = false;
      }))
      .subscribe({
        next: (response) => {
          this.messageNotificationService.show(response?.message || 'Script owner updated successfully', 'success');
          this.saved.emit();
        },
        error: (error) => {
          this.messageNotificationService.show(error?.error?.detail || 'Failed to update script owner');
        }
      });
  }

  private loadOwnerUsers(): void {
    this.isOwnerLoading = true;
    this.feederService.getOwnerUsers()
      .pipe(finalize(() => {
        this.isOwnerLoading = false;
      }))
      .subscribe({
        next: (users) => {
          this.ownerUsers = (users ?? [])
            .filter((user) => user.status === 'active' && (user.role === 'admin' || (user.licenses || []).includes(LicenseName.FEEDER)))
            .sort((left, right) => (left.username || '').localeCompare(right.username || ''));
          this.selectedOwnerUserId = this.ownerUsers.find((user) => user.id !== this.script?.owner_id)?.id || '';
        },
        error: (error) => {
          this.closed.emit();
          this.messageNotificationService.show(error?.error?.detail || 'Failed to load feeder users');
        }
      });
  }
}
