import { CommonModule } from '@angular/common';
import { Component, HostListener, OnChanges, input, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './time-picker.component.html',
})
export class TimePickerComponent implements OnChanges {
  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  isOpen = false;
  selectedHour: number | null = null;
  selectedMinute: number | null = null;
  readonly value = input<string | null>('');
  readonly placeholder = input<string>('Select time');
  readonly disabled = input(false);
  readonly toggleTestId = input('time-picker-toggle');
  readonly timeSelected = output<{ value: string }>();

  get displayValue(): string {
    if (this.selectedHour === null || this.selectedMinute === null) {
      return '';
    }
    return `${this.pad(this.selectedHour)}:${this.pad(this.selectedMinute)}`;
  }

  ngOnChanges(): void {
    const raw = (this.value() ?? '').trim();
    if (!raw) {
      this.selectedHour = null;
      this.selectedMinute = null;
      return;
    }
    const [h, m] = raw.split(':').map(Number);
    this.selectedHour = Number.isFinite(h) ? this.clamp(h, 0, 23) : null;
    this.selectedMinute = Number.isFinite(m) ? this.clamp(m, 0, 59) : null;
  }

  togglePicker(): void {
    if (this.disabled()) {
      return;
    }
    this.isOpen = !this.isOpen;
  }

  closePicker(): void {
    this.isOpen = false;
  }

  selectHour(hour: number): void {
    this.selectedHour = hour;
    this.emitValue();
  }

  selectMinute(minute: number): void {
    this.selectedMinute = minute;
    this.emitValue();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedHour = null;
    this.selectedMinute = null;
    this.timeSelected.emit({ value: '' });
    this.closePicker();
  }

  isHour(hour: number): boolean {
    return this.selectedHour === hour;
  }

  isMinute(minute: number): boolean {
    return this.selectedMinute === minute;
  }

  pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closePicker();
  }

  private emitValue(): void {
    this.selectedHour ??= 0;
    this.selectedMinute ??= 0;
    this.timeSelected.emit({ value: this.displayValue });
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
