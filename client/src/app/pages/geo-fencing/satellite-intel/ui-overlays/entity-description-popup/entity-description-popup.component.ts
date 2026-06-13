import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MapEntityByIdItem } from '../../../models/geo-fencing.models';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-entity-description-popup',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
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
