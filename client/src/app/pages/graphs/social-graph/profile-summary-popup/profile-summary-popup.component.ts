import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';

import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../services/fetching-state.service';
import { SummaryAllPlatformsViewComponent } from './summary-all-platforms-view/summary-all-platforms-view.component';
import { SummaryPlatformViewComponent } from './summary-platform-view/summary-platform-view.component';
import { PlatformIconBgDirective } from '../directives/platform-icon-bg.directive';
@Component({
  selector: 'app-profile-summary-popup',
  templateUrl: './profile-summary-popup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SocialIconComponent, SummaryAllPlatformsViewComponent, SummaryPlatformViewComponent, PlatformIconBgDirective],
})
export class ProfileSummaryPopupComponent {
  private fetchingState: FetchingStateService;

  username = input.required<string>();
  platforms = input.required<PlatformResult[]>();
  email = input<string | undefined>();
  isScanInProgress = input<boolean>(false);
  close = output<void>();
  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();
  fetchFollowers = output<PlatformResult>();
  fetchFollowing = output<PlatformResult>();
  fetchPlatformImages = output<PlatformResult>();
  rescan = output<string>();
  cancelFetchProfile = output<PlatformResult>();
  cancelFetchPosts = output<PlatformResult>();
  cancelFetchFollowers = output<PlatformResult>();
  cancelFetchFollowing = output<PlatformResult>();
  cancelFetchPlatformImages = output<PlatformResult>();
  cancelAllFetches = output<string>();
  platformSearchTerm = signal('');
  selectedPlatform = signal<PlatformResult | 'all' | null>('all');
  selectedPlatformDetails = computed((): PlatformResult | null => {
    const selection = this.selectedPlatform();
    if (!selection || selection === 'all') {
      return null;
    }

    return this.platforms().find(platform =>
      platform.platform === selection.platform
      && platform.username === selection.username
      && platform.keyUsername === selection.keyUsername) ?? selection;
  });
  isAllPlatformsSelected = computed((): boolean => {
    return this.selectedPlatform() === 'all';
  });
  filteredPlatforms = computed(() => {
    const term = this.platformSearchTerm().toLowerCase();
    const sortedPlatforms = [...this.platforms()].sort((a, b) => a.platform.localeCompare(b.platform));
    if (!term) {
      return sortedPlatforms;
    }
    return sortedPlatforms.filter(p => p.platform.toLowerCase().includes(term));
  });
  isAnythingFetching = computed(() => {
    return this.isScanInProgress() || this.fetchingState.isUserBusy(this.username());
  });
  totalPlatforms = computed(() => this.platforms().length);
  populatedProfilesCount = computed(() => this.platforms().filter(platform => platform.profileDetails !== undefined).length);
  populatedPostsCount = computed(() => this.platforms().filter(platform => platform.posts !== undefined).length);
  populatedConnectionsCount = computed(() => this.platforms().filter(platform => (platform.post_connections?.length ?? 0) > 0).length);

  constructor(fetchingState: FetchingStateService) {
    this.fetchingState = fetchingState;
    effect(() => {
      const platformList = this.filteredPlatforms();
      const currentSelection = this.selectedPlatform();
      if (currentSelection !== 'all' && currentSelection !== null) {
        const isSelectedPlatformVisible = platformList.some(p => p.platform === currentSelection.platform);
        if (!isSelectedPlatformVisible) {
          this.selectedPlatform.set('all');
        }
      }
    });
  }

  onSearchTermChange(event: Event) {
    this.platformSearchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.platformSearchTerm.set('');
  }

  onClose() {
    this.close.emit();
  }

  onAllPlatformsClick(): void {
    this.selectedPlatform.set('all');
  }

  onPlatformClick(platform: PlatformResult) {
    this.selectedPlatform.set(platform);
  }

  isSelected(platform: PlatformResult): boolean {
    const selection = this.selectedPlatform();
    if (selection === 'all' || selection === null) {
      return false;
    }
    return selection.platform === platform.platform && selection.username === platform.username;
  }

  trackByUrl(_index: number, item: PlatformResult): string {
    return item.url;
  }
}
