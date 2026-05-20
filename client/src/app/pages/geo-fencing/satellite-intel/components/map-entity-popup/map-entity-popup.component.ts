import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapEntityByIdItem } from '../../model/satellite-intel.model';

@Component({
  selector: 'app-map-entity-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-entity-popup.component.html',
})
export class MapEntityPopupComponent {
  search = '';

  @Input() isOpen = false;
  @Input() items: MapEntityByIdItem[] = [];

  @Output() close = new EventEmitter<void>();

  onOverlayClose(): void {
    this.close.emit();
  }

  onCloseButton(): void {
    this.close.emit();
  }

  get filteredItems(): MapEntityByIdItem[] {
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
