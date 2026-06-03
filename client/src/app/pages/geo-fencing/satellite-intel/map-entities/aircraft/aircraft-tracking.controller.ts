import { Subscription } from 'rxjs';
import { SatelliteLiveAircraft } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { MapEntityLoadingBridge, SatelliteTrackingViewport } from '../../../models/geo-fencing.models';
import { SatelliteAircraftTrackingService } from './aircraft-tracking.service';

export class SatelliteAircraftTrackingController {
  private trackSub?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;
  private readonly refreshIntervalMs = 8000;
  private service: SatelliteAircraftTrackingService;
  private loading: MapEntityLoadingBridge;

  enabled = false;
  data: SatelliteLiveAircraft[] = [];
  error: string | null = null;
  isLoading = false;

  constructor(service: SatelliteAircraftTrackingService, loading: MapEntityLoadingBridge) {
    this.service = service;
    this.loading = loading;
  }

  toggle(viewport: SatelliteTrackingViewport, scoped = false): void {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (scoped) {
        this.refresh(viewport, false, true);
      }
      else {
        this.refreshGlobal(false, true);
      }
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

  refreshGlobalTracking(scheduleNext = false): void {
    if (!this.enabled) {
      return;
    }
    this.refreshGlobal(false, scheduleNext);
  }

  destroy(): void {
    this.stop();
  }

  clear(): void {
    this.enabled = false;
    this.stop();
    this.data = [];
    this.error = null;
  }

  private stop(): void {
    this.trackSub?.unsubscribe();
    clearTimeout(this.timer);
    this.isLoading = false;
  }

  private refreshInBounds(viewport: SatelliteTrackingViewport, showLoading = false, scheduleNext = false): void {
    clearTimeout(this.timer);
    const showSpinner = showLoading || this.data.length === 0;
    this.isLoading = showSpinner;
    const loadingId = showLoading ? this.loading.begin('Loading Satellite Intel', 'Loading aircraft tracking data...') : null;

    this.trackSub?.unsubscribe();
    clearTimeout(this.timer);
    this.trackSub = this.service.pollInBounds(viewport.lat, viewport.lon, viewport.delta).subscribe({
      next: (res) => {
        if (!this.enabled) {
          return;
        }
        const payload = (res?.result ?? res) as any;
        const aircraft = this.service.extractItems(payload);
        if (aircraft !== null) {
          this.applyResult(aircraft, payload, 'Aircraft tracking');
        }
        const feedIssue = this.service.getFeedIssue(payload);
        if (aircraft === null && feedIssue) {
          this.error = `Aircraft tracking: ${feedIssue}`;
        }
      },
      error: (err) => {
        this.error = err?.error?.detail || err?.message || 'Aircraft tracking failed';
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

  private refreshGlobal(showLoading = false, scheduleNext = false): void {
    clearTimeout(this.timer);
    this.isLoading = true;
    const loadingId = showLoading ? this.loading.begin('Loading Satellite Intel', 'Loading global aircraft tracking data...') : null;

    this.trackSub?.unsubscribe();
    clearTimeout(this.timer);
    this.trackSub = this.service.pollGlobal().subscribe({
      next: (res) => {
        if (!this.enabled) {
          return;
        }
        const payload = (res?.result ?? res) as any;
        const aircraft = this.service.extractItems(payload);
        if (aircraft !== null) {
          this.applyResult(aircraft, payload, 'Global aircraft tracking');
        }
        const feedIssue = this.service.getFeedIssue(payload);
        if (aircraft === null && feedIssue) {
          this.error = `Global aircraft tracking: ${feedIssue}`;
        }
      },
      error: (err) => {
        this.error = err?.error?.detail || err?.message || 'Global aircraft tracking failed';
      },
    });
    this.trackSub.add(() => {
      this.isLoading = false;
      if (loadingId !== null) {
        this.loading.end(loadingId);
      }
      if (scheduleNext && this.enabled) {
        this.timer = setTimeout(() => {
          this.refreshGlobal(false, true);
        }, this.refreshIntervalMs);
      }
    });
  }

  private applyResult(aircraft: SatelliteLiveAircraft[], payload: any, label: string): void {
    this.data = aircraft;
    const feedIssue = this.service.getFeedIssue(payload);
    this.error = feedIssue ? `${label}: ${feedIssue}` : null;
  }
}
