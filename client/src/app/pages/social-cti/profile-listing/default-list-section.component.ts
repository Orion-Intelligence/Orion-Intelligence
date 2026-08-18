import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { social_profile } from '../models/social.models';
import { formatFollowers, formatKey } from '../../../shared/utils/formatters';
import { SocialIconComponent } from '../../../shared/partials/social-icon/social-icon.component';
import type { FetchTabKey } from '../enums/social-graph.enums';
import type { FeedUser, SocialPlatformCapabilityMap } from '../models/social-usability.models';
import { getMetadataEntries } from '../utils/summary-view.util';
import socialPlatformCapabilities from '../../../../assets/data/social-graph/platform-capabilities.json';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-social-default-list-section',
  templateUrl: './default-list-section.component.html',
  standalone: true,
  imports: [SocialIconComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialDefaultListSectionComponent {
  private readonly platformCapabilities = socialPlatformCapabilities as SocialPlatformCapabilityMap;

  user = input.required<FeedUser>();
  highlightedNodeId = input<string | null>(null);
  profileOverview = output<social_profile>();
  connectionsOverview = output<social_profile>();
  profileTab = output<{ platformData: social_profile; tabKey: FetchTabKey }>();
  copyValue = output<any>();
  readonly formatKey = formatKey;
  readonly missingStatValue = 'Not fetched';

  getPlatformCardId(platformData: social_profile): string {
    return `platform-${platformData.meta.username}|${platformData.meta.platform}|${platformData.meta.username}`;
  }

  getPlatformTrackKey(_index: number, platformData: social_profile): string {
    return this.getPlatformCardId(platformData);
  }

  isPriorityPlatform(platformName?: string): boolean {
    return !!platformName && !!this.platformCapabilities[platformName];
  }

  isFetchTabAllowed(platformData: social_profile, tabKey: FetchTabKey): boolean {
    const globalCapability = this.platformCapabilities['__all__'];
    const capability = this.platformCapabilities[platformData.meta.platform];
    if (globalCapability?.disallow?.includes(tabKey) || capability?.disallow?.includes(tabKey)) {
      return false;
    }
    if (tabKey === 'followers' || tabKey === 'following') {
      return this.isPriorityPlatform(platformData.meta.platform) || !!globalCapability?.allow?.includes(tabKey) || !!capability?.allow?.includes(tabKey);
    }
    if (tabKey === 'videos' || tabKey === 'shorts') {
      return !!globalCapability?.allow?.includes(tabKey) || !!capability?.allow?.includes(tabKey);
    }
    return true;
  }

  getFollowers(_platformData: social_profile): string[] {
    return [];
  }

  getFollowing(_platformData: social_profile): string[] {
    return [];
  }

  getFollowerPreview(platformData: social_profile): string[] {
    return this.getFollowers(platformData).slice(0, 3);
  }

  getFollowingPreview(platformData: social_profile): string[] {
    return this.getFollowing(platformData).slice(0, 3);
  }

  getProfileBio(platformData: social_profile): string {
    const details = (platformData.profile_details || {}) as any;
    return platformData.profile_details?.bio
      || details['m_content']
      || platformData.meta.description
      || '';
  }

  getPlatformTimestamp(platformData: social_profile): string {
    const metadata: Record<string, any> = {};
    const details = (platformData.profile_details || {}) as any;
    const timestamp = platformData.meta.timestamp || details['m_date'] || metadata['timestamp'] || metadata['Timestamp'] || metadata['m_date'];
    return timestamp ? String(timestamp) : '';
  }

  getProfileUrl(platformData: social_profile, username: string): string {
    return buildSocialProfileUrl(platformData.meta.platform, username, platformData.meta.url);
  }

  getFilteredMetadataEntries(_platformData: social_profile): { key: string; value: any; }[] {
    return getMetadataEntries({})
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

  getStatValue(platformData: social_profile, key: keyof NonNullable<social_profile['profile_details']>): string {
    const profileValue = platformData.profile_details?.[key];
    const metadataValue = undefined;
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

  private getFallbackStatValue(platformData: social_profile, key: keyof NonNullable<social_profile['profile_details']>): string | number | null {
    const metadata: Record<string, any> = {};
    switch (key) {
      case 'total_posts':
        return this.firstStatValue(metadata['totalPosts'], metadata['posts_count'], metadata['m_post_count'], this.getPostCollectionCount(platformData));
      case 'total_followers':
        return this.firstStatValue(Number(platformData.profile_details?.total_followers ?? 0), metadata['followers'], metadata['followers_count'], metadata['m_followers'], this.extractSocialCount(metadata['m_group_info']));
      case 'total_following':
        return this.firstStatValue(metadata['following'], metadata['following_count'], metadata['m_following']);
      case 'total_likes':
        return this.firstStatValue(metadata['totalLikes'], metadata['likes'], metadata['m_likes'], metadata['m_post_likes']);
      default:
        return null;
    }
  }

  private firstStatValue(...values: Array<string | number | null | undefined>): string | number | null {
    return values.find(value => value !== null && value !== undefined && value !== '') ?? null;
  }

  private getPostCollectionCount(_platformData: social_profile): number | null {
    return null;
  }

  private extractSocialCount(value: unknown): string | null {
    const text = typeof value === 'string' ? value : '';
    return text.match(/([\d,.]+[kmb]?)(?=\s*(subscribers|followers))/i)?.[1] ?? null;
  }
}
