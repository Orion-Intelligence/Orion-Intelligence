import { Component, ChangeDetectionStrategy, input, output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import { formatFollowers, formatKey } from '../../../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../../../shared/components/social-icon/social-icon.component';
import { FetchingStateService } from '../../services/fetching-state.service';
import { PlatformIconBgDirective } from '../../directives/platform-icon-bg.directive';
import { buildSocialProfileUrl } from '../../utils/profile-url.util';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
import { PlatformFeedViewBase } from '../../utils/platform-feed-view.base';
@Component({
    selector: 'app-summary-platform-view',
    standalone: true,
    imports: [CommonModule, SocialIconComponent, PlatformIconBgDirective],
    templateUrl: './summary-platform-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPlatformViewComponent extends PlatformFeedViewBase {
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
    public fetchingState = inject(FetchingStateService);
    public formatFollowers = formatFollowers;
    public formatKey = formatKey;
    constructor() {
        super();
        effect(() => {
            const p = this.platform();
            this.resetFeedState(p?.posts, p?.images, p?.followers_list, p?.following_list);
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
    getProfileDetailEntries(platform: PlatformResult | null): {
        key: string;
        value: any;
    }[] {
        return getProfileDetailEntries(platform);
    }
    getAccountUrl(platform: PlatformResult): string {
        return buildSocialProfileUrl(platform.platform, platform.username, platform.url);
    }
}
