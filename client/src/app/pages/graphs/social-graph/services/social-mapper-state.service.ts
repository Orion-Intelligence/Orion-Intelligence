import { Injectable, computed, inject, signal } from '@angular/core';
import { TabManagerService } from '../../shared/services/tab-manager.service';
import { NotificationData, NotificationType } from '../notification-bar/notification-bar.component';
import { ManageProfilesModalData, PlatformResult } from '../../../../shared/model/social/social-scan.models';

interface DeleteConfirmationData {
  message: string;
}

interface InfoPopupData {
  type: 'info' | 'warning';
  title: string;
  message: string;
  confirmText: string;
}

@Injectable({ providedIn: 'root' })
export class SocialMapperStateService {
  private tabManager = inject(TabManagerService);
  private notificationTimeout: any;
  private activeTabState = computed(() => this.tabManager.activeTab()?.state);
  private jobs = computed(() => this.activeTabState()?.jobs() ?? []);
  private scanResults = computed(() => this.activeTabState()?.scanResults() ?? new Map<string, PlatformResult[]>());
  private scannedUsernames = computed(() => Array.from(this.activeTabState()?.scanResults().keys() ?? []));

  notification = signal<NotificationData | null>(null);
  deleteConfirmationData = signal<DeleteConfirmationData | null>(null);
  deleteUsername = signal<string | null>(null);
  infoModalData = signal<InfoPopupData | null>(null);
  manageProfilesModalData = signal<ManageProfilesModalData | null>(null);
  activeUsername = computed(() => {
    const usernames = this.scannedUsernames();
    const selectedUsername = this.activeTabState()?.activeUsername() ?? null;
    if (selectedUsername) {
      const matchingUsername = usernames.find(username => username.toLowerCase() === selectedUsername.toLowerCase());
      if (matchingUsername) {
        return matchingUsername;
      }
    }
    return usernames[0] ?? null;
  });
  activeUserIndex = computed(() => {
    const activeUsername = this.activeUsername();
    if (!activeUsername) {
      return 0;
    }
    const index = this.scannedUsernames().findIndex(username => username.toLowerCase() === activeUsername.toLowerCase());
    return index === -1 ? 0 : index;
  });
  highlightedNodeId = signal<string | null>(null);

  setActiveUserByUsername(username: string): void {
    const normalizedUsername = username.toLowerCase();
    const index = this.scannedUsernames().findIndex(current => current.toLowerCase() === normalizedUsername);
    if (index !== -1) {
      this.activeTabState()?.activeUsername.set(this.scannedUsernames()[index] ?? username);
      this.tabManager.scheduleSave();
    }
  }

  setActiveUserIndex(index: number): void {
    const usernames = this.scannedUsernames();
    const boundedIndex = Math.min(Math.max(index, 0), Math.max(usernames.length - 1, 0));
    this.activeTabState()?.activeUsername.set(usernames[boundedIndex] ?? null);
    this.tabManager.scheduleSave();
  }

  isActiveUser(username: string): boolean {
    const activeUsername = this.activeUsername();
    return !!activeUsername && activeUsername.toLowerCase() === username.toLowerCase();
  }

  openDeleteConfirmation(username: string): void {
    const job = this.jobs().find(j => j.username === username);
    this.deleteUsername.set(username);
    this.deleteConfirmationData.set({
      message: `Are you sure you want to delete the profile for ${job?.displayName || username}? This will remove all associated data and cannot be undone.`,
    });
  }

  closeDeleteConfirmation(): void {
    this.deleteConfirmationData.set(null);
    this.deleteUsername.set(null);
  }

  openManageProfilesModal(username: string): void {
    const results = this.scanResults().get(username);
    if (!results) {
      return;
    }
    const hasStoredSelection = results.some(platform => platform.isSelected);
    const platforms = results.map(platform => ({
      ...platform,
      isSelected: hasStoredSelection ? platform.isSelected : platform.status !== 'informational',
    }));
    this.manageProfilesModalData.set({ username, platforms });
  }

  closeManageProfilesModal(): void {
    this.manageProfilesModalData.set(null);
  }

  openInfoModal(type: 'info' | 'warning', title: string, message: string, confirmText: string = 'OK'): void {
    this.infoModalData.set({ type, title, message, confirmText });
  }

  closeInfoModal(): void {
    this.infoModalData.set(null);
  }

  showNotification(type: NotificationType): void {
    clearTimeout(this.notificationTimeout);
    const notifications: Record<NotificationType, Omit<NotificationData, 'type'>> = {
      scanning: { message: 'A scan for this user is already in progress.', icon: 'bi bi-hourglass-split', style: 'bg-orange-500/90 text-white border border-orange-400' },
      busy: { message: 'An operation is already in progress for this user.', icon: 'bi bi-hourglass-split', style: 'bg-orange-500/90 text-white border border-orange-400 animate-pulse' }
    };
    this.notification.set({ type, ...notifications[type] });
    this.notificationTimeout = setTimeout(() => this.notification.set(null), 3000);
  }
}
