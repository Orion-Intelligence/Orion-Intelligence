import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MapEntityByIdItem } from '../../../models/geo-fencing.models';

@Component({
  selector: 'app-entity-description-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entity-description-popup.component.html',
})
export class EntityDescriptionPopupComponent {
  @Input() isOpen = false;
  @Input() items: MapEntityByIdItem[] = [];

  @Output() close = new EventEmitter<void>();

  onOverlayClose(): void {
    this.close.emit();
  }

  onCloseButton(): void {
    this.close.emit();
  }
}
