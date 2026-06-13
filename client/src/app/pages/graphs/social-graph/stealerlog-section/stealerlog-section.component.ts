import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocialScanService } from '../../shared/services/social-scan.service';

@Component({
  selector: 'app-social-stealerlog-section',
  standalone: true,
  templateUrl: './stealerlog-section.component.html',
  styleUrls: ['./stealerlog-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StealerlogSectionComponent {
  private readonly exportCsvColumns = [ 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary' ] as const;
  private readonly scanService = inject(SocialScanService);
  private requestId = 0;

  username = input.required<string>();
  records = signal<any[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchIdentity = computed(() => this.normalizeIdentity(this.username()));
  hasRecords = computed(() => this.records().length > 0);
  visibleRecords = computed(() => this.records().slice(0, 3));
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
      subscription = this.scanService.fetchStealerLogsByIdentity(identity).subscribe({
        next: (records) => {
          if (currentRequestId !== this.requestId) {
            return;
          }
          const relatedRecords = Array.isArray(records)
            ? records.filter(record => this.recordMatchesIdentity(record, identity))
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
      email: this.toExportValue(item?.['email']),
      username: this.toExportValue(item?.['username']),
      domain: this.toExportValue(item?.['domain']),
      source: this.toExportValue(item?.['channel'] || item?.['filename'] || item?.['file']),
      hash: this.toExportValue(item?.['m_hash']),
      title: '-',
      url: '-',
      rank: '-',
      date: this.toExportValue(item?.['date']),
      team: '-',
      summary: '-'
    }));
    const csvLines = [
      this.exportCsvColumns.join(','),
      ...rows.map(row => this.exportCsvColumns.map(column => this.escapeCsvValue(row[column] ?? '-')).join(','))
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
    return this.firstValue(record?.source_domain, record?.domain, record?.ip, record?.url, record?.host, record?.raw) || '-';
  }

  getRecordIdentity(record: any): string {
    return this.firstValue(record?.email, record?.username, record?.user, record?.login, record?.credential, record?.raw) || '-';
  }

  getRecordDate(record: any): string {
    return this.firstValue(record?.date, record?.timestamp, record?.created_at, record?.updated_at) || '';
  }

  private recordMatchesIdentity(record: any, identity: string): boolean {
    const normalizedIdentity = identity.toLowerCase();
    if (!normalizedIdentity) {
      return false;
    }

    return this.getIdentityCandidates(record).some(candidate => this.identityAppearsInCandidate(candidate, normalizedIdentity));
  }

  private getIdentityCandidates(record: any): string[] {
    return [
      ...this.expandRecordValue(record?.email),
      ...this.expandRecordValue(record?.username),
      ...this.expandRecordValue(record?.user),
      ...this.expandRecordValue(record?.login),
      ...this.expandRecordValue(record?.credential),
      ...this.expandRecordValue(record?.raw),
    ];
  }

  private identityAppearsInCandidate(candidate: string, normalizedIdentity: string): boolean {
    const value = candidate.toLowerCase();
    if (value === normalizedIdentity) {
      return true;
    }
    if (value.startsWith(`${normalizedIdentity}@`)) {
      return true;
    }
    return value.split(/[^a-z0-9_.-]+/i).some(token => token === normalizedIdentity || token.startsWith(`${normalizedIdentity}@`));
  }

  private expandRecordValue(value: any): string[] {
    if (Array.isArray(value)) {
      return value.flatMap(item => this.expandRecordValue(item));
    }
    if (value && typeof value === 'object') {
      return Object.values(value).flatMap(item => this.expandRecordValue(item));
    }
    const normalized = this.normalizeRecordValue(value);
    return normalized ? [normalized] : [];
  }

  private firstValue(...values: any[]): string {
    for (const value of values) {
      const normalized = this.normalizeRecordValue(value);
      if (normalized) {
        return normalized;
      }
    }
    return '';
  }

  private normalizeRecordValue(value: any): string {
    if (Array.isArray(value)) {
      return this.normalizeRecordValue(value[0]);
    }
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  }

  private toExportValue(value: unknown, maxLength = 120): string {
    if (Array.isArray(value)) {
      return this.toExportValue(value.join(', '), maxLength);
    }
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    const text = String(value).replace(/\s+/g, ' ').trim();
    if (!text) {
      return '-';
    }
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  private escapeCsvValue(value: string | number): string {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }

  private normalizeIdentity(value: string): string {
    return (value || '').trim().replace(/^@+/, '');
  }
}
