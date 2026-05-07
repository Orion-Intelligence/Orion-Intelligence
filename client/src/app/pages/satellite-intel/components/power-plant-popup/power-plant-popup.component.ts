import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PowerPlantByIdItem } from '../../model/satellite-intel.model';

@Component({
  selector: 'app-power-plant-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './power-plant-popup.component.html',
})
export class PowerPlantPopupComponent {
  @Input() isOpen = false;
  @Input() items: PowerPlantByIdItem[] = [];
  @Output() close = new EventEmitter<void>();

  search = '';

  onOverlayClose(): void {
    this.close.emit();
  }

  onCloseButton(): void {
    this.close.emit();
  }

  get filteredItems(): PowerPlantByIdItem[] {
    const query = this.search.trim().toLowerCase();
    if (!query) {
      return this.items;
    }

    return this.items.filter((item) => {
      const name = String(item?.name || '').toLowerCase();
      const id = String(item?.id || '').toLowerCase();
      const country = String(item?.country || '').toLowerCase();
      const type = String(item?.type || '').toLowerCase();
      return name.includes(query) || id.includes(query) || country.includes(query) || type.includes(query);
    });
  }
}
