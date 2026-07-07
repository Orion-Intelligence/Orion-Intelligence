import { Component, Input } from '@angular/core';
import { StealerLogCallbackModel } from '../../../../shared/model/results/credentials/credential.callback.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface DomainIndexItem {
  value: string;
  count: number;
  channel: string;
}

const DOMAIN_UI_LIMIT = 10;

@Component({
  selector: 'app-domain-index-sidebar',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './domain-index-sidebar.component.html',
})
export class DomainIndexSidebarComponent {
  domainSidebarSearch = '';

  @Input() stealerData: StealerLogCallbackModel | null = null;

  get filteredSourceDomainItems(): DomainIndexItem[] {
    return this.filterDomainItems(this.collectDomainItems('source_domain')).slice(0, DOMAIN_UI_LIMIT);
  }

  get filteredOtherDomainItems(): DomainIndexItem[] {
    return this.filterDomainItems(this.collectDomainItems('domain')).slice(0, DOMAIN_UI_LIMIT);
  }

  private get stealerRecords(): any[] {
    return this.stealerData?.Result ?? [];
  }

  private collectDomainItems(field: 'source_domain' | 'domain'): DomainIndexItem[] {
    const items = new Map<string, DomainIndexItem>();
    this.stealerRecords.forEach(item => {
      const recordDomains = new Set(this.normalizeDomainValues(item?.[field]));
      const channel = this.getDomainItemChannel(item);
      recordDomains.forEach(domain => {
        const existing = items.get(domain);
        if (existing) {
          existing.count += 1;
          existing.channel = existing.channel === '-' && channel !== '-' ? channel : existing.channel;
          return;
        }
        items.set(domain, { value: domain, count: 1, channel });
      });
    });
    return Array.from(items.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }

  private normalizeDomainValues(value: unknown): string[] {
    const values = Array.isArray(value) ? value : [value];
    return Array.from(new Set(values.map(item => this.normalizeDomain(item)).filter(Boolean)));
  }

  private normalizeDomain(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    let domain = String(value).trim().toLowerCase();
    if (!domain || domain === '-') {
      return '';
    }
    domain = domain.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
    domain = domain.replace(/^[^@/\s]+@/, '');
    domain = domain.split(/[/?#]/)[0] ?? '';
    domain = domain.split(':')[0] ?? '';
    domain = domain.replace(/^\.+|\.+$/g, '').replace(/^www\./, '');
    if (!domain || !domain.includes('.') || /\s/.test(domain) || /^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
      return '';
    }
    return domain;
  }

  private getDomainItemChannel(item: any): string {
    return this.firstDisplayValue(item?.['channel'], item?.['filename'], item?.['file'], item?.['m_index']) || '-';
  }

  private firstDisplayValue(...values: unknown[]): string {
    for (const value of values) {
      const raw = Array.isArray(value) ? value.find(item => item !== null && item !== undefined && String(item).trim()) : value;
      if (raw === null || raw === undefined) {
        continue;
      }
      const text = String(raw).replace(/\s+/g, ' ').trim();
      if (text && text !== '-') {
        return text;
      }
    }
    return '';
  }

  private filterDomainItems(items: DomainIndexItem[]): DomainIndexItem[] {
    const search = this.domainSidebarSearch.trim().toLowerCase();
    if (!search) {
      return items;
    }
    return items.filter(item => [item.value, item.channel].some(value => value.toLowerCase().includes(search)));
  }
}
