import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
  iso: string;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent implements OnChanges {
  @Input() key = '';
  @Input() filterModel: any;
  @Input() mSelectedFilters: any;
  @Output() selectedFiltersChange = new EventEmitter<{ key: string; value: string }>();
  @Output() dateSelected = new EventEmitter<{ key: string; value: string }>();

  isOpen = false;
  viewYear = 0;
  viewMonth = 0; // 0-11
  cells: CalendarCell[] = [];

  fromDate: Date | null = null;
  toDate: Date | null = null;

  readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  get displayValue(): string {
    if (this.fromDate && this.toDate) {
      return `${this.toIso(this.fromDate)},${this.toIso(this.toDate)}`;
    }
    if (this.fromDate) {
      return this.toIso(this.fromDate);
    }
    return '';
  }

  get monthLabel(): string {
    return new Date(this.viewYear, this.viewMonth, 1).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric'
    });
  }

  ngOnChanges(): void {
    const raw = this.mSelectedFilters?.[this.key];
    if (!raw) {
      this.fromDate = null;
      this.toDate = null;
      const now = new Date();
      this.viewYear = now.getFullYear();
      this.viewMonth = now.getMonth();
      this.buildCalendar();
      return;
    }

    const [start, end] = String(raw).split(',');
    this.fromDate = this.parseIso(start);
    this.toDate = this.parseIso(end);

    const pivot = this.fromDate || new Date();
    this.viewYear = pivot.getFullYear();
    this.viewMonth = pivot.getMonth();
    this.buildCalendar();
  }

  togglePicker(): void {
    this.isOpen = !this.isOpen;
  }

  closePicker(): void {
    this.isOpen = false;
  }

  prevMonth(): void {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear -= 1;
    } else {
      this.viewMonth -= 1;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear += 1;
    } else {
      this.viewMonth += 1;
    }
    this.buildCalendar();
  }

  onSelect(cell: CalendarCell): void {
    const picked = new Date(cell.date.getFullYear(), cell.date.getMonth(), cell.date.getDate());
    if (!this.fromDate || (this.fromDate && this.toDate)) {
      this.fromDate = picked;
      this.toDate = null;
      return;
    }

    if (picked.getTime() >= this.fromDate.getTime()) {
      this.toDate = picked;
      const value = `${this.toIso(this.fromDate)},${this.toIso(this.toDate)}`;
      this.mSelectedFilters[this.key] = value;
      this.selectedFiltersChange.emit({ key: this.key, value });
      this.dateSelected.emit({ key: this.key, value });
      this.closePicker();
      return;
    }

    this.fromDate = picked;
    this.toDate = null;
  }

  isStart(cell: CalendarCell): boolean {
    return !!this.fromDate && this.sameDay(cell.date, this.fromDate);
  }

  isEnd(cell: CalendarCell): boolean {
    return !!this.toDate && this.sameDay(cell.date, this.toDate);
  }

  isInRange(cell: CalendarCell): boolean {
    if (!this.fromDate || !this.toDate) {
      return false;
    }
    const t = cell.date.getTime();
    return t > this.fromDate.getTime() && t < this.toDate.getTime();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closePicker();
  }

  private buildCalendar(): void {
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const startOffset = first.getDay(); // sunday-based
    const start = new Date(this.viewYear, this.viewMonth, 1 - startOffset);

    const next: CalendarCell[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      next.push({
        date: d,
        inCurrentMonth: d.getMonth() === this.viewMonth,
        iso: this.toIso(d)
      });
    }
    this.cells = next;
  }

  private parseIso(value?: string): Date | null {
    const v = (value || '').trim();
    if (!v) {
      return null;
    }
    const [y, m, d] = v.split('-').map(Number);
    if (!y || !m || !d) {
      return null;
    }
    return new Date(y, m - 1, d);
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }
}
