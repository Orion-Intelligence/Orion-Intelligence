import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-geo-ranges-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './geo-ranges-modal.component.html',
})
export class GeoRangesModalComponent {
  @Input() isOpen = false;
  @Input() isScanning = false;
  @Input() ipRanges = '';
  @Input() maxIps = 200;
  @Input() formError: string | null = null;
  @Input() parsedRanges: { value: string; valid: boolean }[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() ipRangesChange = new EventEmitter<string>();
  @Output() maxIpsChange = new EventEmitter<number>();
  @Output() search = new EventEmitter<void>();

  get ipRangeCount(): number {
    return this.ipRanges
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean).length;
  }

  onClose(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }
}
