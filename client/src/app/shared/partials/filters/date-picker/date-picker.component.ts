import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDateParserFormatter, NgbModule, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import '@angular/localize/init';

@Component({
  selector: 'app-date-picker',
  imports: [FormsModule, CommonModule, NgbModule],
  templateUrl: './date-picker.component.html',
})
export class DatePickerComponent {
  @Input() key: string = '';
  @Output() dateSelected = new EventEmitter<{ key: string; value: string }>();


  formatter = inject(NgbDateParserFormatter);
  hoveredDate: NgbDate | null = null;
  fromDate: NgbDate | null = null;
  toDate: NgbDate | null = null;


  onDateSelection(date: NgbDate) {
    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
      this.dateSelected.emit({ key: this.key, value: this.formatter.format(this.fromDate) });
    } else if (this.fromDate && !this.toDate && date.after(this.fromDate)) {
      this.toDate = date;
      this.dateSelected.emit({ key: this.key, value: `${this.formatter.format(this.fromDate)}, ${this.formatter.format(this.toDate)}` });
    } else {
      this.toDate = null;
      this.fromDate = date;
      this.dateSelected.emit({ key: this.key, value: this.formatter.format(this.fromDate) });
    }
  }
  formatDateRange(): string {
    if (this.fromDate && this.toDate) {
      return `${this.formatter.format(this.fromDate)} to ${this.formatter.format(this.toDate)}`;
    } else if (this.fromDate) {
      return `${this.formatter.format(this.fromDate)} to ...`;
    }
    return '';
  }
  isHovered(date: NgbDate) {
    return (
      this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
    );
  }

  isInside(date: NgbDate) {
    return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
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
