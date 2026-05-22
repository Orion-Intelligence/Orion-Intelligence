import { ComponentRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { SatelliteLiveShip } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteShipTrackingService } from './ship-tracking.service';
import { LeafletComponentRenderer } from '../../map-utils/leaflet-component-renderer';
import { ShipMarkerIconComponent } from './components/ship-marker-icon/ship-marker-icon.component';
import { escapeTooltipText, getBearingDegrees, getMarkerBaseSize, getResponseStatus, isPendingStatus, normalizeEntityId, stableHash } from '../../map-utils/renderer-utils';
import { TrackingSidebarBridge } from '../../../models/geo-fencing.models';

type ShipDenseCell = {
  key: string;
  items: SatelliteLiveShip[];
};

export class ShipMapRenderer {
  private cluster: any = null;
  private renderKey = '';
  private renderTimer: ReturnType<typeof setTimeout> | null = null;
  private renderVersion = 0;
  private markers = new Map<string, any>();
  private markerTargets = new Map<string, string>();
  private animationFrames = new Map<string, { marker: any; startLat: number; startLon: number; targetLat: number; targetLon: number; startedAt: number }>();
  private animationFrame: number | null = null;
  private detailSub?: Subscription;
  private markerZoomBucket = 0;
  private readonly animationDurationMs = 8000;
  private readonly denseShipCellThreshold = 120;
  private readonly denseShipScreenGridSize = 34;
  private readonly maxAnimatedShips = 80;
  private readonly L: any;
  private readonly map: any;
  private readonly service: SatelliteShipTrackingService;
  private readonly sidebar: TrackingSidebarBridge;
  private readonly componentRenderer: LeafletComponentRenderer;
  private readonly getData: () => SatelliteLiveShip[];

  constructor(config: { L: any; map: any; service: SatelliteShipTrackingService; sidebar: TrackingSidebarBridge; componentRenderer: LeafletComponentRenderer; getData: () => SatelliteLiveShip[] }) {
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

    const ships = this.getRenderableShips().filter(ship => Number.isFinite(ship.latitude) && Number.isFinite(ship.longitude));
    if (ships.length > this.maxAnimatedShips) {
      this.cancelAllAnimations();
    }
    const visibleIds = new Set(ships.map(ship => this.getMarkerId(ship)));
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
    this.renderMarkersInChunks(ships, ++this.renderVersion);
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

  destroy(): void {
    this.detailSub?.unsubscribe();
    this.cancelRender();
    this.cancelAllAnimations();
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

  private renderMarkersInChunks(ships: SatelliteLiveShip[], renderVersion: number, startIndex = 0): void {
    if (!this.cluster || renderVersion !== this.renderVersion) {
      return;
    }

    const chunkSize = 160;
    const endIndex = Math.min(startIndex + chunkSize, ships.length);
    for (let index = startIndex; index < endIndex; index += 1) {
      this.upsertMarker(ships[index]);
    }

    if (endIndex < ships.length) {
      this.renderTimer = setTimeout(() => this.renderMarkersInChunks(ships, renderVersion, endIndex), 0);
    }
    else {
      this.renderTimer = null;
    }
  }

  private getMarkerId(ship: SatelliteLiveShip): string {
    return normalizeEntityId(ship.mmsi) ?? `${ship.latitude}:${ship.longitude}`;
  }

  private upsertMarker(ship: SatelliteLiveShip): void {
    if (!this.cluster) {
      return;
    }
    const markerId = this.getMarkerId(ship);
    const existing = this.markers.get(markerId);
    if (!existing) {
      const marker = this.createMarker(ship);
      const mmsiId = normalizeEntityId(ship.mmsi);
      const isSelected = this.isSelected(mmsiId);
      const isLoading = this.isLoading(mmsiId);
      marker.__orionShipIconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
      this.markers.set(markerId, marker);
      this.cluster.addLayer(marker);
      this.updateMarkerMotion(markerId, marker, ship);
      return;
    }

    const mmsiId = normalizeEntityId(ship.mmsi);
    const isSelected = this.isSelected(mmsiId);
    const isLoading = this.isLoading(mmsiId);
    const iconState = `${this.markerZoomBucket}:${isSelected ? 1 : 0}:${isLoading ? 1 : 0}`;
    this.updateMarkerMotion(markerId, existing, ship);

    const rotationDegrees = this.getMovementRotation(existing, ship);
    if (existing.__orionShipIconState !== iconState) {
      const renderedIcon = this.createIcon(ship, isSelected, isLoading, rotationDegrees);
      this.destroyMarkerIcon(existing);
      existing.setIcon(renderedIcon.icon);
      existing.__orionShipIconRef = renderedIcon.componentRef;
      existing.__orionShipIconState = iconState;
      return;
    }

    this.updateMarkerRotation(existing, rotationDegrees);
  }

  private updateMarkerMotion(markerId: string, marker: any, ship: SatelliteLiveShip): void {
    const lat = ship.latitude as number;
    const lon = ship.longitude as number;
    const motionKey = [
      lat,
      lon,
      ship.speed ?? '',
      ship.course ?? ship.true_heading ?? '',
    ].join(':');

    const isSameMotion = this.markerTargets.get(markerId) === motionKey;
    if (isSameMotion && this.animationFrames.has(markerId)) {
      return;
    }
    this.markerTargets.set(markerId, motionKey);

    const current = marker.getLatLng?.();
    const startLat = isSameMotion && Number.isFinite(current?.lat) ? current.lat : lat;
    const startLon = isSameMotion && Number.isFinite(current?.lng) ? current.lng : lon;
    const projectionSource = isSameMotion ? { ...ship, latitude: startLat, longitude: startLon } : ship;

    this.stopAnimation(markerId);
    if (!this.shouldAnimateMarker(ship)) {
      marker.setLatLng([lat, lon]);
      return;
    }

    marker.setLatLng([startLat, startLon]);
    const projected = this.projectPosition(projectionSource, this.animationDurationMs / 1000);
    if (!projected) {
      return;
    }

    this.animateMarker(markerId, marker, projected.lat, projected.lon);
  }

  private projectPosition(ship: SatelliteLiveShip, seconds: number): { lat: number; lon: number } | null {
    const lat = ship.latitude;
    const lon = ship.longitude;
    const speed = ship.speed;
    const bearing = ship.course ?? ship.true_heading;
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isFinite(speed) ||
      !Number.isFinite(bearing) ||
      (speed ?? 0) <= 0
    ) {
      return null;
    }

    const distanceMeters = (speed as number) * 0.514444 * seconds;
    const bearingRadians = ((bearing as number) * Math.PI) / 180;
    const latRadians = ((lat as number) * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLon = Math.max(1, metersPerDegreeLat * Math.cos(latRadians));

    return {
      lat: (lat as number) + (Math.cos(bearingRadians) * distanceMeters) / metersPerDegreeLat,
      lon: (lon as number) + (Math.sin(bearingRadians) * distanceMeters) / metersPerDegreeLon,
    };
  }

  private shouldAnimateMarker(ship: SatelliteLiveShip): boolean {
    const shipId = normalizeEntityId(ship.mmsi);
    return this.markers.size <= this.maxAnimatedShips || this.isSelected(shipId);
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

  private createMarker(ship: SatelliteLiveShip): any {
    const mmsiId = normalizeEntityId(ship.mmsi);
    const isSelected = this.isSelected(mmsiId);
    const isLoading = this.isLoading(mmsiId);
    const renderedIcon = this.createIcon(ship, isSelected, isLoading);
    const marker = this.L.marker([ship.latitude!, ship.longitude!], {
      icon: renderedIcon.icon,
    });
    marker.__orionShipIconRef = renderedIcon.componentRef;
    if (mmsiId) {
      marker.bindTooltip(`${escapeTooltipText(mmsiId)}`, {
        direction: 'top',
        offset:    [0, -10],
        opacity:   0.95,
        sticky:    true,
      });
    }
    if (ship.mmsi) {
      marker.on('click', () => this.loadDetails(ship));
    }
    return marker;
  }

  private loadDetails(seed: SatelliteLiveShip): void {
    const markerId = normalizeEntityId(seed.mmsi);
    if (!markerId || !seed.mmsi) {
      return;
    }
    const token = this.sidebar.openLoading('ship', markerId, seed);
    this.detailSub?.unsubscribe();
    this.detailSub = this.service.pollByMMSI(seed.mmsi).subscribe({
      next: (res) => {
        if (!this.sidebar.isCurrentRequestToken(token)) {
          return;
        }
        const ship = this.extractDetails(res);
        const status = getResponseStatus(res);
        if (ship) {
          this.sidebar.openData('ship', ship);
        }
        else if (isPendingStatus(status)) {
          return;
        }
        else {
          this.sidebar.openError('ship', markerId, 'Unable to load ship details');
        }
      },
      error: (err) => {
        if (!this.sidebar.isCurrentRequestToken(token)) {
          return;
        }
        this.sidebar.openError('ship', markerId, err?.error?.detail || err?.message || 'Ship details request failed');
      },
    });
  }

  private getMovementRotation(marker: any, ship: SatelliteLiveShip): number {
    if (Number.isFinite(ship.course)) {
      return ship.course as number;
    }
    if (Number.isFinite(ship.true_heading)) {
      return ship.true_heading as number;
    }

    const current = marker.getLatLng?.();
    const targetLat = ship.latitude;
    const targetLon = ship.longitude;
    if (
      current &&
      Number.isFinite(current.lat) &&
      Number.isFinite(current.lng) &&
      Number.isFinite(targetLat) &&
      Number.isFinite(targetLon)
    ) {
      const bearing = getBearingDegrees(current.lat, current.lng, targetLat as number, targetLon as number);
      if (bearing !== null) {
        return bearing;
      }
    }

    return 0;
  }

  private createIcon(ship: SatelliteLiveShip, isSelected: boolean, isLoading: boolean, rotationDegrees = Number.isFinite(ship.course) ? ship.course as number : Number.isFinite(ship.true_heading) ? ship.true_heading as number : 0): { icon: any; componentRef: ComponentRef<ShipMarkerIconComponent> } {
    const size = getMarkerBaseSize(this.map, 'ship');
    const half = Math.round(size / 2);
    const rendered = this.componentRenderer.create(ShipMarkerIconComponent, {
      strokeColor: isSelected ? '#dbeafe' : '#0ea5e9',
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
    this.componentRenderer.destroy(marker.__orionShipIconRef);
    marker.__orionShipIconRef = null;
  }

  private updateMarkerRotation(marker: any, rotationDegrees: number): void {
    const componentRef = marker.__orionShipIconRef as ComponentRef<ShipMarkerIconComponent> | null | undefined;
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

  private getRenderableShips(): SatelliteLiveShip[] {
    const bounds = this.map?.getBounds?.();
    const zoom = this.map?.getZoom?.() ?? 3;
    const visible = this.getData().filter(ship => {
      if (!Number.isFinite(ship.latitude) || !Number.isFinite(ship.longitude)) {
        return false;
      }
      if (!bounds) {
        return true;
      }
      return bounds.pad(0.18).contains([ship.latitude, ship.longitude]);
    });
    return this.limitShipsForZoom(this.reduceVeryDenseShipCells(visible), zoom);
  }

  private limitShipsForZoom(ships: SatelliteLiveShip[], zoom: number): SatelliteLiveShip[] {
    const limit = this.getViewportShipLimit(zoom);
    if (ships.length <= limit) {
      return ships;
    }

    const activeEntity = this.sidebar.getActiveEntity();
    const loadingEntity = this.sidebar.getLoadingEntity();
    const activeShipId = activeEntity?.type === 'ship' ? activeEntity.id : '';
    const loadingShipId = loadingEntity?.type === 'ship' ? loadingEntity.id : '';
    const preserved = ships.filter(ship => {
      const id = normalizeEntityId(ship.mmsi);
      return !!id && (id === activeShipId || id === loadingShipId);
    });
    const preservedIds = new Set(preserved.map(ship => normalizeEntityId(ship.mmsi)).filter((id): id is string => !!id));
    const selected = ships
      .filter(ship => !preservedIds.has(normalizeEntityId(ship.mmsi) ?? ''))
      .slice()
      .sort((left, right) => Math.abs(stableHash(this.getStableShipKey(left))) - Math.abs(stableHash(this.getStableShipKey(right))))
      .slice(0, Math.max(0, limit - preserved.length));

    return [...preserved, ...selected];
  }

  private getViewportShipLimit(zoom: number): number {
    if (zoom >= 9) {
      return 1400;
    }
    if (zoom >= 8) {
      return 1000;
    }
    if (zoom >= 7) {
      return 760;
    }
    if (zoom >= 6) {
      return 560;
    }
    if (zoom >= 5) {
      return 400;
    }
    if (zoom >= 4) {
      return 300;
    }
    return 220;
  }

  private reduceVeryDenseShipCells(ships: SatelliteLiveShip[]): SatelliteLiveShip[] {
    if (ships.length <= 1200) {
      return ships;
    }

    const cells = new Map<string, ShipDenseCell>();
    ships.forEach(ship => {
      const key = this.getDenseShipCellKey(ship);
      const cell = cells.get(key) ?? { key, items: [] };
      cell.items.push(ship);
      cells.set(key, cell);
    });

    const reduced: SatelliteLiveShip[] = [];
    cells.forEach(cell => {
      if (cell.items.length <= this.denseShipCellThreshold) {
        reduced.push(...cell.items);
        return;
      }

      reduced.push(...this.takeDenseShipCellSubset(cell.items));
    });

    return reduced;
  }

  private takeDenseShipCellSubset(ships: SatelliteLiveShip[]): SatelliteLiveShip[] {
    const activeEntity = this.sidebar.getActiveEntity();
    const loadingEntity = this.sidebar.getLoadingEntity();
    const activeShipId = activeEntity?.type === 'ship' ? activeEntity.id : '';
    const loadingShipId = loadingEntity?.type === 'ship' ? loadingEntity.id : '';
    const preserved = ships.filter(ship => {
      const id = normalizeEntityId(ship.mmsi);
      return !!id && (id === activeShipId || id === loadingShipId);
    });
    const preservedIds = new Set(preserved.map(ship => normalizeEntityId(ship.mmsi)).filter((id): id is string => !!id));
    const keepCount = Math.max(this.denseShipCellThreshold, preserved.length);
    const selected = ships
      .filter(ship => !preservedIds.has(normalizeEntityId(ship.mmsi) ?? ''))
      .slice()
      .sort((left, right) => Math.abs(stableHash(this.getStableShipKey(left))) - Math.abs(stableHash(this.getStableShipKey(right))))
      .slice(0, Math.max(0, keepCount - preserved.length));

    return [...preserved, ...selected];
  }

  private getDenseShipCellKey(ship: SatelliteLiveShip): string {
    if (this.map?.latLngToContainerPoint && Number.isFinite(ship.latitude) && Number.isFinite(ship.longitude)) {
      const point = this.map.latLngToContainerPoint([ship.latitude, ship.longitude]);
      if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
        const row = Math.floor(point.y / this.denseShipScreenGridSize);
        const col = Math.floor(point.x / this.denseShipScreenGridSize);
        return `screen:${this.denseShipScreenGridSize}:${row}:${col}`;
      }
    }

    return `geo:${Math.floor(((ship.latitude as number) + 90) / 0.25)}:${Math.floor(((ship.longitude as number) + 180) / 0.25)}`;
  }

  private getStableShipKey(ship: SatelliteLiveShip): string {
    return normalizeEntityId(ship.mmsi) ?? `${ship.latitude}:${ship.longitude}`;
  }

  private extractDetails(res: any): SatelliteLiveShip | null {
    const payload = res?.result ?? res;
    const ships = this.service.extractItems(payload);
    if (ships?.length) {
      return ships[0];
    }
    if (Array.isArray(payload?.ships) && payload.ships.length > 0) {
      return payload.ships[0] as SatelliteLiveShip;
    }
    if (payload?.ship && typeof payload.ship === 'object' && !Array.isArray(payload.ship)) {
      return payload.ship as SatelliteLiveShip;
    }
    if (payload?.ships && typeof payload.ships === 'object' && !Array.isArray(payload.ships)) {
      return payload.ships as SatelliteLiveShip;
    }
    if (payload && typeof payload === 'object' && payload.mmsi != null) {
      return payload as SatelliteLiveShip;
    }
    if (res && typeof res === 'object' && res.mmsi != null) {
      return res as SatelliteLiveShip;
    }
    return null;
  }

  private isSelected(id: string | null): boolean {
    const activeEntity = this.sidebar.getActiveEntity();
    return !!id && activeEntity?.type === 'ship' && activeEntity.id === id;
  }

  private isLoading(id: string | null): boolean {
    const loadingEntity = this.sidebar.getLoadingEntity();
    return !!id && loadingEntity?.type === 'ship' && loadingEntity.id === id;
  }
}
