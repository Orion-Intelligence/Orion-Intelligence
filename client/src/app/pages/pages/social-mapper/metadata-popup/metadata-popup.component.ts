import { Component, ChangeDetectionStrategy, input, output, signal, computed, WritableSignal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult, SocialImage, SocialPost } from '../../../shared/model/social/social-scan.models';
import { getPlatformColor, formatFollowers, formatKey, isUrl, isImageUrl } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/components/social-icon/social-icon.component';
import { socialMapperAnimations } from '../../../shared/animations/social-mapper.animations';
import { FetchingStateService } from '../fetching-state.service';

@Component({
  selector: 'app-metadata-popup',
  templateUrl: './metadata-popup.component.html',
  styleUrls: ['./metadata-popup.component.css'],
  styles: [socialMapperAnimations],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SocialIconComponent],
})
export class MetadataPopupComponent {
  data = input.required<PlatformResult>();
  isScanInProgress = input<boolean>(false);
  
  close = output<void>();
  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();
  fetchImages = output<PlatformResult>();
  fetchFollowers = output<PlatformResult>();
  fetchFollowing = output<PlatformResult>();
  cancelFetchProfile = output<PlatformResult>();
  cancelFetchPosts = output<PlatformResult>();
  cancelFetchImages = output<PlatformResult>();
  cancelFetchFollowers = output<PlatformResult>();
  cancelFetchFollowing = output<PlatformResult>();

  fetchingState: FetchingStateService;

  displayPosts = signal<SocialPost[]>([]);
  displayImages = signal<SocialImage[]>([]);
  displayFollowers = signal<string[]>([]);
  displayFollowing = signal<string[]>([]);

  isLoadingMorePosts = signal(false);
  isLoadingMoreImages = signal(false);
  isLoadingMoreFollowers = signal(false);
  isLoadingMoreFollowing = signal(false);

  private readonly initialPosts = 3;
  private readonly initialImages = 8;
  private readonly initialFollowers = 10;
  private readonly initialFollowing = 10;
  private readonly postsIncrement = 3;
  private readonly imagesIncrement = 4;
  private readonly followersIncrement = 10;
  private readonly followingIncrement = 10;

  isFetching = computed(() => this.fetchingState.profile()[this.getPlatformUniqueKey()]);
  isFetchingPosts = computed(() => this.fetchingState.posts()[this.getPlatformUniqueKey()]);
  isFetchingImages = computed(() => this.fetchingState.platformImages()[this.getPlatformUniqueKey()]);
  isFetchingFollowers = computed(() => this.fetchingState.followers()[this.getPlatformUniqueKey()]);
  isFetchingFollowing = computed(() => this.fetchingState.following()[this.getPlatformUniqueKey()]);

  constructor(fetchingState: FetchingStateService) {
    this.fetchingState = fetchingState;
    effect(() => {
      this.displayPosts.set((this.data().posts || []).slice(0, this.initialPosts));
      this.displayImages.set((this.data().images || []).slice(0, this.initialImages));
      this.displayFollowers.set((this.data().followers_list || []).slice(0, this.initialFollowers));
      this.displayFollowing.set((this.data().following_list || []).slice(0, this.initialFollowing));
    });
  }

  getPlatformUniqueKey(): string {
    return this.fetchingState.getPlatformUniqueKey(this.data());
  }

  loadMorePosts() { this._loadMore(this.isLoadingMorePosts, this.displayPosts, this.data().posts, this.postsIncrement); }
  loadMoreImages() { this._loadMore(this.isLoadingMoreImages, this.displayImages, this.data().images, this.imagesIncrement); }
  loadMoreFollowers() { this._loadMore(this.isLoadingMoreFollowers, this.displayFollowers, this.data().followers_list, this.followersIncrement); }
  loadMoreFollowing() { this._loadMore(this.isLoadingMoreFollowing, this.displayFollowing, this.data().following_list, this.followingIncrement); }

  private addItemsIncrementally<T>(displaySignal: WritableSignal<T[]>, itemsToAdd: T[], onComplete: () => void) {
    if (itemsToAdd.length === 0) {
      onComplete();
      return;
    }

    let i = 0;
    const addItem = () => {
      if (i < itemsToAdd.length) {
        displaySignal.update(current => [...current, itemsToAdd[i]]);
        i++;
        setTimeout(addItem, 75);
      } else {
        onComplete();
      }
    };
    addItem();
  }

  private _loadMore<T>(
    isLoadingSignal: WritableSignal<boolean>,
    displaySignal: WritableSignal<T[]>,
    allItems: T[] | undefined | null,
    increment: number
  ) {
    if (isLoadingSignal()) return;
    isLoadingSignal.set(true);

    const currentCount = displaySignal().length;
    const items = allItems || [];
    const nextItems = items.slice(currentCount, currentCount + increment);

    this.addItemsIncrementally(displaySignal, nextItems, () => isLoadingSignal.set(false));
  }
  
  public getPlatformColor = getPlatformColor;
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  onClose() {
    this.close.emit();
  }

  getMetadataEntries(): { key: string, value: any }[] {
    const metadata = this.data().allMetadata;
    if (!metadata) return [];
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }

  getProfileDetailEntries(): { key: string, value: any }[] {
    const details = this.data().profileDetails;
    if (!details) return [];
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }}
