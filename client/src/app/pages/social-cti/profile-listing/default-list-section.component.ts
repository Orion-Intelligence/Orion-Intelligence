import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PlatformResult } from '../models/social-scan.models';
import { formatFollowers, formatKey } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/partials/social-icon/social-icon.component';
import type { FetchTabKey } from '../enums/social-graph.enums';
import type { FeedUser, SocialPlatformCapabilityMap } from '../models/social-graph.models';
import { getMetadataEntries } from '../utils/summary-view.util';
import socialPlatformCapabilities from '../../../../assets/data/social-graph/platform-capabilities.json';
import { buildSocialProfileUrl } from '../utils/profile-url.util';

@Component({
  selector: 'app-social-default-list-section',
  templateUrl: './default-list-section.component.html',
  standalone: true,
  imports: [SocialIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialDefaultListSectionComponent {
  private readonly platformCapabilities = socialPlatformCapabilities as SocialPlatformCapabilityMap;

  user = input.required<FeedUser>();
  highlightedNodeId = input<string | null>(null);
  profileOverview = output<PlatformResult>();
  connectionsOverview = output<PlatformResult>();
  profileTab = output<{ platformData: PlatformResult; tabKey: FetchTabKey }>();
  copyValue = output<any>();
  readonly formatKey = formatKey;
  readonly missingStatValue = 'Not fetched';

  getPlatformCardId(platformData: PlatformResult): string {
    return `platform-${platformData.keyUsername}|${platformData.platform}|${platformData.username}`;
  }

  getPlatformTrackKey(_index: number, platformData: PlatformResult): string {
    return this.getPlatformCardId(platformData);
  }

  isPriorityPlatform(platformName?: string): boolean {
    return !!platformName && !!this.platformCapabilities[platformName];
  }

  isFetchTabAllowed(platformData: PlatformResult, tabKey: FetchTabKey): boolean {
    const globalCapability = this.platformCapabilities['__all__'];
    const capability = this.platformCapabilities[platformData.platformKey || platformData.platform];
    if (globalCapability?.disallow?.includes(tabKey) || capability?.disallow?.includes(tabKey)) {
      return false;
    }
    if (tabKey === 'followers' || tabKey === 'following') {
      return this.isPriorityPlatform(platformData.platform) || !!globalCapability?.allow?.includes(tabKey) || !!capability?.allow?.includes(tabKey);
    }
    if (tabKey === 'videos' || tabKey === 'shorts') {
      return !!globalCapability?.allow?.includes(tabKey) || !!capability?.allow?.includes(tabKey);
    }
    return true;
  }

  getFollowers(platformData: PlatformResult): string[] {
    return platformData.followers_list || [];
  }

  getFollowing(platformData: PlatformResult): string[] {
    return platformData.following_list || [];
  }

  getFollowerPreview(platformData: PlatformResult): string[] {
    return this.getFollowers(platformData).slice(0, 3);
  }

  getFollowingPreview(platformData: PlatformResult): string[] {
    return this.getFollowing(platformData).slice(0, 3);
  }

  getProfileBio(platformData: PlatformResult): string {
    const details = (platformData.profileDetails || {}) as any;
    return platformData.profileDetails?.bio
      || details['m_content']
      || platformData.description
      || platformData.allMetadata?.['bio']
      || platformData.allMetadata?.['description']
      || platformData.allMetadata?.['m_content']
      || '';
  }

  getPlatformTimestamp(platformData: PlatformResult): string {
    const metadata = platformData.allMetadata || {};
    const details = (platformData.profileDetails || {}) as any;
    const timestamp = platformData.timestamp || details['m_date'] || metadata['timestamp'] || metadata['Timestamp'] || metadata['m_date'];
    return timestamp ? String(timestamp) : '';
  }

  getProfileUrl(platformData: PlatformResult, username: string): string {
    if (platformData.resultSource === 'darkweb') {
      return platformData.url || '#';
    }
    return buildSocialProfileUrl(platformData.platformKey || platformData.platform, username, platformData.url);
  }

  getFilteredMetadataEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return getMetadataEntries(platformData.allMetadata)
      .filter(entry => entry.key.toLowerCase().replace(/[\s_-]+/g, '') !== 'timestamp')
      .filter(entry => entry.value !== null && entry.value !== undefined && entry.value !== '')
      .filter(entry => typeof entry.value !== 'object');
  }

  formatMetadataValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  getStatValue(platformData: PlatformResult, key: keyof NonNullable<PlatformResult['profileDetails']>): string {
    const profileValue = platformData.profileDetails?.[key];
    const metadataValue = platformData.allMetadata?.[key as string];
    const rawValue = profileValue ?? metadataValue ?? this.getFallbackStatValue(platformData, key);
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return this.missingStatValue;
    }
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(String(rawValue).replace(/,/g, ''));
    return Number.isFinite(numericValue) ? formatFollowers(numericValue) : String(rawValue);
  }

  trackByKey(_index: number, item: { key: string }): string {
    return item.key;
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  private getFallbackStatValue(platformData: PlatformResult, key: keyof NonNullable<PlatformResult['profileDetails']>): string | number | null {
    const metadata = platformData.allMetadata || {};
    switch (key) {
      case 'total_posts':
        return this.firstStatValue(metadata['totalPosts'], metadata['posts_count'], metadata['m_post_count'], this.getPostCollectionCount(platformData));
      case 'total_followers':
        return this.firstStatValue(platformData.followers, metadata['followers'], metadata['followers_count'], metadata['m_followers'], this.extractSocialCount(metadata['m_group_info']));
      case 'total_following':
        return this.firstStatValue(metadata['following'], metadata['following_count'], metadata['m_following'], platformData.following_list?.length);
      case 'total_likes':
        return this.firstStatValue(metadata['totalLikes'], metadata['likes'], metadata['m_likes'], metadata['m_post_likes']);
      default:
        return null;
    }
  }

  private firstStatValue(...values: Array<string | number | null | undefined>): string | number | null {
    return values.find(value => value !== null && value !== undefined && value !== '') ?? null;
  }

  private getPostCollectionCount(platformData: PlatformResult): number | null {
    const items = [...(platformData.posts || []), ...(platformData.videos || []), ...(platformData.shorts || [])];
    return items.length ? new Set(items.map(item => item.hash_id || item.post_url || item.media_url || item.caption)).size : null;
  }

  private extractSocialCount(value: unknown): string | null {
    const text = typeof value === 'string' ? value : '';
    return text.match(/([\d,.]+[kmb]?)(?=\s*(subscribers|followers))/i)?.[1] ?? null;
  }
}
