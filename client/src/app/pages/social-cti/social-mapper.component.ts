import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Job, ManageProfilesModalData, PlatformResult } from './models/social-scan.models';
import type { FeedUser, NotificationData } from './models/social-graph.models';
import { HomeMenuComponent } from './home-menu/home-menu.component';
import { SocialProfileListingComponent } from './profile-listing/profile-listing.component';
import { NotificationBarComponent } from './notification-bar/notification-bar.component';
import { SocialService } from './services/social.service';
import { SocialStorageService } from './services/social-storage.service';
import { ConfirmationPopupComponent } from '../../shared/partials/confirmation-popup/confirmation-popup.component';
import { getFirstFileFromInputEvent, readFileAsDataUrl } from '../../shared/utils/file-input.util';
import { ProfileComponent } from '../../shared/partials/profile/profile.component';
import { ManageProfilesModalComponent } from './profile-popups/manage-profiles-modal/manage-profiles-modal.component';
import type { SocialResultSource } from './enums/social-graph.enums';
import { SocialBreadcrumbComponent } from './breadcrumb/social-breadcrumb.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-social-graph',
  templateUrl: './social-mapper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    HomeMenuComponent,
    SocialProfileListingComponent,
    ConfirmationPopupComponent,
    NotificationBarComponent,
    ProfileComponent,
    ManageProfilesModalComponent,
    SocialBreadcrumbComponent,
    NgClass,
    TranslatePipe
  ]
})
export class SocialMapperComponent {
  private readonly socialService = inject(SocialService);
  private readonly storageService = inject(SocialStorageService);
  private readonly router = inject(Router);
  private readonly sidebarState = this.storageService.sidebarState;
  private readonly profilesState = this.storageService.profilesState;
  private notificationTimeout: ReturnType<typeof setTimeout> | undefined;

  activeUsername = this.storageService.activeUsername;
  homeMenuSearchTerm = this.sidebarState.homeMenuSearchTerm;
  jobs = this.sidebarState.jobs;
  scanResults = this.profilesState.scanResults;
  resultUsernames = computed(() => new Set([
    ...Array.from(this.scanResults().keys()),
    ...this.jobs().filter(job => job.status === 'completed').map(job => job.username)
  ]));
  isHomeMenuCollapsed = this.sidebarState.isHomeMenuCollapsed;
  isInitialLoading = signal(true);
  notification = signal<NotificationData | null>(null);
  deleteConfirmationMessage = signal<string | null>(null);
  deleteUsername = signal<string | null>(null);
  manageProfilesModalData = signal<ManageProfilesModalData | null>(null);
  highlightedNodeId = signal<string | null>(null);
  profileBreadcrumbLabel = signal<string | null>(null);
  activeResultSources = signal<Record<string, SocialResultSource>>({});
  activeSourcePlatforms = computed(() => {
    const username = this.activeUsername();
    if (!username) {
      return [];
    }
    const results = this.scanResults();
    const platforms = results.get(username) ?? Array.from(results.entries()).find(([key]) => key.toLowerCase() === username.toLowerCase())?.[1] ?? [];
    return this.getVisiblePlatforms(platforms);
  });
  hasResultSourceTabs = computed(() => this.activeSourcePlatforms().some(platform => this.getResultSource(platform) === 'darkweb'));
  activeResultSource = computed(() => {
    const username = this.activeUsername();
    const platforms = this.activeSourcePlatforms();
    const preferred = username ? this.activeResultSources()[username] ?? 'normal' : 'normal';
    if (platforms.some(platform => this.getResultSource(platform) === preferred)) {
      return preferred;
    }
    return platforms.some(platform => this.getResultSource(platform) === 'normal') ? 'normal' : 'darkweb';
  });
  imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  profileListing = viewChild(SocialProfileListingComponent);

  constructor(private destroyRef: DestroyRef) {
    this.destroyRef.onDestroy(() => clearTimeout(this.notificationTimeout));
    this.storageService.loadProfiles().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.isInitialLoading.set(false);
      this.resumeIncompleteScans();
    })).subscribe();
  }

  onHomeMenuSearchChanged(term: string): void {
    this.sidebarState.homeMenuSearchTerm.set(term);
  }

  onDashboardScanInput(event: Event): void {
    const nextValue = (event.target as HTMLInputElement | null)?.value ?? '';
    this.onHomeMenuSearchChanged(nextValue);
  }

  onHomeMenuToggled(): void {
    this.sidebarState.isHomeMenuCollapsed.update(value => !value);
  }

  setResultSource(source: SocialResultSource): void {
    const username = this.activeUsername();
    if (!username) {
      return;
    }
    const nextSource: SocialResultSource = this.activeResultSource() === source ? (source === 'normal' ? 'darkweb' : 'normal') : source;
    if (this.getResultSourceCount(nextSource) === 0) {
      return;
    }
    this.activeResultSources.update(current => ({ ...current, [username]: nextSource }));
    this.profileListing()?.clearProfileOverview();
  }

  getResultSourceCount(source: SocialResultSource): number {
    return this.activeSourcePlatforms().filter(platform => this.getResultSource(platform) === source).length;
  }

  triggerScan(): void {
    let username = this.homeMenuSearchTerm().trim();
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    if (username) {
      if (!this.socialService.initiateScan(username, this.destroyRef)) {
        this.showScanInProgressNotification();
      }
      this.sidebarState.homeMenuSearchTerm.set('');
    }
  }

  triggerImageUpload(): void {
    this.imageInput()?.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const selected = getFirstFileFromInputEvent(event);
    if (!selected) {
      return;
    }
    const { input, file } = selected;
    void readFileAsDataUrl(file)
      .then((dataUrl) => {
        const base64Image = dataUrl.split(',')[1];
        if (base64Image) {
          this.initiateImageScan(base64Image, file.name);
        }
      })
      .finally(() => {
        input.value = '';
      });
  }

  confirmDeletion(): void {
    const usernameToDelete = this.deleteUsername();
    if (usernameToDelete) {
      this.profileListing()?.cancelAllFetchesForUser(usernameToDelete);
      this.removeUserScanData(usernameToDelete);
      this.storageService.deleteProfiles(usernameToDelete).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
    this.closeDeleteConfirmation();
  }

  onDeleteConfirmation(confirmed: boolean): void {
    if (confirmed) {
      this.confirmDeletion();
      return;
    }
    this.closeDeleteConfirmation();
  }

  handleCompletedJobClick(job: Job): void {
    if (job.status !== 'completed') {
      return;
    }
    this.profileListing()?.clearProfileOverview();
    this.sidebarState.activeUsername.set(job.username);
  }

  private initiateScan(username: string): void {
    if (!this.socialService.initiateScan(username, this.destroyRef)) {
      this.showScanInProgressNotification();
    }
  }

  private initiateImageScan(base64Image: string, fileName: string): void {
    this.socialService.initiateImageScan(base64Image, fileName, this.destroyRef);
  }

  cancelScan(jobId: string): void {
    this.socialService.cancelScan(jobId, this.destroyRef);
  }

  retryScan(job: Job): void {
    this.initiateScan(job.username);
  }

  private resumeIncompleteScans(): void {
    this.socialService.resumeIncompleteScans(this.destroyRef);
  }

  private removeUserScanData(username: string): void {
    this.sidebarState.jobs.update(currentJobs => currentJobs.filter(job => job.username !== username));
    this.profilesState.scanResults.update(currentMap => {
      const newMap = new Map(currentMap);
      for (const key of newMap.keys()) {
        if (key === username) {
          newMap.delete(key);
        }
      }
      return newMap;
    });
    this.sidebarState.activeUsername.set(Array.from(this.profilesState.scanResults().keys())[0] ?? null);
  }

  openDeleteConfirmation(username: string): void {
    const job = this.jobs().find(currentJob => currentJob.username === username);
    this.deleteUsername.set(username);
    this.deleteConfirmationMessage.set(`Are you sure you want to delete the profile for ${job?.displayName || username}? This will remove all associated data and cannot be undone.`);
  }

  closeDeleteConfirmation(): void {
    this.deleteConfirmationMessage.set(null);
    this.deleteUsername.set(null);
  }

  openManageProfiles(user: FeedUser): void {
    const results = this.profilesState.scanResults().get(user.username);
    if (!results) {
      return;
    }
    const hasStoredSelection = results.some(platform => platform.isSelected);
    this.manageProfilesModalData.set({
      username: user.username,
      platforms: results.map(platform => ({
        ...platform,
        isSelected: hasStoredSelection ? platform.isSelected : platform.status !== 'informational',
      })),
    });
  }

  closeManageProfilesModal(): void {
    this.manageProfilesModalData.set(null);
  }

  updateProfilesFromModal(selectedPlatforms: PlatformResult[]): void {
    const modalData = this.manageProfilesModalData();
    if (!modalData) {
      return;
    }
    const selectedKeys = new Set(selectedPlatforms.map(platform => this.getPlatformSelectionKey(platform)));
    let updatedProfiles: PlatformResult[] = [];
    this.profilesState.scanResults.update(currentMap => {
      const nextMap = new Map(currentMap);
      const currentPlatforms = nextMap.get(modalData.username) ?? [];
      updatedProfiles = currentPlatforms.map(platform => ({
        ...platform,
        isSelected: selectedKeys.has(this.getPlatformSelectionKey(platform)),
      }));
      nextMap.set(modalData.username, updatedProfiles);
      return nextMap;
    });
    this.storageService.saveProfiles(modalData.username, updatedProfiles, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.closeManageProfilesModal();
  }

  handleImageFlowSearch(username: string): void {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      return;
    }
    this.closeManageProfilesModal();
    this.initiateScan(normalizedUsername);
  }

  onSidebarPlatformClicked(elementId: string): void {
    this.highlightedNodeId.set(elementId);
    setTimeout(() => {
      if (this.highlightedNodeId() === elementId) {
        this.highlightedNodeId.set(null);
      }
    }, 3500);

    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onHeaderBack(): void {
    const profileListing = this.profileListing();
    if (profileListing?.hasOpenProfileOverview()) {
      profileListing.clearProfileOverview();
      return;
    }
    void this.router.navigate(['/dashboard/home']);
  }

  onProfileOverviewLabelChanged(label: string | null): void {
    this.profileBreadcrumbLabel.set(label);
  }

  private showScanInProgressNotification(): void {
    clearTimeout(this.notificationTimeout);
    this.notification.set({
      message: 'A scan for this user is already in progress.',
      icon: 'bi bi-hourglass-split',
      style: 'bg-orange-500/90 text-white border border-orange-400',
    });
    this.notificationTimeout = setTimeout(() => this.notification.set(null), 3000);
  }

  private getPlatformSelectionKey(platform: PlatformResult): string {
    return `${platform.keyUsername}|${platform.platform.toLowerCase()}|${platform.username.toLowerCase()}|${platform.url}`;
  }

  private getResultSource(platformData: PlatformResult): SocialResultSource {
    return platformData.resultSource ?? 'normal';
  }

  private getVisiblePlatforms(platforms: PlatformResult[]): PlatformResult[] {
    const selectedPlatforms = platforms.filter(platform => platform.isSelected);
    return selectedPlatforms.length > 0 ? selectedPlatforms : [...platforms];
  }
}
