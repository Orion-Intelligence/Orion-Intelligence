import { ComponentRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { SatelliteLiveAircraft } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteAircraftTrackingService } from './aircraft-tracking.service';
import { AircraftMarkerIconComponent } from './components/aircraft-marker-icon/aircraft-marker-icon.component';
import { LeafletComponentRenderer } from '../../map-utils/leaflet-component-renderer';
import { escapeTooltipText, getBearingDegrees, getGridBucketKey, getMarkerBaseSize, getResponseStatus, isPendingStatus, normalizeEntityId, sampleByBucket } from '../../map-utils/renderer-utils';
import { TrackingSidebarBridge } from '../../../models/geo-fencing.models';

export class AircraftMapRenderer {
  private cluster: any = null;
  private renderKey = '';
  private renderTimer: ReturnType<typeof setTimeout> | null = null;
  private renderVersion = 0;
  private markers = new Map<string, any>();
  private markerTargets = new Map<string, string>();
  private trackLine: any = null;
  private animationFrames = new Map<string, { marker: any; startLat: number; startLon: number; targetLat: number; targetLon: number; startedAt: number }>();
  private animationFrame: number | null = null;
  private detailSub?: Subscription;
  private markerZoomBucket = 0;
  private readonly animationDurationMs = 8000;
  private readonly L: any;
  private readonly map: any;
  private readonly service: SatelliteAircraftTrackingService;
  private readonly sidebar: TrackingSidebarBridge;
  private readonly componentRenderer: LeafletComponentRenderer;
  private readonly getData: () => SatelliteLiveAircraft[];

  constructor(config: { L: any; map: any; service: SatelliteAircraftTrackingService; sidebar: TrackingSidebarBridge; componentRenderer: LeafletComponentRenderer; getData: () => SatelliteLiveAircraft[] }) {
    this.L = config.L;
    this.map = config.map;
    this.service = config.service;
    this.sidebar = config.sidebar;
    this.componentRenderer = config.componentRenderer;
    this.getData = config.getData;
  }

  init(): void {
    if (!this.L || !this.map || this.cluster) {
      return;
    }
    this.cluster = this.L.layerGroup().addTo(this.map);
  }

  render(): void {
    if (!this.cluster) {
      return;
    }

    const renderKey = this.getRenderKey();
    if (renderKey === this.renderKey) {
      return;
    }
    this.renderKey = renderKey;

    const aircraft = this.getRenderableAircraft().filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    const visibleIds = new Set(aircraft.map(item => this.getMarkerId(item)));
    for (const [markerId, marker] of Array.from(this.markers.entries())) {
      if (visibleIds.has(markerId)) {
        continue;
      }
      this.stopAnimation(markerId);
      this.destroyMarkerIcon(marker);
      this.cluster.removeLayer(marker);
      this.markers.delete(markerId);
      this.markerTargets.delete(markerId);
    }

    this.cancelRender();
    this.renderMarkersInChunks(aircraft, ++this.renderVersion);
  }

  resetRenderKey(): void {
    this.renderKey = '';
  }

  setMarkerZoomBucket(bucket: number): void {
    if (bucket === this.markerZoomBucket) {
      return;
    }
    this.markerZoomBucket = bucket;
    this.resetRenderKey();
    this.render();
  }

  refreshSelectionState(): void {
    this.resetRenderKey();
    this.render();
  }

  clearTrack(): void {
    if (this.trackLine) {
      this.map?.removeLayer(this.trackLine);
      this.trackLine = null;
    }
  }

  destroy(): void {
    this.detailSub?.unsubscribe();
    this.cancelRender();
    this.cancelAllAnimations();
    this.clearTrack();
    if (this.cluster) {
      this.map?.removeLayer(this.cluster);
      this.cluster = null;
    }
    Array.from(this.markers.values()).forEach((marker) => this.destroyMarkerIcon(marker));
    this.markers.clear();
    this.markerTargets.clear();
  }

  private cancelRender(): void {
    this.renderVersion += 1;
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
      this.renderTimer = null;
    }
  }

  private renderMarkersInChunks(aircraft: SatelliteLiveAircraft[], renderVersion: number, startIndex = 0): void {
    if (!this.cluster || renderVersion !== this.renderVersion) {
      return;
    }

    const chunkSize = 140;
    const endIndex = Math.min(startIndex + chunkSize, aircraft.length);
    for (let index = startIndex; index < endIndex; index += 1) {
      this.upsertMarker(aircraft[index]);
    }

    if (endIndex < aircraft.length) {
      this.renderTimer = setTimeout(() => this.renderMarkersInChunks(aircraft, renderVersion, endIndex), 0);
    }
    else {
      this.renderTimer = null;
    }
  }

  private getMarkerId(aircraft: SatelliteLiveAircraft): string {
    return normalizeEntityId(aircraft.icao24) ?? `${aircraft.latitude}:${aircraft.longitude}`;
  }

  private upsertMarker(aircraft: SatelliteLiveAircraft): void {
    if (!this.cluster) {
      return;
    }
    const markerId = this.getMarkerId(aircraft);
    const existing = this.markers.get(markerId);
    if (!existing) {
      const marker = this.createMarker(aircraft);
      const icaoId = normalizeEntityId(aircraft.icao24);
      const isSelected = this.isSelected(icaoId);
      const isLoading = this.isLoading(icaoId);
      marker.__orionAircraftIconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
      this.markers.set(markerId, marker);
      this.cluster.addLayer(marker);
      this.updateMarkerMotion(markerId, marker, aircraft);
      this.extendSelectedTrack(aircraft, icaoId);
      return;
    }

    const icaoId = normalizeEntityId(aircraft.icao24);
    const isSelected = this.isSelected(icaoId);
    const isLoading = this.isLoading(icaoId);
    const iconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
    this.updateMarkerMotion(markerId, existing, aircraft);
    this.extendSelectedTrack(aircraft, icaoId);

    const rotationDegrees = this.getMovementRotation(existing, aircraft);
    if (existing.__orionAircraftIconState !== iconState) {
      const renderedIcon = this.createIcon(aircraft, isSelected, isLoading, rotationDegrees);
      this.destroyMarkerIcon(existing);
      existing.setIcon(renderedIcon.icon);
      existing.__orionAircraftIconRef = renderedIcon.componentRef;
      existing.__orionAircraftIconState = iconState;
      return;
    }

    this.updateMarkerRotation(existing, rotationDegrees);
  }

  private updateMarkerMotion(markerId: string, marker: any, aircraft: SatelliteLiveAircraft): void {
    const lat = aircraft.latitude as number;
    const lon = aircraft.longitude as number;
    const motionKey = [
      lat,
      lon,
      aircraft.velocity ?? '',
      aircraft.true_track ?? '',
      aircraft.on_ground ?? '',
    ].join(':');

    const isSameMotion = this.markerTargets.get(markerId) === motionKey;
    if (isSameMotion && this.animationFrames.has(markerId)) {
      return;
    }
    this.markerTargets.set(markerId, motionKey);

    const current = marker.getLatLng?.();
    const startLat = isSameMotion && Number.isFinite(current?.lat) ? current.lat : lat;
    const startLon = isSameMotion && Number.isFinite(current?.lng) ? current.lng : lon;
    const projectionSource = isSameMotion ? { ...aircraft, latitude: startLat, longitude: startLon } : aircraft;

    this.stopAnimation(markerId);
    marker.setLatLng([startLat, startLon]);
    const projected = this.projectPosition(projectionSource, this.animationDurationMs / 1000);
    if (!projected) {
      return;
    }

    this.animateMarker(markerId, marker, projected.lat, projected.lon);
  }

  private projectPosition(aircraft: SatelliteLiveAircraft, seconds: number): { lat: number; lon: number } | null {
    const lat = aircraft.latitude;
    const lon = aircraft.longitude;
    const velocity = aircraft.velocity;
    const bearing = aircraft.true_track;
    if (
      aircraft.on_ground ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isFinite(velocity) ||
      !Number.isFinite(bearing) ||
      (velocity ?? 0) <= 0
    ) {
      return null;
    }

    const distanceMeters = (velocity as number) * seconds;
    const bearingRadians = ((bearing as number) * Math.PI) / 180;
    const latRadians = ((lat as number) * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLon = Math.max(1, metersPerDegreeLat * Math.cos(latRadians));

    return {
      lat: (lat as number) + (Math.cos(bearingRadians) * distanceMeters) / metersPerDegreeLat,
      lon: (lon as number) + (Math.sin(bearingRadians) * distanceMeters) / metersPerDegreeLon,
    };
  }

  private animateMarker(markerId: string, marker: any, targetLat: number, targetLon: number): void {
    if (typeof window === 'undefined') {
      marker.setLatLng([targetLat, targetLon]);
      return;
    }

    this.stopAnimation(markerId);

    const current = marker.getLatLng();
    const startLat = current.lat;
    const startLon = current.lng;
    const deltaLat = targetLat - startLat;
    const deltaLon = targetLon - startLon;

    if (Math.abs(deltaLat) < 0.000001 && Math.abs(deltaLon) < 0.000001) {
      marker.setLatLng([targetLat, targetLon]);
      return;
    }

    this.animationFrames.set(markerId, {
      marker,
      startLat,
      startLon,
      targetLat,
      targetLon,
      startedAt: window.performance.now(),
    });

    if (this.animationFrame !== null) {
      return;
    }

    const step = (timestamp: number) => {
      for (const [id, animation] of Array.from(this.animationFrames.entries())) {
        const progress = Math.min(1, (timestamp - animation.startedAt) / this.animationDurationMs);
        animation.marker.setLatLng([
          animation.startLat + (animation.targetLat - animation.startLat) * progress,
          animation.startLon + (animation.targetLon - animation.startLon) * progress,
        ]);

        if (progress >= 1) {
          this.animationFrames.delete(id);
        }
      }

      if (this.animationFrames.size > 0) {
        this.animationFrame = window.requestAnimationFrame(step);
        return;
      }

      this.animationFrame = null;
    };

    this.animationFrame = window.requestAnimationFrame(step);
  }

  private stopAnimation(markerId: string): void {
    this.animationFrames.delete(markerId);
    if (this.animationFrames.size === 0 && this.animationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private cancelAllAnimations(): void {
    this.animationFrames.clear();
    if (this.animationFrame !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private createMarker(aircraft: SatelliteLiveAircraft): any {
    const icaoId = normalizeEntityId(aircraft.icao24);
    const isSelected = this.isSelected(icaoId);
    const isLoading = this.isLoading(icaoId);
    const renderedIcon = this.createIcon(aircraft, isSelected, isLoading);
    const marker = this.L.marker([aircraft.latitude, aircraft.longitude], {
      icon: renderedIcon.icon,
    });
    marker.__orionAircraftIconRef = renderedIcon.componentRef;
    if (icaoId) {
      marker.bindTooltip(`${escapeTooltipText(icaoId)}`, {
        direction: 'top',
        offset:    [0, -10],
        opacity:   0.95,
        sticky:    true,
      });
    }
    if (aircraft.icao24) {
      marker.on('click', () => this.loadDetails(aircraft));
    }
    return marker;
  }

  private loadDetails(seed: SatelliteLiveAircraft): void {
    const markerId = normalizeEntityId(seed.icao24);
    if (!markerId || !seed.icao24) {
      return;
    }
    const token = this.sidebar.openLoading('aircraft', markerId, seed);
    this.detailSub?.unsubscribe();
    this.detailSub = this.service.pollByICAO(seed.icao24).subscribe({
      next: (res) => {
        if (!this.sidebar.isCurrentRequestToken(token)) {
          return;
        }
        const aircraft = this.extractDetails(res);
        const status = getResponseStatus(res);
        if (aircraft) {
          this.renderTrack(aircraft);
          this.sidebar.openData('aircraft', aircraft);
        }
        else if (isPendingStatus(status)) {
          return;
        }
        else {
          this.sidebar.openError('aircraft', markerId, 'Unable to load aircraft details');
        }
      },
      error: (err) => {
        if (!this.sidebar.isCurrentRequestToken(token)) {
          return;
        }
        this.sidebar.openError('aircraft', markerId, err?.error?.detail || err?.message || 'Aircraft details request failed');
      },
    });
  }

  private getMovementRotation(marker: any, aircraft: SatelliteLiveAircraft): number {
    if (Number.isFinite(aircraft.true_track)) {
      return this.toCssRotation(aircraft.true_track);
    }

    const current = marker.getLatLng?.();
    const targetLat = aircraft.latitude;
    const targetLon = aircraft.longitude;
    if (
      current &&
      Number.isFinite(current.lat) &&
      Number.isFinite(current.lng) &&
      Number.isFinite(targetLat) &&
      Number.isFinite(targetLon)
    ) {
      const bearing = getBearingDegrees(current.lat, current.lng, targetLat as number, targetLon as number);
      if (bearing !== null) {
        return this.toCssRotation(bearing);
      }
    }

    return this.toCssRotation(aircraft.true_track);
  }

  private toCssRotation(track: number | null | undefined): number {
    return Number.isFinite(track) ? track as number : 0;
  }

  private createIcon(aircraft: SatelliteLiveAircraft, isSelected: boolean, isLoading: boolean, rotationDegrees = this.toCssRotation(aircraft.true_track)): { icon: any; componentRef: ComponentRef<AircraftMarkerIconComponent> } {
    const size = getMarkerBaseSize(this.map, 'aircraft');
    const half = Math.round(size / 2);
    const altitudeFeet = ((aircraft.baro_altitude ?? aircraft.geo_altitude ?? 0) as number) * 3.28084;
    const altitudeFill = aircraft.on_ground
      ? '#6b7280'
      : altitudeFeet < 3000
        ? '#f97316'
        : altitudeFeet < 10000
          ? '#facc15'
          : altitudeFeet < 18000
            ? '#22c55e'
            : altitudeFeet < 25000
              ? '#06b6d4'
              : altitudeFeet < 35000
                ? '#2563eb'
                : altitudeFeet < 45000
                  ? '#a855f7'
                  : '#ef4444';
    const iconFill = isSelected ? '#ef4444' : altitudeFill;
    const strokeColor = isSelected ? '#fee2e2' : '#020617';

    const rendered = this.componentRenderer.create(AircraftMarkerIconComponent, {
      iconFill,
      strokeColor,
      rotationDegrees,
      isLoading,
      isSelected,
    });

    return {
      icon: this.L.divIcon({
        html: rendered.element,
        className: 'bg-transparent border-0',
        iconSize: [size, size],
        iconAnchor: [half, half],
      }),
      componentRef: rendered.componentRef,
    };
  }

  private destroyMarkerIcon(marker: any): void {
    this.componentRenderer.destroy(marker.__orionAircraftIconRef);
    marker.__orionAircraftIconRef = null;
  }

  private updateMarkerRotation(marker: any, rotationDegrees: number): void {
    const componentRef = marker.__orionAircraftIconRef as ComponentRef<AircraftMarkerIconComponent> | null | undefined;
    if (componentRef) {
      componentRef.instance.rotationDegrees = rotationDegrees;
      componentRef.changeDetectorRef.detectChanges();
    }
  }

  private getRenderKey(): string {
    const zoom = this.map?.getZoom?.() ?? 3;
    const bounds = this.map?.getBounds?.();
    const data = this.getData();
    const activeEntity = this.sidebar.getActiveEntity();
    const loadingEntity = this.sidebar.getLoadingEntity();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|sel:${activeEntity?.id || ''}|load:${loadingEntity?.id || ''}|count:${data.length}`;
    }
    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `sel:${activeEntity?.id || ''}`,
      `load:${loadingEntity?.id || ''}`,
      `count:${data.length}`,
    ].join('|');
  }

  private getRenderableAircraft(): SatelliteLiveAircraft[] {
    const bounds = this.map?.getBounds?.();
    const zoom = this.map?.getZoom?.() ?? 3;
    const visible = this.getData().filter(aircraft => {
      if (!Number.isFinite(aircraft.latitude) || !Number.isFinite(aircraft.longitude)) {
        return false;
      }
      if (!bounds) {
        return true;
      }
      return bounds.pad(0.18).contains([aircraft.latitude, aircraft.longitude]);
    });
    const sampleRatio = this.getSampleRatio(zoom);
    if (sampleRatio >= 1) {
      return visible;
    }
    return sampleByBucket(visible, sampleRatio, aircraft => this.getSampleBucketKey(aircraft), aircraft => normalizeEntityId(aircraft.icao24) ?? `${aircraft.latitude}:${aircraft.longitude}`);
  }

  private getSampleRatio(zoom: number): number {
    if (zoom >= 8) {
      return 1;
    }
    if (zoom >= 7) {
      return 0.82;
    }
    if (zoom >= 6) {
      return 0.58;
    }
    if (zoom >= 5) {
      return 0.3;
    }
    if (zoom >= 4) {
      return 0.15;
    }
    if (zoom >= 3) {
      return 0.1;
    }
    return 0.1;
  }

  private getSampleBucketKey(aircraft: SatelliteLiveAircraft): string {
    const originCountry = aircraft.origin_country?.trim();
    if (originCountry) {
      return `origin:${originCountry.toLowerCase()}`;
    }

    if (Number.isFinite(aircraft.latitude) && Number.isFinite(aircraft.longitude)) {
      return getGridBucketKey(aircraft.latitude as number, aircraft.longitude as number);
    }

    return 'origin:unknown';
  }

  private extractDetails(res: any): SatelliteLiveAircraft | null {
    const payload = res?.result ?? res;
    if (Array.isArray(payload?.aircraft) && payload.aircraft.length > 0) {
      return payload.aircraft[0] as SatelliteLiveAircraft;
    }
    if (payload?.aircrafts && Array.isArray(payload.aircrafts) && payload.aircrafts.length > 0) {
      return payload.aircrafts[0] as SatelliteLiveAircraft;
    }
    if (payload?.aircraft && typeof payload.aircraft === 'object' && !Array.isArray(payload.aircraft)) {
      return {
        ...payload.aircraft,
        ...(payload.track ? { track: payload.track } : {}),
        ...(payload.path ? { path: payload.path } : {}),
      } as SatelliteLiveAircraft;
    }
    if (payload && typeof payload === 'object' && payload.icao24 != null) {
      return payload as SatelliteLiveAircraft;
    }
    if (res && typeof res === 'object' && res.icao24 != null) {
      return res as SatelliteLiveAircraft;
    }
    return null;
  }

  private renderTrack(aircraft: any): void {
    const path = aircraft?.track?.path || aircraft?.path;
    this.clearTrack();
    if (!this.map || !this.L || !Array.isArray(path) || path.length < 2) {
      return;
    }
    const points = path
      .map((point: any) => Array.isArray(point) && Number.isFinite(point[1]) && Number.isFinite(point[2]) ? [point[1], point[2]] : null)
      .filter(Boolean);
    if (points.length < 2) {
      return;
    }
    this.trackLine = this.L.polyline(points, {
      color: '#facc15',
      weight: 4,
      opacity: 0.95,
      dashArray: '10 8',
      lineCap: 'butt',
      interactive: false,
    }).addTo(this.map);
    this.trackLine.bringToFront?.();
  }

  private extendSelectedTrack(aircraft: SatelliteLiveAircraft, icaoId: string | null): void {
    if (!this.isSelected(icaoId) || !this.trackLine || !Number.isFinite(aircraft.latitude) || !Number.isFinite(aircraft.longitude)) {
      return;
    }
    const points = this.trackLine.getLatLngs?.() || [];
    const last = points[points.length - 1];
    if (!last || Math.abs(last.lat - (aircraft.latitude as number)) > 0.00001 || Math.abs(last.lng - (aircraft.longitude as number)) > 0.00001) {
      this.trackLine.addLatLng([aircraft.latitude, aircraft.longitude]);
      this.trackLine.bringToFront?.();
    }
  }

  private isSelected(id: string | null): boolean {
    const activeEntity = this.sidebar.getActiveEntity();
    return !!id && activeEntity?.type === 'aircraft' && activeEntity.id === id;
  }

  private isLoading(id: string | null): boolean {
    const loadingEntity = this.sidebar.getLoadingEntity();
    return !!id && loadingEntity?.type === 'aircraft' && loadingEntity.id === id;
  }
}
