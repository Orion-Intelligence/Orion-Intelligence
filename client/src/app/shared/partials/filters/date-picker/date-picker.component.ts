import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDate, NgbDateParserFormatter, NgbModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbModule],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent implements OnChanges {
  formatter = inject(NgbDateParserFormatter);
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;
  finalValue = '';
  hiddenValue = '';

  @Input() key = '';
  @Input() filterModel: any;
  @Input() mSelectedFilters: any;

  @Output() selectedFiltersChange = new EventEmitter<{ key: string; value: string; }>();
  @Output() dateSelected = new EventEmitter<{ key: string; value: string; }>();

  onDateSelection(date: NgbDate): void {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.hiddenValue = this.formatter.format(this.fromDate);
      this.finalValue = '';
      return;
    }
    else if (this.fromDate && !this.toDate && (date.equals(this.fromDate) || date.after(this.fromDate))) {
      this.toDate = date;
      const v = `${this.formatter.format(this.fromDate)},${this.formatter.format(this.toDate)}`;
      this.hiddenValue = v;
      this.finalValue = v;
      this.mSelectedFilters[this.key] = v;
      this.selectedFiltersChange.emit({ key: this.key, value: v });
      this.dateSelected.emit({ key: this.key, value: v });
      return;
    }
    else {
      this.fromDate = date;
      this.toDate = null;
      this.hiddenValue = this.formatter.format(this.fromDate);
      this.finalValue = '';
      return;
    }
  }

  isHovered(date: NgbDate) {
    return this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate);
  }

  isInside(date: NgbDate) {
    return this.fromDate && this.toDate && date.after(this.fromDate) && date.before(this.toDate);
  }

  ngOnChanges(): void {
    const rawValue = this.mSelectedFilters?.[this.key];
    if (!rawValue) {
      this.fromDate = null;
      this.toDate = null;
      this.hoveredDate = null;
      this.hiddenValue = '';
      this.finalValue = '';
      return;
    }
    const dates = rawValue.split(',');
    const [startStr, endStr] = dates;
    const parseDate = (str: string): NgbDate | null => {
      const parts = str?.trim().split('-').map(Number);
      return parts?.length === 3 ? new NgbDate(parts[0], parts[1], parts[2]) : null;
    };
    this.fromDate = parseDate(startStr);
    this.toDate = parseDate(endStr);
    this.hiddenValue = rawValue;
    this.finalValue = this.fromDate && this.toDate ? rawValue : '';
  }

  isRange(date: NgbDate) {
    return (date.equals(this.fromDate) ||
          (this.toDate && date.equals(this.toDate)) ||
          this.isInside(date) ||
          this.isHovered(date));
  }
}
