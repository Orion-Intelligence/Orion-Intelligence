import { Component } from '@angular/core';

@Component({
  selector:    'app-facility-popup',
  standalone:  true,
  templateUrl: './facility-popup.component.html',
})
export class FacilityPopupComponent {
  name = '';
  kind = '';

  get title(): string {
    return this.name || this.kind || 'Facility';
  }

  get typeLabel(): string {
    return this.kind || 'unknown';
  }
}
