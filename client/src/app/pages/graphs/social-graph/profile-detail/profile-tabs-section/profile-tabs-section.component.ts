import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output, signal } from '@angular/core';
import { PlatformResult, SocialExtensionFetchError, SocialImage, SocialOnlinePresenceResult, SocialPost, SocialStealerLogRecord } from '../../../../../shared/model/social/social-scan.models';
import { formatKey, isImageUrl, isUrl } from '../../../../../shared/utils/formatters';
import { TooltipDirective } from '../../../../../shared/directive/tooltip-directive.directive';
import type { FeedUser, FetchTab, FetchTabKey, ImageCursorFetchRequest, PostContentTabKey, PostCursorFetchRequest, SocialExtensionStatus } from '../../models/social-graph.models';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
import { buildSocialProfileUrl } from '../../utils/profile-url.util';
import { SocialNormalizationUtil } from '../../utils/social-normalization.util';
import { normalizeRedditClearnetUrl } from '../../utils/reddit-url.util';
import { SocialService } from '../../services/social.service';
import { SocialProfilePostsSectionComponent } from '../profile-posts-section/profile-posts-section.component';
import { SocialProfileVideosSectionComponent } from '../profile-videos-section/profile-videos-section.component';
import { SocialProfileShortsSectionComponent } from '../profile-shorts-section/profile-shorts-section.component';
import { ExportBrandingService } from '../../../../../shared/services/export/export-branding.service';
import { ExportChoiceModalComponent } from '../../../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { PROFILE_STEALERLOG_EXPORT_OPTIONS } from '../../../../../shared/model/report/export-choice.model';
import { ReportExportService } from '../../../../../shared/services/report-export.service';
import { GraphReportPayload } from '../../../../../shared/model/report/report-export.model';

@Component({
  selector: 'app-social-profile-tabs-section',
  templateUrl: './profile-tabs-section.component.html',
  standalone: true,
  imports: [TooltipDirective, SocialProfilePostsSectionComponent, SocialProfileVideosSectionComponent, SocialProfileShortsSectionComponent, ExportChoiceModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileTabsSectionComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly socialService = inject(SocialService);
  private readonly exportBranding = inject(ExportBrandingService);
  private readonly reportExportService = inject(ReportExportService);
  private readonly stealerLogExportColumns = [ 'tenant_name', 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
  private pendingImageScrollToBottom = false;
  private sawImageLoadingForScroll = false;
  private loadedExtensionStatus = false;
  private failedProfileImages = signal<Set<string>>(new Set<string>());
  private readonly extensionPostPageSize = 5;

  extensionStatus = signal<SocialExtensionStatus | null>(null);
  extensionStatusLoading = signal(false);
  extensionStatusError = signal('');
  user = input.required<FeedUser>();
  platformData = input.required<PlatformResult>();
  fetchTabs = input.required<FetchTab[]>();
  activeTab = input.required<FetchTabKey>();
  extensionStatusData = input<SocialExtensionStatus | null>(null);
  loadingStates = input<Partial<Record<FetchTabKey, boolean>>>({});
  onlinePresenceSearchTerm = input('');
  tabSelected = output<FetchTabKey>();
  refetchTab = output<FetchTabKey>();
  postCursorFetch = output<PostCursorFetchRequest>();
  extensionPostCursorFetch = output<PostCursorFetchRequest>();
  extensionStatusRefreshed = output<SocialExtensionStatus>();
  imageCursorFetch = output<ImageCursorFetchRequest>();
  onlinePresenceSearchTermChanged = output<string>();
  onlinePresenceSearch = output<void>();
  readonly isUrl = isUrl;
  readonly isImageUrl = isImageUrl;
  readonly formatKey = formatKey;
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
    effect(() => {
      const platformData = this.platformData();
      const shouldLoadStatus = this.activeTab().startsWith('extension')
        || (this.activeTab() === 'posts' && this.isKnownExtensionPlatform(this.normalizeExtensionPlatform(platformData.platform)));
      if (!shouldLoadStatus || this.loadedExtensionStatus || this.extensionStatusData()) {
        return;
      }
      queueMicrotask(() => this.refreshExtensionStatus());
    });
  }

  getTabIcon(tab: FetchTab): string {
    if (tab.key === 'videos') {
      return 'bi bi-camera-video';
    }
    if (tab.key === 'shorts') {
      return 'bi bi-phone';
    }
    if (tab.key.startsWith('extension')) {
      return 'bi bi-plugin';
    }
    return tab.icon;
  }

  isTabLoading(tabKey: FetchTabKey): boolean {
    return !!this.loadingStates()[tabKey];
  }

  isAnyExtensionLoading(): boolean {
    return !!(this.loadingStates().extensionDetails
      || this.loadingStates().extensionPosts
      || this.loadingStates().extensionShorts);
  }

  refreshExtensionStatus(): void {
    this.loadedExtensionStatus = true;
    this.extensionStatusLoading.set(true);
    this.extensionStatusError.set('');
    this.socialService.fetchExtensionStatus().subscribe({
      next: status => {
        this.extensionStatus.set(status);
        this.extensionStatusRefreshed.emit(status);
        this.extensionStatusError.set(this.formatExtensionStatusError(status));
        this.extensionStatusLoading.set(false);
      },
      error: () => {
        const fallbackStatus = { online: 0, extensions: [] };
        this.extensionStatus.set(fallbackStatus);
        this.extensionStatusRefreshed.emit(fallbackStatus);
        this.extensionStatusError.set('Unable to reach the extension manager.');
        this.extensionStatusLoading.set(false);
      }
    });
  }

  getExtensionPlatformStatus(platformData: PlatformResult): 'ready' | 'offline' | 'unsupported' {
    const platform = this.normalizeExtensionPlatform(platformData.platform);
    if (!this.isKnownExtensionPlatform(platform)) {
      return 'unsupported';
    }
    return this.hasReadyExtension(platformData) ? 'ready' : 'offline';
  }

  getExtensionStatusLabel(platformData: PlatformResult): string {
    const state = this.getExtensionPlatformStatus(platformData);
    if (state === 'ready') {
      return 'Extension ready';
    }
    if (state === 'offline') {
      return 'Extension offline';
    }
    return 'Legacy executor';
  }

  getExtensionStatusDescription(platformData: PlatformResult): string {
    const state = this.getExtensionPlatformStatus(platformData);
    if (state === 'ready') {
      return 'Supported jobs for this profile can run through the connected browser extension.';
    }
    if (state === 'offline') {
      return 'This platform is extension-capable, but no matching extension is online. Orion will use legacy fallback when enabled.';
    }
    return 'This platform is not configured for extension execution yet. Orion will use the existing backend executor.';
  }

  getExtensionIds(status: SocialExtensionStatus | null): string {
    const ids = (status?.extensions || []).map(extension => extension.extension_id).filter(Boolean);
    return ids.length ? ids.join(', ') : 'none';
  }

  getExtensionPlatformList(status: SocialExtensionStatus | null): string {
    const platforms = new Set<string>();
    for (const extension of status?.extensions || []) {
      for (const platform of extension.platforms || []) {
        platforms.add(platform);
      }
    }
    return platforms.size ? Array.from(platforms).sort().join(', ') : 'none';
  }

  getActiveExtensionJob(status: SocialExtensionStatus | null): string {
    const job = (status?.extensions || []).map(extension => extension.active_job_id).find(Boolean);
    return job || 'none';
  }

  getExtensionBackendUrl(status: SocialExtensionStatus | null): string {
    return status?.backend_url || 'not reached';
  }

  currentExtensionStatus(): SocialExtensionStatus | null {
    return this.extensionStatus() ?? this.extensionStatusData();
  }

  isExtensionPostExecutorReady(platformData: PlatformResult): boolean {
    return this.hasReadyExtension(platformData, 'posts');
  }

  getPostsTabPlatformData(platformData: PlatformResult): PlatformResult {
    return this.isExtensionPostExecutorReady(platformData) ? this.getExtensionPlatformData(platformData) : platformData;
  }

  isPostsTabLoading(platformData: PlatformResult): boolean {
    return this.isExtensionPostExecutorReady(platformData)
      ? this.isTabLoading('extensionPosts')
      : this.isTabLoading('posts');
  }

  handlePostsTabRefetch(tabKey: PostContentTabKey): void {
    const platformData = this.platformData();
    if (this.isExtensionPostExecutorReady(platformData)) {
      this.extensionPostCursorFetch.emit({ platformData, tabKey, limit: 20, mergeMode: 'prepend', remoteFetch: true });
      return;
    }
    this.refetchTab.emit(tabKey);
  }

  handlePostsTabCursorFetch(request: PostCursorFetchRequest): void {
    const platformData = this.platformData();
    if (this.isExtensionPostExecutorReady(platformData)) {
      this.handleExtensionPostCursorFetch({ ...request, platformData });
      return;
    }
    this.postCursorFetch.emit(request);
  }

  private formatExtensionStatusError(status: SocialExtensionStatus | null): string {
    const detail = status?.detail;
    const error = status?.error;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (detail && typeof detail === 'object') {
      return JSON.stringify(detail);
    }
    if (typeof error === 'string' && error.trim()) {
      return error;
    }
    return '';
  }

  private normalizeExtensionPlatform(platform: string): string {
    const value = (platform || '').toLowerCase();
    return value === 'twitter' ? 'x' : value;
  }

  private isKnownExtensionPlatform(platform: string): boolean {
    return ['reddit', 'github', 'linkedin', 'x', 'instagram', 'facebook', 'youtube', 'tiktok'].includes(platform);
  }

  private hasReadyExtension(platformData: PlatformResult, command?: string): boolean {
    const status = this.currentExtensionStatus();
    if (!status?.online) {
      return false;
    }
    const platform = this.normalizeExtensionPlatform(platformData.platform);
    return (status.extensions || []).some(extension => {
      const isOnline = !extension.status || extension.status === 'online';
      const platforms = extension.platforms || [];
      const commands = extension.commands || [];
      return isOnline
        && platforms.includes(platform)
        && (!command || commands.length === 0 || commands.includes(command));
    });
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

  getDisplayImageUrl(value: any): string {
    const url = this.getDisplayUrl(value);
    return this.isBlockedInstagramProfileImageUrl(url) ? '' : url;
  }

  getSocialImageHref(image: { image_url?: string; thumbnail?: string } | null | undefined): string {
    return normalizeRedditClearnetUrl(image?.image_url || image?.thumbnail || '');
  }

  getSocialImageSrc(image: { image_url?: string; thumbnail?: string } | null | undefined): string {
    const url = normalizeRedditClearnetUrl(image?.thumbnail || image?.image_url || '');
    return this.isBlockedInstagramProfileImageUrl(url) ? '' : url;
  }

  getDisplayableSocialImages<T extends { image_url?: string; thumbnail?: string }>(images: T[] | null | undefined): T[] {
    return (images || []).filter(image => !!this.getSocialImageSrc(image));
  }

  private isBlockedInstagramProfileImageUrl(url: string): boolean {
    return /\/t51\.[^/]+-19\//i.test(url)
      || /[?&]efg=[^&]*profile/i.test(url)
      || /profile_pic/i.test(url);
  }

  getProfileDetailEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return getProfileDetailEntries(platformData);
  }

  getExtensionPlatformData(platformData: PlatformResult): PlatformResult {
    return {
      ...platformData,
      profileDetails: platformData.extensionProfileDetails ?? null,
      posts: platformData.extensionPosts ?? null,
      videos: platformData.extensionVideos ?? null,
      shorts: this.getExtensionShortsWithImages(platformData),
      images: platformData.extensionImages ?? null,
      followers_list: platformData.extensionFollowers ?? null,
      following_list: platformData.extensionFollowing ?? null,
    };
  }

  private getExtensionShortsWithImages(platformData: PlatformResult): SocialPost[] | null {
    const shorts = platformData.extensionShorts;
    if (!shorts || platformData.platform.toLowerCase() !== 'tiktok') {
      return shorts ?? null;
    }

    const images = platformData.extensionImages || [];
    return shorts.map((short, index) => {
      if (short.media_url) {
        return short;
      }
      const image = this.findShortImage(short, images) || images[index];
      const mediaUrl = image?.thumbnail || image?.image_url || '';
      return mediaUrl ? { ...short, media_url: mediaUrl, media_type: 'image' } : short;
    });
  }

  private findShortImage(short: SocialPost, images: SocialImage[]): SocialImage | undefined {
    const postUrl = this.normalizeMatchValue(short.post_url);
    const caption = this.normalizeMatchValue(short.caption);
    return images.find(image => postUrl && this.normalizeMatchValue(image.source_url) === postUrl)
      || images.find(image => caption && this.normalizeMatchValue(image.title) === caption);
  }

  private normalizeMatchValue(value: string | null | undefined): string {
    return String(value || '').trim().replace(/\/$/, '').toLowerCase();
  }

  handleExtensionPostCursorFetch(request: PostCursorFetchRequest): void {
    if (request.commentsOnly) {
      this.extensionPostCursorFetch.emit(request);
      return;
    }
    const platformData = this.platformData();
    if (request.mergeMode === 'prepend') {
      this.extensionPostCursorFetch.emit({
        ...request,
        platformData,
        limit: request.limit || 20,
        mergeMode: 'prepend',
        remoteFetch: true,
      });
      return;
    }
    this.extensionPostCursorFetch.emit({
      ...request,
      platformData,
      limit: request.limit || this.extensionPostPageSize,
      mergeMode: 'append',
      remoteFetch: true,
    });
  }

  getExtensionError(platformData: PlatformResult): SocialExtensionFetchError | null {
    return platformData.extensionError ?? null;
  }

  getExtensionErrorTitle(platformData: PlatformResult): string {
    const error = this.getExtensionError(platformData);
    if (error?.error_code === 'AUTH_EXPIRED') {
      return 'Extension session expired';
    }
    return error?.error_code === 'AUTH_REQUIRED' ? 'Browser login required' : 'Extension job failed';
  }

  getExtensionErrorMessage(platformData: PlatformResult): string {
    const error = this.getExtensionError(platformData);
    if (!error) {
      return '';
    }
    if (error.error_code === 'AUTH_EXPIRED') {
      return error.message || 'The browser extension session expired while scraping. Log in to the extension again and retry.';
    }
    return error.message || 'The browser extension could not complete this request.';
  }

  getExtensionLoginUrl(platformData: PlatformResult): string {
    const error = this.getExtensionError(platformData);
    const url = error?.login_url || '';
    return isUrl(url) && this.isPlatformLoginUrl(url, error?.platform || platformData.platform) ? url : '';
  }

  private isPlatformLoginUrl(url: string, platform: string | null | undefined): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const allowedHosts: Record<string, string[]> = {
        instagram: ['instagram.com'],
        facebook: ['facebook.com'],
        x: ['x.com', 'twitter.com'],
        twitter: ['x.com', 'twitter.com'],
        linkedin: ['linkedin.com'],
        reddit: ['reddit.com'],
        github: ['github.com'],
        tiktok: ['tiktok.com'],
      };
      const hosts = allowedHosts[this.normalizeExtensionPlatform(platform || '')] || [];
      return hosts.length > 0 && hosts.some(host => hostname === host || hostname.endsWith(`.${host}`));
    }
    catch {
      return false;
    }
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
    return SocialNormalizationUtil.firstValue(record?.['source_domain'], record?.['m_source_domain'], record?.['domain'], record?.['m_domain'], record?.['ip'], record?.['m_ip'], record?.['url'], record?.['m_url'], record?.['host'], record?.['m_host'], record?.['raw']) || '-';
  }

  getStealerRecordIdentity(record: SocialStealerLogRecord): string {
    return SocialNormalizationUtil.firstValue(record?.['email'], record?.['m_email'], record?.['username'], record?.['m_username'], record?.['user'], record?.['m_user'], record?.['login'], record?.['m_login'], record?.['credential'], record?.['m_credential'], record?.['raw']) || '-';
  }

  getStealerRecordDate(record: SocialStealerLogRecord): string {
    return SocialNormalizationUtil.firstValue(record?.['date'], record?.['m_date'], record?.['timestamp'], record?.['m_timestamp'], record?.['created_at'], record?.['m_created_at'], record?.['updated_at'], record?.['m_updated_at']) || '-';
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
    else if ((type === 'json' || type === 'report') && platformData) {
      this.exportStealerLogs(platformData, type);
    }
    this.closeStealerLogExportChoice();
  }

  private buildStealerLogRows(platformData: PlatformResult): Record<string, string>[] {
    return this.getStealerLogs(platformData).map((item, index) => ({
      tenant_name: this.exportBranding.getTenantName(),
      recordType: 'stealer',
      recordIndex: String(index + 1),
      searchQuery: `${platformData.username || platformData.keyUsername} ${this.getPlatformStealerDomain(platformData)}`.trim(),
      email: SocialNormalizationUtil.toExportValue(item?.['email'] || item?.['m_email']),
      username: SocialNormalizationUtil.toExportValue(item?.['username'] || item?.['m_username']),
      domain: SocialNormalizationUtil.toExportValue(item?.['domain'] || item?.['m_domain']),
      source: String(this.exportBranding.replaceSystemBrand(SocialNormalizationUtil.toExportValue(item?.['channel'] || item?.['filename'] || item?.['file'] || item?.['m_source'] || item?.['m_scrap_file']))),      hash: SocialNormalizationUtil.toExportValue(item?.['m_hash']),
      title: '-',
      url: SocialNormalizationUtil.toExportValue(item?.['url'] || item?.['m_url']),
      rank: '-',
      date: SocialNormalizationUtil.toExportValue(item?.['date'] || item?.['m_date']),
      team: '-',
      summary: '-'
    }));
  }

  private downloadStealerLogs(platformData: PlatformResult): void {
    const rows = this.buildStealerLogRows(platformData);
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

  private exportStealerLogs(platformData: PlatformResult, type: 'json' | 'report'): void {
    const rows = this.buildStealerLogRows(platformData);
    const query = `${platformData.username || platformData.keyUsername} ${this.getPlatformStealerDomain(platformData)}`.trim();
    const payload: GraphReportPayload = {
      graphKind: 'social',
      title: 'Stealer Logs Export',
      sessionName: query || 'profile-stealerlogs',
      generatedAtIso: new Date().toISOString(),
      nodes: [],
      edges: [],
      summary: {
        search_query: query || '-',
        total_records: rows.length
      },
      tables: [{ title: 'Stealer Logs', values: {}, columns: [...this.stealerLogExportColumns], rows }]
    };
    this.reportExportService.exportByType(payload, type === 'json' ? 'json' : 'doc_pdf');
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
