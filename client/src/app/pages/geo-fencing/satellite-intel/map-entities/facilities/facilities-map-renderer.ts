import { ComponentRef } from '@angular/core';
import { OrionSatelliteFeature } from '../../../models/geo-fencing.models';
import { FacilityPopupComponent } from './components/facility-popup/facility-popup.component';
import { LeafletComponentRenderer } from '../../map-utils/leaflet-component-renderer';

export class FacilitiesMapRenderer {
  private featureLayer: any = null;
  private featurePopupRefs = new Set<ComponentRef<FacilityPopupComponent>>();

  constructor(private L: any, private map: any, private componentRenderer: LeafletComponentRenderer) {}

  init(): void {
    if (!this.L || !this.map || this.featureLayer) {
      return;
    }

    this.featureLayer = this.L.layerGroup().addTo(this.map);
  }

  renderFeatures(features: OrionSatelliteFeature[]): void {
    if (!this.featureLayer) {
      return;
    }
    this.destroyPopupRefs(this.featurePopupRefs);
    this.featureLayer.clearLayers();

    (features || []).forEach((feature) => {
      if (!Array.isArray(feature.coordinates) || feature.coordinates.length < 2) {
        return;
      }
      const [lon, lat] = feature.coordinates;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return;
      }

      const marker = this.L.circleMarker([lat, lon], {
        radius: 6,
        color: '#ffffff',
        fillColor: feature.color || this.getFacilityColor(feature.rawType || feature.type),
        fillOpacity: 0.88,
        weight: 1.5,
      });
      this.bindPopup(marker, {
        name: feature.name,
        kind: feature.rawType || feature.type,
      }, this.featurePopupRefs);
      marker.addTo(this.featureLayer);
    });
  }

  setVisible(visible: boolean): void {
    if (!this.map) {
      return;
    }
    if (visible) {
      this.featureLayer?.addTo(this.map);
      return;
    }
    this.featureLayer && this.map.removeLayer(this.featureLayer);
  }

  destroy(): void {
    this.destroyPopupRefs(this.featurePopupRefs);
    if (this.featureLayer) {
      this.map?.removeLayer(this.featureLayer);
    }
    this.featureLayer = null;
  }

  private bindPopup(layer: any, properties: { name?: string; kind?: string }, refs: Set<ComponentRef<FacilityPopupComponent>>): void {
    const popup = this.componentRenderer.create(FacilityPopupComponent, {
      name: String(properties.name || ''),
      kind: String(properties.kind || ''),
    });
    refs.add(popup.componentRef);
    layer.bindPopup(popup.element);
  }

  private getFacilityColor(kind: string): string {
    const colors: Record<string, string> = {
      industrial: '#f59e0b',
      port: '#ef4444',
      depot: '#f97316',
      warehouse: '#f59e0b',
      logistics: '#f97316',
      dock: '#38bdf8',
      boatyard: '#38bdf8',
      pier: '#38bdf8',
      crane: '#a78bfa',
      storage_tank: '#ef4444',
      pipeline: '#6b7280',
      breakwater: '#6b7280',
      hangar: '#a78bfa',
      factory: '#ef4444',
      airport: '#38bdf8',
      military: '#ef4444',
      other: '#64748b',
    };
    return colors[kind] || '#6b7280';
  }

  private destroyPopupRefs(refs: Set<ComponentRef<FacilityPopupComponent>>): void {
    Array.from(refs).forEach((componentRef) => this.componentRenderer.destroy(componentRef));
    refs.clear();
  }
}
