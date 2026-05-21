import { Subscription } from 'rxjs';
import { SatelliteLiveShip } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { MapEntityLoadingBridge, SatelliteTrackingViewport } from '../../../models/geo-fencing.models';
import { SatelliteShipTrackingService } from './ship-tracking.service';

export class SatelliteShipTrackingController {
  private trackSub?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly refreshIntervalMs = 8000;
  private service: SatelliteShipTrackingService;
  private loading: MapEntityLoadingBridge;

  enabled = false;
  data: SatelliteLiveShip[] = [];
  error: string | null = null;
  isLoading = false;

  constructor(service: SatelliteShipTrackingService, loading: MapEntityLoadingBridge) {
    this.service = service;
    this.loading = loading;
  }

  toggle(viewport: SatelliteTrackingViewport): void {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.refresh(viewport, false, true);
      return;
    }
    this.stop();
    this.data = [];
    this.error = null;
  }

  refresh(viewport: SatelliteTrackingViewport, showLoading = false, scheduleNext = false): void {
    if (!this.enabled) {
      return;
    }
    this.refreshInBounds(viewport, showLoading, scheduleNext);
  }

  scheduleViewportRefresh(viewport: SatelliteTrackingViewport, delayMs = 500): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.refresh(viewport, false, true);
    }, delayMs);
  }

  destroy(): void {
    this.stop();
  }

  private stop(): void {
    this.trackSub?.unsubscribe();
    clearTimeout(this.timer);
    this.isLoading = false;
  }

  private refreshInBounds(viewport: SatelliteTrackingViewport, showLoading = false, scheduleNext = false): void {
    const showSpinner = showLoading || this.data.length === 0;
    this.isLoading = showSpinner;
    const loadingId = showLoading ? this.loading.begin('Loading Satellite Intel', 'Loading ship tracking data...') : null;

    this.trackSub?.unsubscribe();
    this.trackSub = this.service.pollInBounds(viewport.lat, viewport.lon, viewport.delta).subscribe({
      next: (res) => {
        if (!this.enabled) {
          return;
        }
        const payload = (res?.result ?? res) as any;
        const ships = this.service.extractItems(payload);
        if (ships !== null) {
          this.applyResult(ships, payload, 'Ship tracking');
        }
        const feedIssue = this.service.getFeedIssue(payload);
        if (ships === null && feedIssue) {
          this.error = `Ship tracking: ${feedIssue}`;
        }
      },
      error: (err) => {
        this.error = err?.error?.detail || err?.message || 'Ship tracking failed';
      },
    });
    this.trackSub.add(() => {
      this.isLoading = false;
      if (loadingId !== null) {
        this.loading.end(loadingId);
      }
      if (scheduleNext && this.enabled) {
        this.timer = setTimeout(() => {
          this.refresh(viewport, false, true);
        }, this.refreshIntervalMs);
      }
    });
  }

  private applyResult(ships: SatelliteLiveShip[], payload: any, label: string): void {
    const feedIssue = this.service.getFeedIssue(payload);
    if (ships.length > 0) {
      if (feedIssue && this.shouldKeepLastShips() && ships.length < this.data.length) {
        this.error = `${label}: ${feedIssue}; showing last known ${this.data.length} ships`;
        return;
      }
      this.data = ships;
      this.error = feedIssue ? `${label}: ${feedIssue}` : null;
      return;
    }

    if (feedIssue) {
      if (this.shouldKeepLastShips()) {
        this.error = `${label}: ${feedIssue}; showing last known ${this.data.length} ships`;
        return;
      }
      this.error = `${label}: ${feedIssue}`;
      return;
    }

    if (this.shouldKeepLastShips()) {
      this.error = `${label}: live feed returned 0 ships; showing last known ${this.data.length}`;
      return;
    }

    this.data = [];
    this.error = `${label}: no ships found in this map area`;
  }

  private shouldKeepLastShips(): boolean {
    return this.enabled && this.data.length > 0;
  }
}
