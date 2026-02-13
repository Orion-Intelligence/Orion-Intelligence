import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult, SocialImage, SocialPost } from '../../../shared/model/social/social-scan.models';
import { getPlatformColor, formatFollowers, formatKey, isUrl, isImageUrl } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/components/social-icon/social-icon.component';
import { socialMapperAnimations } from '../../../shared/animations/social-mapper.animations';

@Component({
  selector: 'app-profile-summary-popup',
  templateUrl: './profile-summary-popup.component.html',
  styleUrls: ['./profile-summary-popup.component.css'],
  styles: [socialMapperAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SocialIconComponent],
})
export class ProfileSummaryPopupComponent {
  username = input.required<string>();
  platforms = input.required<PlatformResult[]>();
  email = input<string | undefined>();
  images = input<SocialImage[] | undefined>();
  fetchingState = input.required<{ [platformNodeId: string]: boolean }>();
  isFetchingImages = input<boolean>(false);
  isFetchingPosts = input.required<{ [platformNodeId: string]: boolean }>();
  isScanInProgress = input<boolean>(false);

  close = output<void>();
  fetchProfile = output<PlatformResult>();
  fetchImages = output<string>();
  fetchPosts = output<PlatformResult>();
  rescan = output<string>();
  cancelFetchProfile = output<PlatformResult>();
  cancelFetchPosts = output<PlatformResult>();
  cancelFetchImages = output<string>();
  cancelAllFetches = output<string>();

  isActionsMenuVisible = signal(false);
  platformSearchTerm = signal('');

  selectedPlatform = signal<PlatformResult | 'all' | null>('all');

  selectedPlatformDetails = computed((): PlatformResult | null => {
    const selection = this.selectedPlatform();
    if (selection && selection !== 'all') {
      return selection;
    }
    return null;
  });

  isAllPlatformsSelected = computed((): boolean => {
    return this.selectedPlatform() === 'all';
  });

  public getPlatformColor = getPlatformColor;
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;
  
  constructor() {
    effect(() => {
      const platformList = this.filteredPlatforms();
      const currentSelection = this.selectedPlatform();

      if (currentSelection !== 'all' && currentSelection !== null) {
          const isSelectedPlatformVisible = platformList.some(p => p.platform === currentSelection.platform);
          if (!isSelectedPlatformVisible) {
              this.selectedPlatform.set('all');
          }
      }
    }, { allowSignalWrites: true });
  }

  filteredPlatforms = computed(() => {
    const term = this.platformSearchTerm().toLowerCase();
    const sortedPlatforms = [...this.platforms()].sort((a, b) => a.platform.localeCompare(b.platform));

    if (!term) {
      return sortedPlatforms;
    }
    return sortedPlatforms.filter(p => p.platform.toLowerCase().includes(term));
  });
  
  allPosts = computed(() => {
    const all_posts: (SocialPost & { platform: string })[] = [];
    this.platforms().forEach(p => {
      if (p.posts) {
        p.posts.forEach(post => {
          all_posts.push({ ...post, platform: p.platform });
        });
      }
    });
    all_posts.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    return all_posts;
  });

  isAnythingFetching = computed(() => {
    if (this.isFetchingImages() || this.isScanInProgress()) {
      return true;
    }
    const username = this.username();
    const fetchingState = this.fetchingState();
    const fetchingPostsState = this.isFetchingPosts();
    for (const platform of this.platforms()) {
      const key = `${username}-${platform.platform}`;
      if (fetchingState[key] || fetchingPostsState[key]) {
        return true;
      }
    }
    return false;
  });

  isFetchingAnyProfileDetails = computed(() => {
    const username = this.username();
    const fetchingState = this.fetchingState();
    return this.platforms().some(p => fetchingState[`${username}-${p.platform}`]);
  });

  isFetchingAnyPosts = computed(() => {
    const username = this.username();
    const fetchingPostsState = this.isFetchingPosts();
    return this.platforms().some(p => fetchingPostsState[`${username}-${p.platform}`]);
  });

  hasAnyPostsBeenFetched = computed(() => {
    return this.platforms().some(p => p.posts !== undefined);
  });

  hasAllDataBeenFetchedOnce = computed(() => {
    if (this.images() === undefined) {
      return false;
    }
    if (this.platforms().length === 0) {
      return true;
    }
    for (const platform of this.platforms()) {
      if (platform.profileDetails === undefined || platform.posts === undefined) {
        return false;
      }
    }
    return true;
  });
  
  hasAnyProfileDetails = computed(() => {
    return this.platforms().some(p => p.profileDetails);
  });

  onSearchTermChange(event: Event) {
    this.platformSearchTerm.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.platformSearchTerm.set('');
  }

  toggleActionsMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isActionsMenuVisible.update(v => !v);
  }

  closeActionsMenu() {
    this.isActionsMenuVisible.set(false);
  }

  fetchAllData() {
    this.handleFetchAllProfiles();
    this.handleFetchAllPosts();
    if (this.images() === undefined) this.fetchImages.emit(this.username());
  }

  handleFetchAllProfiles() {
    for (const platform of this.platforms()) {
      if (platform.profileDetails === undefined) this.fetchProfile.emit(platform);
    }
  }

  handleFetchAllPosts() {
    for (const platform of this.platforms()) {
      if (platform.posts === undefined) this.fetchPosts.emit(platform);
    }
  }
  
  onClose() {
    this.close.emit();
  }

  handleRescan() {
    this.rescan.emit(this.username());
    this.isActionsMenuVisible.set(false);
  }

  handleFetchImages() {
    this.fetchImages.emit(this.username());
    this.isActionsMenuVisible.set(false);
  }

  handleFetchAllData() {
    this.fetchAllData();
    this.isActionsMenuVisible.set(false);
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
    return selection.platform === platform.platform;
  }

  getMetadataEntries(platform: PlatformResult | null): { key: string, value: any }[] {
    if (!platform) return [];
    const metadata = platform.allMetadata;
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }

  getProfileDetailEntries(platform: PlatformResult | null): { key: string, value: any }[] {
    if (!platform) return [];
    const details = platform.profileDetails;
    if (!details) return [];
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }
}