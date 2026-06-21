import { CommonModule, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ScrollService } from '../../services/scroll.service';
import { RecordSidebarItem } from '../../model/record-sidebar/record-sidebar.model';

@Component({
  selector: 'app-record-sidebar',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, TranslatePipe],
  templateUrl: './record-sidebar.component.html',
})
export class RecordSidebarComponent {
  readonly isOpen = input(false);
  readonly title = input('Records');
  readonly subtitle = input<string | null>(null);
  readonly records = input<RecordSidebarItem[]>([]);
  readonly testId = input('record-sidebar');
  readonly close = output<void>();
  searchTerm = '';

  constructor(private scrollService: ScrollService) {
  }

  getFilteredRecords(): RecordSidebarItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    const records = this.records();
    if (!term) {
      return records;
    }
    return records.filter(record => String(record.searchText || `${record.title} ${record.subtitle || ''} ${record.sourceLabel || ''} ${(record.tags || []).join(' ')}`).toLowerCase().includes(term));
  }

  getLatestDate(): string | null {
    return this.records().reduce((latest, record) => {
      if (!latest) {
        return record.date || null;
      }
      if (!record.date) {
        return latest;
      }
      return this.dateTime(record.date) > this.dateTime(latest) ? record.date : latest;
    }, null as string | null);
  }

  onClose(): void {
    this.searchTerm = '';
    this.close.emit();
  }

  onRecordClick(record: RecordSidebarItem): void {
    this.scrollService.saveCurrentPosition(record.savePositionId || record.id || '');
  }

  private dateTime(value: string | null): number {
    if (!value) {
      return 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
