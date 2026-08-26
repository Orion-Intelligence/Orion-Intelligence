import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '../../../../../../../shared/pipes/translate.pipe';

@Component({
  selector:    'app-facility-popup',
  imports: [TranslatePipe],
  standalone:  true,
  changeDetection: ChangeDetectionStrategy.Eager,
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
