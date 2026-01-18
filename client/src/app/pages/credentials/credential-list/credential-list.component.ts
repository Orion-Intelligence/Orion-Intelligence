import { Component, Input } from '@angular/core';
import { NgForOf, NgIf, NgClass } from '@angular/common';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { expandFadeRow } from '../../../shared/animations/row.animations';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem, expandFadeRow],
  imports: [NgForOf, NgIf, NgClass]
})
export class CredentialListComponent {
  @Input() stealerData$!: StealerLogCallbackModel;
  @Input() currentPage: number = 1;
  @Input() type: string = 'credential';
  @Input() isLoading!: boolean;

  expandedIndex: number | null = null;
  pageSize: number = 500;

  expandedRows = new Set<number>();
  passwordVisible = true;

  _toggleRow(index: number) {
    if (this.expandedRows.has(index)) {
      this.expandedRows.clear();
      return;
    }
    this.expandedRows.clear();
    this.expandedRows.add(index);
  }

  isExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).catch(() => {});
  }

  toggleRow(i: number): void {
    this.expandedIndex = this.expandedIndex === i ? null : i;
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
}
