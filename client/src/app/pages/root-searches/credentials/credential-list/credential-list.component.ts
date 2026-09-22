import { Component, effect, input, output, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { StealerLogCallbackModel, StealerLogResultItem } from '../../../../shared/model/results/credentials/credential.callback.model';
import { expandFadeRow } from '../../../../shared/animations/row.animations';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
import { RankedCallbackModel, RankedResultItem } from '../../../../shared/model/results/consolidated/ranked.callback.model';
import { ExpandedRowComponent } from '../expanded-row/expanded-row.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ConfirmationPopupComponent } from '../../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { ResultRowHelperService } from '../../../../shared/services/result-row-helper.service';

type IocResultTab = 'stealers' | 'threats';

const PHONE_TAG_MATCH = /m_phone:/;

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem, expandFadeRow],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ExpandedRowComponent, DatePipe, TranslatePipe, NgClass, ConfirmationPopupComponent]
})
export class CredentialListComponent {
  readonly rankedResultInput = input(new RankedCallbackModel(), { alias: 'rankedResult' });
  thretsExpandedRows = new Set<number>();
  stealersExpandedRows = new Set<number>();
  pendingDismissItem: StealerLogResultItem | null = null;
  readonly stealerData$ = input.required<StealerLogCallbackModel>();
  readonly type = input<string>('credential');
  readonly isLoading = input.required<boolean>();
  rankedResult: RankedCallbackModel = new RankedCallbackModel();
  readonly searchQuery = input<string>('');
  readonly activeTab = input<IocResultTab>('stealers');
  readonly canDismiss = input<boolean>(false);
  readonly dismissRequested = output<StealerLogResultItem>();

  constructor(private router: Router, private rowHelper: ResultRowHelperService) {
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
    return index + 1;
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

  onDismissClick(item: StealerLogResultItem, event: MouseEvent): void {
    event.stopPropagation();
    if (item.dismissed) {
      this.dismissRequested.emit(item);
      return;
    }
    this.pendingDismissItem = item;
  }

  confirmDismiss(confirmed: boolean): void {
    const item = this.pendingDismissItem;
    this.pendingDismissItem = null;
    if (confirmed && item) {
      this.dismissRequested.emit(item);
    }
  }

  getStealerDomainValues(item: StealerLogResultItem): string[] {
    if (!item || item.type === 'bin') {
      return [];
    }
    const domains = this.mergeUniqueValues(this.normalizeValues(item.service_domain), this.normalizeValues(item.domain));
    const sourceDomains = this.mergeUniqueValues(this.normalizeValues(item.source_domain), this.normalizeValues(item.domains));
    const mergedDomains = this.mergeUniqueValues(domains, sourceDomains);
    if (mergedDomains.length) {
      return mergedDomains;
    }
    const ips = this.normalizeValues(item.ip);
    if (ips.length) {
      return ips;
    }
    return this.normalizeValues(item.channel);
  }

  getStealerIdentityValue(item: StealerLogResultItem): string {
    if (!item || item.type === 'bin') {
      return '';
    }
    const phone = this.normalizeValues(item.phone)[0];
    if (phone && PHONE_TAG_MATCH.test(this.searchQuery())) {
      return phone;
    }
    const shownDomains = this.getStealerDomainValues(item);
    const ip = this.mergeUniqueValues(this.normalizeValues(item.ipv4), this.normalizeValues(item.ip))
      .find(value => !shownDomains.includes(value));
    return this.normalizeValues(item.email)[0]
      ?? this.normalizeValues(item.username)[0]
      ?? phone
      ?? this.normalizeValues(item.identifier)[0]
      ?? ip
      ?? '';
  }

  getStealerDomainTitle(item: StealerLogResultItem): string {
    const values = this.getStealerDomainValues(item);
    return values.length ? values.join(', ') : 'Not available';
  }

  sliceText(text: string | null | undefined, maxLength = 30): string {
    if (!text) {
      return '';
    }
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  getThreatPrimaryUrl(result: RankedResultItem): string {
    if (!result) {
      return '-';
    }
    const candidates = [result.m_url, result.m_base_url, result.m_domain, result.m_weblink]
      .flatMap(value => this.normalizeValues(value));
    return candidates[0] || '-';
  }

  getThreatPrimaryUrlShort(result: RankedResultItem, maxLength = 25): string {
    return this.sliceText(this.getThreatPrimaryUrl(result), maxLength) || '-';
  }

  getThreatSourceIndex(result: RankedResultItem): string {
    const raw = result?.rank_index ?? result?.m_rank_index ?? result?.m_index ?? result?.index ?? result?.type ?? result?.file_type;
    return this.rowHelper.formatIndexLabel(raw);
  }

  private normalizeValues(value: unknown): string[] {
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
