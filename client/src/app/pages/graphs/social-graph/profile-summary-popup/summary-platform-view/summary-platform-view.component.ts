import { Component, ChangeDetectionStrategy, input, output, signal, effect, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult, SocialImage, SocialPost } from '../../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey } from '../../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../../services/fetching-state.service';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';
import { buildSocialProfileUrl } from '../../utils/profile-url.util';

@Component({
  selector: 'app-summary-platform-view',
  standalone: true,
  imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective],
  templateUrl: './summary-platform-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPlatformViewComponent {
  platform = input.required<PlatformResult | null>();
  isScanInProgress = input<boolean>(false);

  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();
  fetchFollowers = output<PlatformResult>();
  fetchFollowing = output<PlatformResult>();
  fetchPlatformImages = output<PlatformResult>();
  cancelFetchProfile = output<PlatformResult>();
  cancelFetchPosts = output<PlatformResult>();
  cancelFetchFollowers = output<PlatformResult>();
  cancelFetchFollowing = output<PlatformResult>();
  cancelFetchPlatformImages = output<PlatformResult>();

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

  public fetchingState = inject(FetchingStateService);
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;

  constructor() {
    effect(() => {
      const p = this.platform();
      this.displayPosts.set((p?.posts || []).slice(0, this.initialPosts));
      this.displayImages.set((p?.images || []).slice(0, this.initialImages));
      this.displayFollowers.set((p?.followers_list || []).slice(0, this.initialFollowers));
      this.displayFollowing.set((p?.following_list || []).slice(0, this.initialFollowing));
    });
  }

  getPlatformUniqueKey(p: PlatformResult): string {
    return this.fetchingState.getPlatformUniqueKey(p);
  }

  loadMorePosts() { this._loadMore(this.isLoadingMorePosts, this.displayPosts, this.platform()?.posts, this.postsIncrement); }
  loadMoreImages() { this._loadMore(this.isLoadingMoreImages, this.displayImages, this.platform()?.images, this.imagesIncrement); }
  loadMoreFollowers() { this._loadMore(this.isLoadingMoreFollowers, this.displayFollowers, this.platform()?.followers_list, this.followersIncrement); }
  loadMoreFollowing() { this._loadMore(this.isLoadingMoreFollowing, this.displayFollowing, this.platform()?.following_list, this.followingIncrement); }

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

  private _loadMore<T>(isLoadingSignal: WritableSignal<boolean>, displaySignal: WritableSignal<T[]>, allItems: T[] | undefined | null, increment: number) {
    if (isLoadingSignal()) {
      return;
    }
    isLoadingSignal.set(true);

    const currentCount = displaySignal().length;
    const items = allItems || [];
    const nextItems = items.slice(currentCount, currentCount + increment);

    this.addItemsIncrementally(displaySignal, nextItems, () => isLoadingSignal.set(false));
  }

  getProfileDetailEntries(platform: PlatformResult | null): { key: string, value: any }[] {
    if (!platform) {
      return [];
    }
    const details = platform.profileDetails;
    if (!details) {
      return [];
    }
    return Object.entries(details)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({ key, value }));
  }

  getAccountUrl(platform: PlatformResult): string {
    return buildSocialProfileUrl(platform.platform, platform.username, platform.url);
  }
}
