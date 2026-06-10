import { Component } from '@angular/core';
import { TranslatePipe } from '../../../../../../../shared/pipes/translate.pipe';

@Component({
  selector:    'app-aircraft-marker-icon',
  imports: [TranslatePipe],
  standalone:  true,
  templateUrl: './aircraft-marker-icon.component.html',
})
export class AircraftMarkerIconComponent {
  iconFill = '#6b7280';
  strokeColor = '#020617';
  rotationDegrees = 0;
  isLoading = false;
  isSelected = false;

  get rotationTransform(): string {
    return `rotate(${this.rotationDegrees} 12 12)`;
  }
}
