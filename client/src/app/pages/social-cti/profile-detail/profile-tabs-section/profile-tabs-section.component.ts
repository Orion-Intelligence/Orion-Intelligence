import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { PlatformResult, SocialOnlinePresenceResult, SocialStealerLogRecord } from '../../models/social-scan.models';
import { formatKey, isImageUrl, isUrl } from '../../../../shared/utils/formatters';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import type { FetchTabKey } from '../../enums/social-graph.enums';
import type { FeedUser, FetchTab, PostCursorFetchRequest } from '../../models/social-graph.models';
import { getProfileDetailEntries } from '../../utils/summary-view.util';
import { buildSocialProfileUrl } from '../../utils/profile-url.util';
import { applyImageFallback } from '../../utils/image-fallback.util';
import { SocialProfilePostsSectionComponent } from '../profile-posts-section/profile-posts-section.component';
import { SocialProfileVideosSectionComponent } from '../profile-videos-section/profile-videos-section.component';
import { SocialProfileShortsSectionComponent } from '../profile-shorts-section/profile-shorts-section.component';
import { ExportBrandingService } from '../../../../shared/services/export/export-branding.service';
import { ExportChoiceModalComponent } from '../../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { PROFILE_STEALERLOG_EXPORT_OPTIONS } from '../../../../shared/model/report/export-choice.model';
import { ReportExportService } from '../../../../shared/services/report-export.service';
import { GraphReportPayload } from '../../../../shared/model/report/report-export.model';

@Component({
  selector: 'app-social-profile-tabs-section',
  templateUrl: './profile-tabs-section.component.html',
  standalone: true,
  imports: [TooltipDirective, SocialProfilePostsSectionComponent, SocialProfileVideosSectionComponent, SocialProfileShortsSectionComponent, ExportChoiceModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileTabsSectionComponent {
  private readonly exportBranding = inject(ExportBrandingService);
  private readonly reportExportService = inject(ReportExportService);
  private readonly stealerLogExportColumns = [ 'tenant_name', 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
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
  onlinePresenceSearchTermChanged = output<string>();
  onlinePresenceSearch = output<void>();
  readonly isUrl = isUrl;
  readonly onImageError = applyImageFallback;
  readonly isImageUrl = isImageUrl;
  readonly formatKey = formatKey;
  readonly stealerLogExportOptions = PROFILE_STEALERLOG_EXPORT_OPTIONS;
  readonly selectedStealerLogPlatform = signal<PlatformResult | null>(null);

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
    return this.getFirstMetadataValue(platformData, ['m_img_src', 'img_src', 'profile_image', 'profileImage', 'avatar', 'image']);
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
    return this.getFirstMetadataValue(platformData, ['m_coverpage', 'coverpage', 'image_bg', 'cover_image', 'coverImage', 'banner', 'banner_image']);
  }

  getDisplayUrl(value: any): string {
    return this.formatMetadataValue(value);
  }

  getDisplayImageUrl(value: any): string {
    const url = this.getDisplayUrl(value);
    return this.isBlockedInstagramProfileImageUrl(url) ? '' : url;
  }

  getSocialImageHref(image: { image_url?: string; thumbnail?: string } | null | undefined): string {
    return image?.image_url || image?.thumbnail || '';
  }

  getSocialImageSrc(image: { image_url?: string; thumbnail?: string } | null | undefined): string {
    const url = image?.thumbnail || image?.image_url || '';
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

  getVisibleProfileDetailEntries(platformData: PlatformResult): { key: string; value: any; }[] {
    return this.getProfileDetailEntries(platformData).filter(item => !['img_src', 'm_img_src'].includes(item.key.toLowerCase()));
  }

  formatProfileDetailKey(key: string): string {
    return formatKey(key.replace(/^m_/, ''));
  }

  formatMetadataValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.map(entry => this.formatMetadataValue(entry)).filter(entry => entry !== '').join(', ');
    }
    if (typeof value === 'object') {
      if (typeof value['is_hate_speech'] === 'boolean') {
        return value['is_hate_speech'] ? 'Yes' : 'No';
      }
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

  getStealerLogs(platformData: PlatformResult): SocialStealerLogRecord[] {
    return platformData.stealerLogs || [];
  }

  getPlatformStealerDomain(platformData: PlatformResult): string {
    return platformData.url || platformData.platform;
  }

  getStealerRecordHost(record: SocialStealerLogRecord): string {
    return record?.['source_domain'] || record?.['m_source_domain'] || record?.['domain'] || record?.['m_domain'] || record?.['ip'] || record?.['m_ip'] || record?.['url'] || record?.['m_url'] || record?.['host'] || record?.['m_host'] || record?.['raw'] || '-';
  }

  getStealerRecordIdentity(record: SocialStealerLogRecord): string {
    return record?.['email'] || record?.['m_email'] || record?.['username'] || record?.['m_username'] || record?.['user'] || record?.['m_user'] || record?.['login'] || record?.['m_login'] || record?.['credential'] || record?.['m_credential'] || record?.['raw'] || '-';
  }

  getStealerRecordDate(record: SocialStealerLogRecord): string {
    return record?.['date'] || record?.['m_date'] || record?.['timestamp'] || record?.['m_timestamp'] || record?.['created_at'] || record?.['m_created_at'] || record?.['updated_at'] || record?.['m_updated_at'] || '-';
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
    if ((type === 'csv' || type === 'json' || type === 'report') && platformData) {
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
      email: String(item?.['email'] || item?.['m_email'] || '-'),
      username: String(item?.['username'] || item?.['m_username'] || '-'),
      domain: String(item?.['domain'] || item?.['m_domain'] || '-'),
      source: String(this.exportBranding.replaceSystemBrand(String(item?.['channel'] || item?.['filename'] || item?.['file'] || item?.['m_source'] || item?.['m_scrap_file'] || '-'))),
      hash: String(item?.['m_hash'] || '-'),
      title: '-',
      url: String(item?.['url'] || item?.['m_url'] || '-'),
      rank: '-',
      date: String(item?.['date'] || item?.['m_date'] || '-'),
      team: '-',
      summary: '-'
    }));
  }

  private exportStealerLogs(platformData: PlatformResult, type: 'csv' | 'json' | 'report'): void {
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
    this.reportExportService.exportByType(payload, type === 'report' ? 'doc_pdf' : type);
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

}
