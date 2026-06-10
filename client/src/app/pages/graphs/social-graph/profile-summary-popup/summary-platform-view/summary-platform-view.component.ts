import { Component, ChangeDetectionStrategy, input, output, effect, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey } from '../../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../../services/fetching-state.service';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';
import { buildSocialProfileUrl } from '../../utils/profile-url.util';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
import { PlatformFeedViewBase } from '../../utils/platform-feed-view.base';
import { SocialScanService } from '../../../shared/services/social-scan.service';
import { finalize } from 'rxjs/operators';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-summary-platform-view',
  standalone: true,
  imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective, TranslatePipe],
  templateUrl: './summary-platform-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPlatformViewComponent extends PlatformFeedViewBase {
  private socialScanService = inject(SocialScanService);
  private destroyRef = inject(DestroyRef);

  platform = input.required<PlatformResult | null>();
  isScanInProgress = input<boolean>(false);
  fetchProfile = output<PlatformResult>();
  fetchPosts = output<PlatformResult>();
  fetchFollowers = output<PlatformResult>();
  fetchFollowing = output<PlatformResult>();
  fetchPlatformImages = output<PlatformResult>();
  scanUsernames = output<string[]>();
  cancelFetchProfile = output<PlatformResult>();
  cancelFetchPosts = output<PlatformResult>();
  cancelFetchFollowers = output<PlatformResult>();
  cancelFetchFollowing = output<PlatformResult>();
  cancelFetchPlatformImages = output<PlatformResult>();
  public fetchingState = inject(FetchingStateService);
  public formatFollowers = formatFollowers;
  public formatKey = formatKey;
  metadataTokenInput = signal('');
  metadataTokens = signal<string[]>([]);
  metadataLoading = signal(false);
  metadataLoaded = signal(false);
  metadataError = signal('');
  metadataResult = signal<{
        query: string;
        total_found: number;
        timestamp?: string;
        results: any[];
    } | null>(null);

  constructor() {
    super();
    effect(() => {
      const p = this.platform();
      this.resetFeedState(p?.posts, p?.images, p?.followers_list, p?.following_list, p?.post_connections);
    });
  }

  getPlatformUniqueKey(p: PlatformResult): string {
    return this.fetchingState.getPlatformUniqueKey(p);
  }

  override loadMorePosts() {
    super.loadMorePosts(this.platform()?.posts);
  }

  override loadMoreImages() {
    super.loadMoreImages(this.platform()?.images);
  }

  override loadMoreFollowers() {
    super.loadMoreFollowers(this.platform()?.followers_list);
  }

  override loadMoreFollowing() {
    super.loadMoreFollowing(this.platform()?.following_list);
  }

  override loadMorePostConnections() {
    super.loadMorePostConnections(this.platform()?.post_connections);
  }

  getProfileDetailEntries(platform: PlatformResult | null): {
        key: string;
        value: any;
    }[] {
    return getProfileDetailEntries(platform);
  }

  getAccountUrl(platform: PlatformResult): string {
    return buildSocialProfileUrl(platform.platform, platform.username, platform.url);
  }

  trackByIndex(index: number): number {
    return index;
  }

  fetchPlatformMetadata(): void {
    const p = this.platform();
    if (!p) {
      return;
    }
    this.addTokensFromInput();
    const tokens = this.metadataTokens();
    if (!tokens.length) {
      this.metadataError.set('Enter at least one token to search.');
      this.metadataLoaded.set(true);
      this.metadataResult.set(null);
      return;
    }
    this.metadataLoading.set(true);
    this.metadataLoaded.set(false);
    this.metadataError.set('');
    this.socialScanService.fetchProfileMetadataTokens(tokens, p.username, p.platform).pipe(finalize(() => {
      this.metadataLoading.set(false);
      this.metadataLoaded.set(true);
    }), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.metadataResult.set(res || null);
      },
      error: () => {
        this.metadataError.set('Failed to fetch profile metadata results.');
        this.metadataResult.set(null);
      }
    });
  }

  override addTokensFromInput(): void {
    this.addTokensFromInputSignal(this.metadataTokenInput, this.metadataTokens);
  }

  removeMetadataToken(token: string): void {
    this.metadataTokens.set(this.metadataTokens().filter(t => t !== token));
  }
}
