import { Component, Input } from '@angular/core';
import {KeyValuePipe, NgForOf, NgIf, NgOptimizedImage, TitleCasePipe} from '@angular/common';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import {TooltipDirective} from '../../../shared/directive/tooltip-directive.directive';
import {
  AlertExportComponentComponent
} from '../../../shared/partials/sidebar-user/sidebar-user-homepage/alert-export-component/alert-export-component.component';
import {NgxPrintDirective} from 'ngx-print';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [NgForOf, NgIf, KeyValuePipe, TitleCasePipe, NgOptimizedImage, TooltipDirective, AlertExportComponentComponent, NgxPrintDirective]
})
export class CredentialListComponent {
  @Input() stealerData$!: StealerLogCallbackModel;
  @Input() currentPage: number = 1;
  @Input() type: string = 'credential';
  @Input() isLoading!: boolean;

  expandedIndex: number | null = null;
  pageSize: number = 500;

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).catch(() => {
    });
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
}
