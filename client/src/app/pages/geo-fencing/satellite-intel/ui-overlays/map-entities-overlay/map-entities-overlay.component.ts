import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OrionSatelliteFilterOption, TrackingEntityType } from '../../../models/geo-fencing.models';
import { AircraftDetailsPanelComponent } from '../../map-entities/aircraft/components/aircraft-details-panel/aircraft-details-panel.component';
import { FacilityLegendComponent } from '../../map-entities/facilities/components/facility-legend/facility-legend.component';
import { ShipDetailsPanelComponent } from '../../map-entities/ships/components/ship-details-panel/ship-details-panel.component';

@Component({
  selector:    'app-map-entities-overlay',
  standalone:  true,
  imports:     [CommonModule, AircraftDetailsPanelComponent, ShipDetailsPanelComponent, FacilityLegendComponent],
  templateUrl: './map-entities-overlay.component.html',
})
export class MapEntitiesOverlayComponent {
  @Input() facilitiesVisible = true;
  @Input() legendConstrained = false;
  @Input() legendFilters: OrionSatelliteFilterOption[] = [];
  @Input() sidebarVisible = false;
  @Input() sidebarLoading = false;
  @Input() sidebarError: string | null = null;
  @Input() selectedEntity: { type: TrackingEntityType; data: any | null } | null = null;
  @Input() isAircraftLoading = false;
  @Input() isShipsLoading = false;
  @Input() isMapEntityLoading = false;
  @Input() isMapEntityDetailsLoading = false;
  @Input() errorMessage: string | null = null;
  @Input() isScanning = false;
  @Input() topControlsInset = false;

  @Output() closeSidebar = new EventEmitter<void>();
}
