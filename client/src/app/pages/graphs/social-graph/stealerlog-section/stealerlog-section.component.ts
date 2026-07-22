import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { SocialService } from '../services/social.service';
import { SocialNormalizationUtil } from '../utils/social-normalization.util';

@Component({
  selector: 'app-social-stealerlog-section',
  standalone: true,
  templateUrl: './stealerlog-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StealerlogSectionComponent {
  private readonly exportCsvColumns = [ 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
  private readonly state = inject(SocialService);
  private requestId = 0;

  username = input.required<string>();
  platforms = input<PlatformResult[]>([]);
  records = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
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

  downloadRecords(event: Event): void {
    event.stopPropagation();
    const rows = this.records().map((item, index) => ({
      recordType: 'stealer',
      recordIndex: String(index + 1),
      searchQuery: this.searchIdentity() || '-',
      email: SocialNormalizationUtil.toExportValue(item?.['email'] || item?.['m_email']),
      username: SocialNormalizationUtil.toExportValue(item?.['username'] || item?.['m_username']),
      domain: SocialNormalizationUtil.toExportValue(item?.['domain'] || item?.['m_domain']),
      source: SocialNormalizationUtil.toExportValue(item?.['channel'] || item?.['filename'] || item?.['file'] || item?.['m_source'] || item?.['m_scrap_file']),
      hash: SocialNormalizationUtil.toExportValue(item?.['m_hash']),
      title: '-',
      url: SocialNormalizationUtil.toExportValue(item?.['url'] || item?.['m_url']),
      rank: '-',
      date: SocialNormalizationUtil.toExportValue(item?.['date'] || item?.['m_date']),
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
    return SocialNormalizationUtil.firstValue(record?.source_domain, record?.m_source_domain, record?.domain, record?.m_domain, record?.ip, record?.m_ip, record?.url, record?.m_url, record?.host, record?.m_host, record?.raw) || '-';
  }

  getRecordIdentity(record: any): string {
    return SocialNormalizationUtil.firstValue(record?.email, record?.m_email, record?.username, record?.m_username, record?.user, record?.m_user, record?.login, record?.m_login, record?.credential, record?.m_credential, record?.raw) || '-';
  }

  getRecordDate(record: any): string {
    return SocialNormalizationUtil.firstValue(record?.date, record?.m_date, record?.timestamp, record?.m_timestamp, record?.created_at, record?.m_created_at, record?.updated_at, record?.m_updated_at) || '';
  }
}
