import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { UrlScanMeta, UrlScanThreatItem } from '../../../model/security-scan/security.scan.results.model';
import {HelperService} from '../../../services/helper.service';


interface FindingRow {
  n: number;
  category: string;
  header: string;
  description: string;
  risk: string;
  confidence: string;
  proof?: string;
}

@Component({
  selector: 'app-security-scan-export-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './security-scan-export-component.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SecurityScanExportComponentComponent implements OnChanges {
  @Input() meta!: UrlScanMeta;
  @Input() categories!: { name: string; total: number; items: UrlScanThreatItem[] }[];

  constructor(private helperService:HelperService) {
  }

  viewFindings: FindingRow[] = [];

  ngOnChanges(_c: SimpleChanges): void {
    this.viewFindings = this.buildRows();
  }

  get printedNow(): string {
    return new Date().toLocaleString();
  }

  riskClass(risk: string | null | undefined) {
    return this.helperService.riskClass(risk)
  }

  trimProof(p?: string | null): string {
    const text = String(p ?? '');
    if (!text) return '';
    const lines = text.split(/\r?\n/);
    return lines.length <= 15 ? text : lines.slice(0, 15).join('\n') + '\n…';
  }

  private buildRows(): FindingRow[] {
    const rows: FindingRow[] = [];
    const cats = this.categories || [];
    for (const cat of cats) {
      const items = cat.items || [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        rows.push({
          n: i + 1,
          category: cat.name,
          header: it.header || '',
          description: it.description || '',
          risk: it.risk || '',
          confidence: it.confidence || '',
          proof: it.proof || undefined
        });
      }
    }
    return rows;
  }
}
