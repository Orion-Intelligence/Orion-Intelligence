import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { PasswordSchemaFilter } from '../../../shared/model/stealerlogs-filter/stealerlogs-filters';
@Component({
  selector: 'app-password-schema',
  imports: [FormsModule, NgIf],
  templateUrl: './password-schema.component.html'
})
export class PasswordSchemaComponent {
  filter: PasswordSchemaFilter = { minLength: null, maxLength: null, hasAlphabets: false, hasNumbers: false, hasSpecialChars: false };

  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() search = new EventEmitter<PasswordSchemaFilter>();

  onSearch() {
    this.normalizeRange();
    this.search.emit(this.filter);
    this.close.emit();
  }

  onClose() {
    this.close.emit();
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isOpen && target.classList.contains('password-schema-overlay')) {
      this.close.emit();
    }
  }

  normalizeRange() {
    if (this.filter.minLength !== null && this.filter.minLength < 0) {
      this.filter.minLength = 0;
    }
    if (this.filter.maxLength !== null && this.filter.maxLength < 0) {
      this.filter.maxLength = 0;
    }
    if (this.filter.minLength !== null &&
          this.filter.maxLength !== null) {
      if (this.filter.minLength > this.filter.maxLength) {
        this.filter.maxLength = this.filter.minLength;
      }
    }
  }
}
