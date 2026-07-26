import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { SocialService } from '../services/social.service';
import { SocialNormalizationUtil } from '../utils/social-normalization.util';
import { ExportBrandingService } from '../../../../shared/services/export/export-branding.service';
import { ExportChoiceModalComponent } from '../../../../shared/partials/export-choice-modal/export-choice-modal.component';
import { STEALERLOG_EXPORT_OPTIONS } from '../../../../shared/model/report/export-choice.model';

@Component({
  selector: 'app-social-stealerlog-section',
  standalone: true,
  imports: [ExportChoiceModalComponent],
  templateUrl: './stealerlog-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StealerlogSectionComponent {
  private readonly exportCsvColumns = [ 'tenant_name', 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
  private readonly state = inject(SocialService);
  private readonly exportBranding = inject(ExportBrandingService);
  private requestId = 0;

  username = input.required<string>();
  platforms = input<PlatformResult[]>([]);
  records = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  isExportChoiceOpen = signal(false);
  readonly reportExportOptions = STEALERLOG_EXPORT_OPTIONS;
  searchIdentity = computed(() => SocialNormalizationUtil.normalizeIdentity(this.username()));
  hasRecords = computed(() => this.records().length > 0);
  visibleRecords = computed(() => this.records().slice(0, 3));
  darkwebPresence = computed(() => {
    const identity = SocialNormalizationUtil.normalizeUsername(this.searchIdentity());
    if (!identity) {
      return [];
    }
    return this.platforms().filter(platform => {
      const commenters = SocialNormalizationUtil.expandRecordValue(platform?.allMetadata?.['commenters']);
      return platform?.resultSource === 'darkweb'
        && commenters.some(commenter => SocialNormalizationUtil.normalizeUsername(commenter) === identity);
    });
  });
  hasDarkwebPresence = computed(() => this.darkwebPresence().length > 0);
  displayIdentity = computed(() => {
    const identity = this.searchIdentity();
    return identity ? `@${identity}` : 'No username';
  });

  constructor() {
    effect((onCleanup) => {
      const identity = this.searchIdentity();
      const currentRequestId = ++this.requestId;
      let subscription: Subscription | null = null;

      this.records.set([]);
      this.errorMessage.set('');

      if (!identity) {
        this.isLoading.set(false);
        return;
      }

      this.isLoading.set(true);
      subscription = this.state.fetchStealerLogsByIdentity(identity).subscribe({
        next: (records) => {
          if (currentRequestId !== this.requestId) {
            return;
          }
          const relatedRecords = Array.isArray(records)
            ? records.filter(record => SocialNormalizationUtil.recordMatchesIdentity(record, identity))
            : [];
          this.records.set(relatedRecords);
          this.isLoading.set(false);
        },
        error: () => {
          if (currentRequestId !== this.requestId) {
            return;
          }
          this.records.set([]);
          this.errorMessage.set('Could not check stealer logs.');
          this.isLoading.set(false);
        }
      });

      onCleanup(() => subscription?.unsubscribe());
    });
  }

  openExportChoice(event: Event): void {
    event.stopPropagation();
    this.isExportChoiceOpen.set(true);
  }

  closeExportChoice(): void {
    this.isExportChoiceOpen.set(false);
  }

  selectExport(type: string): void {
    if (type === 'csv') {
      this.downloadRecords();
    }
    this.closeExportChoice();
  }

  private downloadRecords(): void {
    const rows = this.records().map((item, index) => ({
      tenant_name: this.exportBranding.getTenantName(),
      recordType: 'stealer',
      recordIndex: String(index + 1),
      searchQuery: this.searchIdentity() || '-',
      email: SocialNormalizationUtil.toExportValue(item?.['email']),
      username: SocialNormalizationUtil.toExportValue(item?.['username']),
      domain: SocialNormalizationUtil.toExportValue(item?.['domain']),
      source: String(this.exportBranding.replaceSystemBrand(SocialNormalizationUtil.toExportValue(item?.['channel'] || item?.['filename'] || item?.['file']))),
      hash: SocialNormalizationUtil.toExportValue(item?.['m_hash']),
      title: '-',
      url: '-',
      rank: '-',
      date: SocialNormalizationUtil.toExportValue(item?.['date']),
      team: '-',
      summary: '-'
    }));
    const csvLines = [
      this.exportCsvColumns.join(','),
      ...rows.map(row => this.exportCsvColumns.map(column => SocialNormalizationUtil.escapeCsvValue(row[column] ?? '-')).join(','))
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stealerlogs_${this.searchIdentity() || 'username'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  getRecordTrackKey(index: number, record: any): string {
    return `${this.getRecordHost(record)}|${this.getRecordIdentity(record)}|${this.getRecordDate(record)}|${index}`;
  }

  getRecordHost(record: any): string {
    return SocialNormalizationUtil.firstValue(record?.source_domain, record?.domain, record?.ip, record?.url, record?.host, record?.raw) || '-';
  }

  getRecordIdentity(record: any): string {
    return SocialNormalizationUtil.firstValue(record?.email, record?.username, record?.user, record?.login, record?.credential, record?.raw) || '-';
  }

  getRecordDate(record: any): string {
    return SocialNormalizationUtil.firstValue(record?.date, record?.timestamp, record?.created_at, record?.updated_at) || '';
  }
}
