import {Component, Input} from '@angular/core';
import {DatePipe, KeyValuePipe, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {StealerLogCallbackModel} from '../../../shared/model/results/credentials/credential.callback.model';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [NgForOf, NgIf, KeyValuePipe, TitleCasePipe]
})
export class CredentialListComponent {
  @Input() stealerData$!: StealerLogCallbackModel;
  @Input() type: string = 'credential';
  @Input() isLoading!: boolean;

  expandedIndex: number | null = null;

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).catch(() => {
    });
  }

  formatIdDate(id: string): string {
    if (!id) return '';
    const parts = id.split('_');
    if (parts.length < 2) return id;
    const dateStr = parts[0] + parts[1]; // "20251016143022"
    const year = +dateStr.slice(0, 4);
    const month = +dateStr.slice(4, 6) - 1;
    const day = +dateStr.slice(6, 8);
    const hour = +dateStr.slice(8, 10);
    const minute = +dateStr.slice(10, 12);
    const second = +dateStr.slice(12, 14);
    return new Date(Date.UTC(year, month, day, hour, minute, second)).toLocaleString();
  }

  toggleRow(i: number): void {
    this.expandedIndex = this.expandedIndex === i ? null : i;
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
}
