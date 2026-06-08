import { Component, ChangeDetectionStrategy, input, output, computed, effect, signal } from '@angular/core';

import { PlatformResult, SocialImage, SocialPost } from '../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey, isUrl, isImageUrl } from '../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../services/fetching-state.service';
import { PlatformIconBgDirective } from '../directives/platform-icon-bg.directive';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { getMetadataEntries, getProfileDetailEntries } from '../utils/summary-view.util';
import { PlatformFeedViewBase } from '../utils/platform-feed-view.base';
@Component({
  selector: 'app-metadata-popup',
  templateUrl: './metadata-popup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SocialIconComponent, PlatformIconBgDirective],
})
export class MetadataPopupComponent extends PlatformFeedViewBase {
  data = input.required<PlatformResult>();
  isScanInProgress = input<boolean>(false);
  close = output<undefined>();
  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();
  fetchImages = output<PlatformResult>();
  fetchFollowers = output<PlatformResult>();
  fetchFollowing = output<PlatformResult>();
  scanUsernames = output<string[]>();
  cancelFetchProfile = output<PlatformResult>();
  cancelFetchPosts = output<PlatformResult>();
  cancelFetchImages = output<PlatformResult>();
  cancelFetchFollowers = output<PlatformResult>();
  cancelFetchFollowing = output<PlatformResult>();
  fetchingState: FetchingStateService;
  isFetching = computed(() => this.fetchingState.profile()[this.getPlatformUniqueKey()]);
  isFetchingPosts = computed(() => this.fetchingState.posts()[this.getPlatformUniqueKey()]);
  isFetchingImages = computed(() => this.fetchingState.platformImages()[this.getPlatformUniqueKey()]);
  isFetchingFollowers = computed(() => this.fetchingState.followers()[this.getPlatformUniqueKey()]);
  isFetchingFollowing = computed(() => this.fetchingState.following()[this.getPlatformUniqueKey()]);
  metadataSearchTerm = signal('');
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  public isUrl = isUrl;
  public isImageUrl = isImageUrl;

  constructor(fetchingState: FetchingStateService) {
    super();
    this.fetchingState = fetchingState;
    effect(() => {
      this.resetFeedState(this.data().posts, this.data().images, this.data().followers_list, this.data().following_list, this.data().post_connections);
    });
  }

  getPlatformUniqueKey(): string {
    return this.fetchingState.getPlatformUniqueKey(this.data());
  }

  updateMetadataSearch(event: Event) {
    this.metadataSearchTerm.set((event.target as HTMLInputElement).value);
  }

  getFilteredMetadataEntries(): { key: string; value: any; }[] {
    const all = this.getMetadataEntries();
    const term = this.metadataSearchTerm().toLowerCase().trim();
    if (!term) return all;
    return all.filter(e =>
      formatKey(e.key).toLowerCase().includes(term) ||
      String(e.value).toLowerCase().includes(term)
    );
  }

  copyToClipboard(text: any) {
    const str = String(text);
    navigator.clipboard.writeText(str).then(() => {
      // Logic for toast or visual feedback could be added here
    });
  }

  override loadMorePosts() {
    super.loadMorePosts(this.data().posts);
  }

  override loadMoreImages() {
    super.loadMoreImages(this.data().images);
  }

  override loadMoreFollowers() {
    super.loadMoreFollowers(this.data().followers_list);
  }

  override loadMoreFollowing() {
    super.loadMoreFollowing(this.data().following_list);
  }

  override loadMorePostConnections() {
    super.loadMorePostConnections(this.data().post_connections);
  }

  onClose() {
    this.close.emit(undefined);
  }

  getMetadataEntries(): { key: string; value: any; }[] {
    return getMetadataEntries(this.data().allMetadata);
  }

  getProfileDetailEntries(): { key: string; value: any; }[] {
    return getProfileDetailEntries(this.data());
  }

  trackByKey( _index: number, item: { key: string; } ): string {
    return item.key;
  }

  trackByPostUrl(_index: number, post: SocialPost): string {
    return post.post_url;
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  trackByImageUrl(_index: number, image: SocialImage): string {
    return image.image_url;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getAccountUrl(): string {
    const platformData = this.data();
    return buildSocialProfileUrl(platformData.platform, platformData.username, platformData.url);
  }
}
