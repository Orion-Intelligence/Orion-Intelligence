import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SatelliteIntelPanel, SatelliteIntelPanelEnum } from '../../../enums/geo-fencing.enums';

const PANEL_TABS: Array<{ id: SatelliteIntelPanel; label: string }> = [
  { id: SatelliteIntelPanelEnum.Dashboard, label: 'Dashboard' },
  { id: SatelliteIntelPanelEnum.Compare, label: 'Imagery Analysis' },
];

@Component({
  selector: 'app-satellite-panel-shell',
  standalone: true,
  templateUrl: './panel-shell.component.html',
})
export class PanelShellComponent {
  readonly panelTabs = PANEL_TABS;

  @Input() isMapView = false;
  @Input() isThreatView = false;
  @Input() isPanelMenuOpen = false;
  @Input() isPanelPopupOpen = false;
  @Input() activePanel: SatelliteIntelPanel = SatelliteIntelPanelEnum.Dashboard;

  @Output() threatFiltersOpened = new EventEmitter<void>();
  @Output() threatIpScanOpened = new EventEmitter<void>();
  @Output() panelOpened = new EventEmitter<SatelliteIntelPanel>();
  @Output() panelClosed = new EventEmitter<void>();

  get activePanelLabel(): string {
    return this.panelTabs.find((tab) => tab.id === this.activePanel)?.label ?? 'Panel';
  }
}
