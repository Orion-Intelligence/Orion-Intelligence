import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import { PlatformResult, SocialOnlinePresenceResult, SocialStealerLogRecord } from '../../../../../shared/model/social/social-scan.models';
import { formatKey, isImageUrl, isUrl } from '../../../../../shared/utils/formatters';
import { TooltipDirective } from '../../../../../shared/directive/tooltip-directive.directive';
import type { FeedUser, FetchTab, FetchTabKey, ImageCursorFetchRequest, PostCursorFetchRequest } from '../../models/social-graph.models';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
import { buildSocialProfileUrl } from '../../utils/profile-url.util';
import { SocialNormalizationUtil } from '../../utils/social-normalization.util';
import { normalizeRedditClearnetUrl } from '../../utils/reddit-url.util';
import { SocialProfilePostsSectionComponent } from '../profile-posts-section/profile-posts-section.component';
import { SocialProfileVideosSectionComponent } from '../profile-videos-section/profile-videos-section.component';
import { SocialProfileShortsSectionComponent } from '../profile-shorts-section/profile-shorts-section.component';
import { ExportChoiceModalComponent } from '../../../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { PROFILE_STEALERLOG_EXPORT_OPTIONS } from '../../../../../shared/model/report/export-choice.model';

@Component({
  selector: 'app-social-profile-tabs-section',
  templateUrl: './profile-tabs-section.component.html',
  standalone: true,
  imports: [TooltipDirective, SocialProfilePostsSectionComponent, SocialProfileVideosSectionComponent, SocialProfileShortsSectionComponent, ExportChoiceModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileTabsSectionComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly stealerLogExportColumns = [ 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
  private pendingImageScrollToBottom = false;
  private sawImageLoadingForScroll = false;
  private failedProfileImages = signal<Set<string>>(new Set<string>());

  user = input.required<FeedUser>();
  platformData = input.required<PlatformResult>();
  fetchTabs = input.required<FetchTab[]>();
  activeTab = input.required<FetchTabKey>();
  loadingStates = input<Partial<Record<FetchTabKey, boolean>>>({});
  onlinePresenceSearchTerm = input('');
  tabSelected = output<FetchTabKey>();
  refetchTab = output<FetchTabKey>();
  postCursorFetch = output<PostCursorFetchRequest>();
  imageCursorFetch = output<ImageCursorFetchRequest>();
  onlinePresenceSearchTermChanged = output<string>();
  onlinePresenceSearch = output<void>();
  readonly isUrl = isUrl;
  readonly isImageUrl = isImageUrl;
  readonly stealerLogExportOptions = PROFILE_STEALERLOG_EXPORT_OPTIONS;
  readonly selectedStealerLogPlatform = signal<PlatformResult | null>(null);

  constructor() {
    effect(() => {
      const loading = this.isTabLoading('images');
      this.platformData();
      if (!this.pendingImageScrollToBottom) {
        return;
      }
      if (loading) {
        this.sawImageLoadingForScroll = true;
        return;
      }
      if (!this.sawImageLoadingForScroll) {
        return;
      }
      this.pendingImageScrollToBottom = false;
      this.sawImageLoadingForScroll = false;
      setTimeout(() => this.scrollToImageBottom(), 0);
    });
  }

  getTabIcon(tab: FetchTab): string {
    if (tab.key === 'videos') {
      return 'bi bi-camera-video';
    }
    if (tab.key === 'shorts') {
      return 'bi bi-phone';
    }
    return tab.icon;
  }

  isTabLoading(tabKey: FetchTabKey): boolean {
    return !!this.loadingStates()[tabKey];
  }

  onOnlinePresenceInput(event: Event): void {
    this.onlinePresenceSearchTermChanged.emit((event.target as HTMLInputElement | null)?.value ?? '');
  }

  getProfileImageUrl(platformData: PlatformResult): string {
    return normalizeRedditClearnetUrl(this.getFirstMetadataValue(platformData, ['m_img_src', 'img_src', 'profile_image', 'profileImage', 'avatar', 'image']));
  }

  isProfileImageFailed(platformData: PlatformResult): boolean {
    const imageUrl = this.getProfileImageUrl(platformData);
    return !!imageUrl && this.failedProfileImages().has(imageUrl);
  }

  markProfileImageFailed(platformData: PlatformResult): void {
    const imageUrl = this.getProfileImageUrl(platformData);
    if (!imageUrl) {
      return;
    }
    this.failedProfileImages.update(current => {
      const next = new Set(current);
      next.add(imageUrl);
      return next;
    });
  }

  getCoverImageUrl(platformData: PlatformResult): string {
    return normalizeRedditClearnetUrl(this.getFirstMetadataValue(platformData, ['m_coverpage', 'coverpage', 'image_bg', 'cover_image', 'coverImage', 'banner', 'banner_image']));
  }

  getDisplayUrl(value: any): string {
    return normalizeRedditClearnetUrl(this.formatMetadataValue(value));
  }

  getSocialImageHref(image: { image_url?: string; thumbnail?: string } | null | undefined): string {
    return normalizeRedditClearnetUrl(image?.image_url || image?.thumbnail || '');
  }

  getSocialImageSrc(image: { image_url?: string; thumbnail?: string } | null | undefined): string {
    return normalizeRedditClearnetUrl(image?.thumbnail || image?.image_url || '');
  }

  getProfileDetailEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return getProfileDetailEntries(platformData);
  }

  formatProfileDetailKey(key: string): string {
    return formatKey(key.replace(/^m_/, ''));
  }

  formatMetadataValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      }
      catch {
        return String(value);
      }
    }
    return String(value);
  }

  copyToClipboard(text: any): void {
    void navigator.clipboard?.writeText(this.formatMetadataValue(text));
  }

  isNumeric(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    if (typeof value === 'number') {
      return true;
    }
    const s = String(value);
    return !isNaN(Number(s.replace(/,/g, ''))) && s.trim() !== '';
  }

  isBool(value: any): boolean {
    if (typeof value === 'boolean') {
      return true;
    }
    const s = String(value).toLowerCase().trim();
    return s === 'true' || s === 'false';
  }

  getFollowers(platformData: PlatformResult): string[] {
    return platformData.followers_list || [];
  }

  getFollowing(platformData: PlatformResult): string[] {
    return platformData.following_list || [];
  }

  getPostConnections(platformData: PlatformResult): string[] {
    return platformData.post_connections || [];
  }

  getOnlinePresence(platformData: PlatformResult): SocialOnlinePresenceResult | null {
    return platformData.onlinePresence || null;
  }

  getOnlinePresenceResults(platformData: PlatformResult): NonNullable<SocialOnlinePresenceResult['results']> {
    return platformData.onlinePresence?.results || [];
  }

  fetchImagesNew(platformData: PlatformResult): void {
    this.imageCursorFetch.emit({ platformData, mergeMode: 'prepend' });
  }

  loadMoreImages(platformData: PlatformResult): void {
    const imageCount = (platformData.images || []).length;
    this.prepareImageScrollAfterFetch();
    this.imageCursorFetch.emit({ platformData, limit: Math.min(imageCount + 10, 100), mergeMode: 'append' });
  }

  getStealerLogs(platformData: PlatformResult): SocialStealerLogRecord[] {
    return platformData.stealerLogs || [];
  }

  getPlatformStealerDomain(platformData: PlatformResult): string {
    const fromUrl = SocialNormalizationUtil.normalizeDomain(platformData.url);
    if (fromUrl) {
      return fromUrl;
    }
    const platform = (platformData.platform || '').toLowerCase();
    const platformDomains: Record<string, string> = {
      behance: 'behance.net',
      facebook: 'facebook.com',
      github: 'github.com',
      instagram: 'instagram.com',
      tiktok: 'tiktok.com',
      twitter: 'twitter.com',
      vimeo: 'vimeo.com',
      x: 'x.com',
      youtube: 'youtube.com'
    };
    return platformDomains[platform] || platform;
  }

  getStealerRecordHost(record: SocialStealerLogRecord): string {
    return SocialNormalizationUtil.firstValue(record?.['source_domain'], record?.['domain'], record?.['ip'], record?.['url'], record?.['host'], record?.['raw']) || '-';
  }

  getStealerRecordIdentity(record: SocialStealerLogRecord): string {
    return SocialNormalizationUtil.firstValue(record?.['email'], record?.['username'], record?.['user'], record?.['login'], record?.['credential'], record?.['raw']) || '-';
  }

  getStealerRecordDate(record: SocialStealerLogRecord): string {
    return SocialNormalizationUtil.firstValue(record?.['date'], record?.['timestamp'], record?.['created_at'], record?.['updated_at']) || '-';
  }

  getStealerRecordTrackKey(index: number, record: SocialStealerLogRecord): string {
    return `${this.getStealerRecordHost(record)}|${this.getStealerRecordIdentity(record)}|${this.getStealerRecordDate(record)}|${index}`;
  }

  openStealerLogExportChoice(event: Event, platformData: PlatformResult): void {
    event.stopPropagation();
    this.selectedStealerLogPlatform.set(platformData);
  }

  closeStealerLogExportChoice(): void {
    this.selectedStealerLogPlatform.set(null);
  }

  selectStealerLogExport(type: string): void {
    const platformData = this.selectedStealerLogPlatform();
    if (type === 'csv' && platformData) {
      this.downloadStealerLogs(platformData);
    }
    this.closeStealerLogExportChoice();
  }

  private downloadStealerLogs(platformData: PlatformResult): void {
    const rows = this.getStealerLogs(platformData).map((item, index) => ({
      recordType: 'stealer',
      recordIndex: String(index + 1),
      searchQuery: `${platformData.username || platformData.keyUsername} ${this.getPlatformStealerDomain(platformData)}`.trim(),
      email: SocialNormalizationUtil.toExportValue(item?.['email']),
      username: SocialNormalizationUtil.toExportValue(item?.['username']),
      domain: SocialNormalizationUtil.toExportValue(item?.['domain']),
      source: SocialNormalizationUtil.toExportValue(item?.['channel'] || item?.['filename'] || item?.['file']),
      hash: SocialNormalizationUtil.toExportValue(item?.['m_hash']),
      title: '-',
      url: '-',
      rank: '-',
      date: SocialNormalizationUtil.toExportValue(item?.['date']),
      team: '-',
      summary: '-'
    }));
    const csvLines = [
      this.stealerLogExportColumns.join(','),
      ...rows.map(row => this.stealerLogExportColumns.map(column => SocialNormalizationUtil.escapeCsvValue(row[column] ?? '-')).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stealerlogs_${SocialNormalizationUtil.normalizeDownloadName(platformData.username || platformData.keyUsername)}_${SocialNormalizationUtil.normalizeDownloadName(this.getPlatformStealerDomain(platformData))}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getProfileUrl(platformData: PlatformResult, username: string): string {
    if (platformData.resultSource === 'darkweb') {
      return platformData.url || '#';
    }
    return buildSocialProfileUrl(platformData.platform, username, platformData.url);
  }

  trackByKey(_index: number, item: { key: string }): string {
    return item.key;
  }

  trackByUsername(_index: number, username: string): string {
    return username;
  }

  private getFirstMetadataValue(platformData: PlatformResult, keys: string[]): string {
    const sources = [platformData.profileDetails, platformData.allMetadata];
    for (const source of sources) {
      const value = this.getFirstValueFromSource(source, keys);
      if (value) {
        return value;
      }
    }
    return '';
  }

  private getFirstValueFromSource(source: any, keys: string[]): string {
    if (!source) {
      return '';
    }
    if (Array.isArray(source)) {
      for (const item of source) {
        const value = this.getFirstValueFromSource(item, keys);
        if (value) {
          return value;
        }
      }
      return '';
    }
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return this.getFirstValueFromSource(source.result || source.profile || source.data, keys);
  }

  private prepareImageScrollAfterFetch(): void {
    this.pendingImageScrollToBottom = true;
    this.sawImageLoadingForScroll = false;
  }

  private scrollToImageBottom(): void {
    requestAnimationFrame(() => {
      const rows = this.elementRef.nativeElement.querySelectorAll('[data-testid="social-image-result"]') as NodeListOf<HTMLElement>;
      rows[rows.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }
}
