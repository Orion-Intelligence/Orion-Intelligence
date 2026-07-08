import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../../../../shared/pipes/translate.pipe';

@Component({
  selector:    'app-ship-marker-icon',
  imports: [TranslatePipe],
  standalone:  true,
  templateUrl: './ship-marker-icon.component.html',
})
export class ShipMarkerIconComponent {
  strokeColor = '#0ea5e9';
  rotationDegrees = 0;
  isLoading = false;
  isSelected = false;

  get rotationTransform(): string {
    return `rotate(${this.rotationDegrees} 12 12)`;
  }
}
