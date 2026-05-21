import { Component } from '@angular/core';

@Component({
  selector:    'app-aircraft-marker-icon',
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
