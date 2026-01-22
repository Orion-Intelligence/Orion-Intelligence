import { Component, Input } from '@angular/core';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { expandFadeRow } from '../../../shared/animations/row.animations';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { RankedCallbackModel } from '../../../shared/model/results/consolidated/ranked.callback.model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem, expandFadeRow],
  imports: [NgForOf, NgIf, NgClass, TooltipDirective]
})
export class CredentialListComponent {
  @Input() stealerData$!: StealerLogCallbackModel;
  @Input() currentPage: number = 1;
  @Input() type: string = 'credential';
  @Input() isLoading!: boolean;
  @Input() rankedResult: RankedCallbackModel = new RankedCallbackModel();

  pageSize: number = 500;
  thretsExpandedRows = new Set<number>();
  stealersExpandedRows = new Set<number>();
  passwordVisible = true;

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

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).catch(() => { });
  }

  onDownload() {
    const data = this.stealerData$;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'stealerData.json';
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  splitRaw(value: any, delimiters: any): string[] {
    const text = (value ?? '').toString();
    const list = Array.isArray(delimiters)
      ? delimiters
      : (typeof delimiters === 'string' ? delimiters.split('') : [':', ';', '|', ',']);
    const escaped = list.map((c: string) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
    const re = new RegExp(`[${escaped}]`, 'g');
    return text.split(re).map((s: string) => s.trim()).filter((s: string) => !!s);
  }

  iocValue(item: any, idx: number): string | null {
    const parts = this.splitRaw(item['raw'], item['delimiter']);
    if (idx < 0 || idx >= parts.length) return null;
    return parts[idx] || null;
  }

  getExposureLevel(item: any): 'critical' | 'warning' | 'info' {
    if (item['email']?.[0]) return 'critical';
    if (item['username']?.[0] || item['ip']?.[0]) return 'warning';
    return 'info';
  }

  getExposureLabel(item: any): string {
    const level = this.getExposureLevel(item);
    if (level === 'critical') return 'Critical Exposure Profile Identified';
    if (level === 'warning') return 'Warning Exposure Profile Identified';
    return 'Info Exposure Profile Identified';
  }
  sliceText(text: string, maxLength: number = 30): string {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }
  getTagEntries(result: any): { key: string; values: any[] }[] {
    if (!result) return [];

    return Object.keys(result)
      .filter(
        key =>
          key.startsWith('m_') &&
          Array.isArray(result[key]) &&
          result[key].length > 0
      )
      .map(key => ({
        key,
        values: result[key]
      }));
  }
  formatKeyLabel(key: string): string {
    const cleaned = key.replace(/^m_/, '').replace(/[^a-zA-Z0-9]/g, ' ');
    return cleaned.length < 4
      ? cleaned.toUpperCase()
      : cleaned
        .toLowerCase()
        .replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }
}
