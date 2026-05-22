import { Subscription } from 'rxjs';
import { SatelliteFacilitiesResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { MapEntityLoadingBridge, OrionSatelliteFeature, SatelliteTrackingViewport } from '../../../models/geo-fencing.models';
import { SatelliteFacilitiesService } from './facilities.service';

export class SatelliteFacilitiesController {
  private sub?: Subscription;
  private service: SatelliteFacilitiesService;
  private loading: MapEntityLoadingBridge;

  visible = true;
  data: SatelliteFacilitiesResponse['result'] | null = null;
  mapData: OrionSatelliteFeature[] = [];
  isLoading = false;

  constructor(service: SatelliteFacilitiesService, loading: MapEntityLoadingBridge) {
    this.service = service;
    this.loading = loading;
  }

  load(viewport: SatelliteTrackingViewport, onMapDataChanged: () => void, showLoading = true): void {
    if (!Number.isFinite(viewport.lat) || !Number.isFinite(viewport.lon)) {
      this.sub?.unsubscribe();
      this.data = null;
      this.mapData = [];
      this.isLoading = false;
      onMapDataChanged();
      return;
    }

    this.sub?.unsubscribe();
    this.isLoading = true;
    const loadingId = showLoading ? this.loading.begin('Loading Satellite Intel', 'Loading nearby facilities...') : null;
    const radiusKm = Math.max(5, Math.min(1000, viewport.delta * 111.32));
    this.sub = this.service.fetchNearby(viewport.lat, viewport.lon, radiusKm).subscribe({
      next: (res) => {
        this.data = res.result;
        this.mapData = this.service.toMapFeatures(res.result);
        onMapDataChanged();
      },
      error: () => {
        this.data = null;
        this.mapData = [];
        onMapDataChanged();
      },
    });
    this.sub.add(() => {
      this.isLoading = false;
      if (loadingId !== null) {
        this.loading.end(loadingId);
      }
    });
  }

  clear(onMapDataChanged: () => void): void {
    this.sub?.unsubscribe();
    this.data = null;
    this.mapData = [];
    this.isLoading = false;
    onMapDataChanged();
  }

  entries(): [string, number][] {
    return this.service.getTypeEntries(this.data);
  }

  destroy(): void {
    this.sub?.unsubscribe();
    this.isLoading = false;
  }
}
