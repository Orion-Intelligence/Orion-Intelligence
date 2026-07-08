import { Component, effect, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { StealerLogCallbackModel } from '../../../../shared/model/results/credentials/credential.callback.model';
import { expandFadeRow } from '../../../../shared/animations/row.animations';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { RankedCallbackModel } from '../../../../shared/model/results/consolidated/ranked.callback.model';
import { ExpandedRowComponent } from '../expanded-row/expanded-row.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem, expandFadeRow],
  imports: [ExpandedRowComponent, DatePipe, TranslatePipe]
})
export class CredentialListComponent {
  readonly rankedResultInput = input(new RankedCallbackModel(), { alias: 'rankedResult' });
  pageSize: number = 500;
  thretsExpandedRows = new Set<number>();
  stealersExpandedRows = new Set<number>();
  readonly stealerData$ = input.required<StealerLogCallbackModel>();
  readonly currentPage = input<number>(1);
  readonly type = input<string>('credential');
  readonly isLoading = input.required<boolean>();
  rankedResult: RankedCallbackModel = new RankedCallbackModel();
  readonly searchQuery = input<string>('');

  constructor(private router: Router) {
    effect(() => {
      this.rankedResult = this.rankedResultInput();
    });
  }

  isStealerlogsRoute(): boolean {
    return this.router.url.includes('/stealerlog');
  }

  trackByIndex(index: number): number {
    return index;
  }

  getDisplayIndex(index: number): number {
    const currentPage = Number(this.currentPage() || 1);
    return ((Math.max(currentPage, 1) - 1) * this.pageSize) + index + 1;
  }

  toggleRow(index: number, expandedSet: Set<number>) {
    if (expandedSet.has(index)) {
      expandedSet.clear();
      return;
    }
    expandedSet.clear();
    expandedSet.add(index);
  }

  isExpanded(index: number, expandedSet: Set<number>): boolean {
    return expandedSet.has(index);
  }

  onRowKeydown(event: KeyboardEvent, index: number, expandedSet: Set<number>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleRow(index, expandedSet);
    }
  }

  getStealerDomainValues(item: any): string[] {
    if (!item || item['type'] === 'bin') {
      return [];
    }
    const domains = this.normalizeValues(item['domain']);
    const sourceDomains = this.normalizeValues(item['source_domain']);
    const mergedDomains = this.mergeUniqueValues(domains, sourceDomains);
    if (mergedDomains.length) {
      return mergedDomains;
    }
    return this.normalizeValues(item['ip']);
  }

  getStealerDomainTitle(item: any): string {
    const values = this.getStealerDomainValues(item);
    return values.length ? values.join(', ') : 'Not available';
  }

  sliceText(text: string | null | undefined, maxLength: number = 30): string {
    if (!text) {
      return '';
    }
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  getThreatPrimaryUrl(result: any): string {
    if (!result) {
      return '-';
    }
    const domain = Array.isArray(result.m_domain) ? result.m_domain[0] : '';
    const weblink = Array.isArray(result.m_weblink) ? result.m_weblink[0] : '';
    return result.m_url || result.m_base_url || domain || weblink || '-';
  }

  getThreatPrimaryUrlShort(result: any, maxLength: number = 25): string {
    return this.sliceText(this.getThreatPrimaryUrl(result), maxLength) || '-';
  }

  private normalizeValues(value: any): string[] {
    const values = Array.isArray(value) ? value : [value];
    return Array.from(new Set(values.map(v => v == null ? '' : String(v).trim()).filter(Boolean)));
  }

  private mergeUniqueValues(...groups: string[][]): string[] {
    const seen = new Set<string>();
    const merged: string[] = [];
    groups.flat().forEach(value => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(value);
    });
    return merged;
  }
}
