import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ship-details-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ship-details-panel.component.html',
})
export class ShipDetailsPanelComponent {
  @Input() ship: Record<string, any> | null = null;

  get fields(): Array<{ label: string; value: string; mono?: boolean }> {
    return [
      { label: 'MMSI', value: this.display(this.pick('mmsi')), mono: true },
      { label: 'Name', value: this.display(this.pick('name')) },
      { label: 'Callsign', value: this.display(this.pick('call_sign')) },
      { label: 'Destination', value: this.display(this.pick('destination')) },
      { label: 'Speed', value: this.display(this.pick('speed')) },
      { label: 'Course', value: this.display(this.pick('course')) },
      { label: 'True Heading', value: this.display(this.pick('true_heading')) },
      { label: 'Nav Status', value: this.display(this.pick('nav_status')) },
    ];
  }

  get shipType(): string {
    return this.display(this.pick('ship_type'));
  }

  get coordinates(): string {
    const latitude = this.ship?.['latitude'];
    const longitude = this.ship?.['longitude'];
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
    }
    return '-';
  }

  private pick(...keys: string[]): unknown {
    for (const key of keys) {
      const value = this.ship?.[key];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
    return null;
  }

  private display(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return String(value);
  }
}
