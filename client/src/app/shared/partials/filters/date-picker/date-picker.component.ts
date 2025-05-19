import {CommonModule} from '@angular/common';
import {Component, EventEmitter, inject, Input, OnChanges, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDate, NgbDateParserFormatter, NgbModule} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [FormsModule, CommonModule, NgbModule],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent implements OnChanges{
  @Input() key: string = '';
  @Input() filterModel: any;
  @Input() mSelectedFilters: any;
  @Output() selectedFiltersChange = new EventEmitter<{ key: string; value: string }>();
  @Output() dateSelected = new EventEmitter<{ key: string; value: string }>();

  formatter = inject(NgbDateParserFormatter);
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;

  onDateSelection(date: NgbDate): void {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.emitDateChange();
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.emitDateChange();
    } else {
      this.fromDate = date;
      this.toDate = null;
      this.emitDateChange();
    }
  }

  emitDateChange(): void {
    const value = this.toDate
      ? `${this.formatter.format(this.fromDate!)},${this.formatter.format(this.toDate)}`
      : this.fromDate
        ? this.formatter.format(this.fromDate)
        : '';
    this.mSelectedFilters[this.key] = value;
    this.selectedFiltersChange.emit({key: this.key, value});
    this.dateSelected.emit({key: this.key, value});
  }

  isHovered(date: NgbDate) {
    return (
      this.fromDate &&
      !this.toDate &&
      this.hoveredDate &&
      date.after(this.fromDate) &&
      date.before(this.hoveredDate)
    );
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
  }

  isRange(date: NgbDate) {
    return (
      date.equals(this.fromDate) ||
      (this.toDate && date.equals(this.toDate)) ||
      this.isInside(date) ||
      this.isHovered(date)
    );
  }
}
