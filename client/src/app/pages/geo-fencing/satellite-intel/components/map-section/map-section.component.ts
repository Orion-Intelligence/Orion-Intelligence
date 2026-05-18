import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { geoContains } from 'd3-geo';
import { feature as topojsonFeature } from 'topojson-client';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteIntelService } from '../../satellite-intel-service';
import { ORION_POWER_FILTERS, OrionSatelliteFilterOption } from '../../model/satellite-intel.model';

@Component({
  selector:    'app-satellite-map-section',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './map-section.component.html',
  host:        {
    'class': 'block h-full w-full',
  },
})
export class MapSectionComponent implements AfterViewInit, OnChanges, OnDestroy {
  private static readonly WORLD_BOUNDS = [[-85.05112878, -180], [85.05112878, 180]] as const;
  @ViewChild('mapContainer') private mapContainer?: ElementRef<HTMLDivElement>;
  private leafletMap: any   = null;
  private esriLayer: any    = null;
  private esriLowResLayer: any = null;
  private osmLayer: any     = null;
  private osmLowResLayer: any = null;
  private facLayer: any     = null;
  private anomalyLayer: any = null;
  private orionCluster: any = null;
  private countryBoundaryLayer: any = null;
  private countryHighlightLayer: any = null;
  private countryHoverLayer: any = null;
  private orionMarkers = new Map<string, any>();
  private orionMarkerSignatures = new Map<string, string>();
  private clickMarker: any  = null;
  private L: any            = null;
  private moveTimer: any    = null;
  private resizeObserver: ResizeObserver | null = null;
  private aircraftCluster!: any;
  private sidebarRequestToken = 0;
  private markerZoomBucket = 0;
  private aircraftRenderKey = '';
  private shipRenderKey = '';
  private orionRenderKey = '';
  private orionRenderVersion = 0;
  private orionRenderTimer: ReturnType<typeof setTimeout> | null = null;
  private shipCluster!: any;
  private worldCountryFeatures: any[] = [];
  private highlightedCountryFeature: any | null = null;

  zoomLabel = 'zoom 2.5';
  isMapFeaturesHovered = false;
  selectedEntity: { type: 'aircraft' | 'ship'; data: any | null } | null = null;
  sidebarVisible = false;
  sidebarLoading = false;
  sidebarError: string | null = null;
  activeEntity: { type: 'aircraft' | 'ship'; id: string } | null = null;
  loadingEntity: { type: 'aircraft' | 'ship'; id: string } | null = null;

  @Input() legendFilters: OrionSatelliteFilterOption[] = ORION_POWER_FILTERS;
  @Input() isScanning       = false;
  @Input() progress         = 0;
  @Input() currentStep      = '';
  @Input() progressSegments: number[] = [];
  @Input() errorMessage:     string | null = null;
  @Input() hasSearched      = false;
  @Input() lat:              number | null = null;
  @Input() lon:              number | null = null;
  @Input() delta             = 0.05;
  @Input() selectedLayer:    'esri' | 'osm' = 'esri';
  @Input() facilitiesVisible = true;
  @Input() facilitiesData:   any | null = null;
  @Input() anomalyData:      any | null = null;
  @Input() aircraftData:     SatelliteLiveAircraft[] = [];
  @Input() shipsData:        SatelliteLiveShip[]     = [];
  @Input() orionData:        any[] = [];
  @Input() focusedFeature:   any = null;

  @Output() mapMoved  = new EventEmitter<{ lat: number; lon: number; zoom: number }>();
  @Output() featureSelected = new EventEmitter<any>();
  @Output() featureIdsSelected = new EventEmitter<string[]>();

  constructor(private satelliteService: SatelliteIntelService, private cd: ChangeDetectorRef, private ngZone: NgZone) {}

  openSidebarLoading(type: 'aircraft' | 'ship', id: string, seedData: any) {
    const token = ++this.sidebarRequestToken;
    this.ngZone.run(() => {
      this.selectedEntity  = { type, data: seedData ?? null };
      this.sidebarVisible  = true;
      this.sidebarLoading  = true;
      this.sidebarError    = null;
      this.activeEntity    = { type, id };
      this.loadingEntity   = { type, id };
      this.refreshSelectionState();
      this.cd.detectChanges();
    });
    return token;
  }

  openSidebar(type: 'aircraft' | 'ship', data: any) {
    this.ngZone.run(() => {
      this.selectedEntity = { type, data };
      this.sidebarVisible = true;
      this.sidebarLoading = false;
      this.sidebarError = null;
      const id = this.getEntityId(type, data);
      this.activeEntity = id ? { type, id } : this.activeEntity;
      this.loadingEntity = null;
      this.refreshSelectionState();
      this.cd.detectChanges();
    });
  }

  openSidebarError(type: 'aircraft' | 'ship', id: string, message: string) {
    this.ngZone.run(() => {
      this.selectedEntity = { type, data: null };
      this.sidebarVisible = true;
      this.sidebarLoading = false;
      this.sidebarError = message || 'Unable to load details';
      this.activeEntity = { type, id };
      this.loadingEntity = null;
      this.refreshSelectionState();
      this.cd.detectChanges();
    });
  }

  closeSidebar() {
    this.selectedEntity = null;
    this.sidebarVisible = false;
    this.sidebarLoading = false;
    this.sidebarError = null;
    this.activeEntity = null;
    this.loadingEntity = null;
    this.refreshSelectionState();
    this.cd.detectChanges();
  }

  get progressValue(): number {
    return Math.max(6, Math.min(100, Math.round(this.progress || 0)));
  }

  get loadingStepLabel(): string {
    const raw = (this.currentStep || '').trim();
    if (!raw) {
      return 'Loading satellite data...';
    }
    if (raw.toLowerCase().includes('queue')) {
      return 'Queued — waiting...';
    }
    return raw;
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lat'] || changes['lon'] || changes['delta']) {
      this.updateMapView();
    }
    if (changes['facilitiesData'])  {
      this.renderFacilities();
    }
    if (changes['anomalyData'])     {
      this.renderAnomaly();
    }
    if (changes['aircraftData']) {
      this.renderAircraftCluster();
    }
    if (changes['shipsData']) {
      this.renderShipCluster();
    }
    if (changes['orionData'] || changes['facilitiesVisible']) {
      this.orionRenderVersion += 1;
      this.scheduleOrionRender();
    }
    if (changes['focusedFeature']) {
      this.focusOnFeature();
      this.orionRenderKey = '';
      this.scheduleOrionRender();
    }
    if (changes['selectedLayer'])   {
      this.switchLayer();
    }
    if (changes['facilitiesVisible']) {
      if (this.facLayer) {
        if (this.facilitiesVisible) {
          this.facLayer.addTo(this.leafletMap);
        }
        else {
          this.leafletMap?.removeLayer(this.facLayer);
        }
      }
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.moveTimer);
    if (this.orionRenderTimer) {
      clearTimeout(this.orionRenderTimer);
      this.orionRenderTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.leafletMap?.remove();
  }

  private async initMap(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const L = (await import('leaflet' as any)) as any;
      this.L = L.default || L;
      if (!this.mapContainer?.nativeElement) {
        return;
      }

      this.leafletMap = this.L.map(this.mapContainer.nativeElement, {
        center:   [this.lat ?? 24.78, this.lon ?? 67.35],
        zoom:     2.5,
        minZoom:  2,
        zoomSnap: 0.5,
        zoomControl: true,
        maxBounds: this.L.latLngBounds(MapSectionComponent.WORLD_BOUNDS),
        maxBoundsViscosity: 1,
        worldCopyJump: false,
        zoomAnimation: true,
        markerZoomAnimation: false,
        preferCanvas: true,
      });

      this.esriLayer = this.L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 20,
          maxNativeZoom: 19,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
        },);

      this.esriLowResLayer = this.L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 20,
          maxNativeZoom: 8,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 300,
          keepBuffer: 1,
        },);

      this.osmLayer = this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
          maxNativeZoom: 19,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
        },);

      this.osmLowResLayer = this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
          maxNativeZoom: 8,
          noWrap: true,
          bounds: MapSectionComponent.WORLD_BOUNDS,
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 300,
          keepBuffer: 1,
        },);

      this.refreshBaseLayerDetail();

      // Create custom pane for country highlighting with high z-index
      try {
        let countryPane = this.leafletMap.getPane('countryPane');
        if (!countryPane && this.leafletMap.createPane) {
          countryPane = this.leafletMap.createPane('countryPane');
        }
        if (countryPane) {
          (countryPane as HTMLElement).setAttribute('style', 'z-index: 450 !important');
        }
      }
      catch (error) {
        console.error('[Country Highlight] Failed to create pane:', error);
      }

      await this.initCountryBoundaryLayer();

      this.updateMinZoomToFitContainer();

      this.facLayer = this.L.geoJSON(null, {
        style:        (f: any) => {
          const c = this.facColor(f?.properties?.kind); return { color: c, weight: 1.5, fillColor: c, fillOpacity: 0.18, opacity: 0.9 };
        },
        pointToLayer: (f: any, ll: any) => {
          const c = this.facColor(f?.properties?.kind); return this.L.circleMarker(ll, { radius: 5, color: c, fillColor: c, fillOpacity: 0.85, weight: 1.5 });
        },
        onEachFeature:(f: any, l: any) => {
          const p = f.properties;
          l.bindPopup(`<div style="font-size:13px;font-weight:600;margin-bottom:3px">${p.name || p.kind || 'Facility'}</div><div style="font-size:12px;color:#888">Type: ${p.kind}</div>`);
        },
      }).addTo(this.leafletMap);

      this.anomalyLayer = this.L.layerGroup().addTo(this.leafletMap);

      this.orionCluster = this.L.layerGroup().addTo(this.leafletMap);
      this.aircraftCluster = this.L.layerGroup().addTo(this.leafletMap);
      this.shipCluster = this.L.layerGroup().addTo(this.leafletMap);

      this.leafletMap.on('zoomstart', () => {
        this.loadingEntity = null;
      });

      this.leafletMap.on('zoomend', () => {
        const c = this.leafletMap.getCenter();
        const z = this.leafletMap.getZoom();
        this.zoomLabel = `zoom ${z.toFixed(1)}  ·  ${c.lat.toFixed(4)}°N  ${c.lng.toFixed(4)}°E`;
        this.refreshBaseLayerDetail();
        this.refreshMarkerSizingForZoom(z);
        this.scheduleOrionRender();
      });

      this.leafletMap.on('moveend', () => {
        const c = this.leafletMap.getCenter();
        const z = this.leafletMap.getZoom();
        this.zoomLabel = `zoom ${z.toFixed(1)}  ·  ${c.lat.toFixed(4)}°N  ${c.lng.toFixed(4)}°E`;
        this.renderAircraftCluster();
        this.renderShipCluster();
        this.scheduleOrionRender();
        clearTimeout(this.moveTimer);
        this.moveTimer = setTimeout(() => {
          this.mapMoved.emit({ lat: c.lat, lon: c.lng, zoom: z });
        }, 500);
      });

      if (this.lat && this.lon) {
        this.updateMapView();
      }
      if (this.facilitiesData)  {
        this.renderFacilities();
      }
      if (this.anomalyData)     {
        this.renderAnomaly();
      }
      if (this.aircraftData?.length) {
        this.renderAircraftCluster();
      }
      if (this.shipsData?.length) {
        this.renderShipCluster();
      }
      if (this.orionData?.length) {
        this.renderOrionData();
      }
      this.resizeObserver = new ResizeObserver(() => {
        this.leafletMap?.invalidateSize();
        this.updateMinZoomToFitContainer();
      });
      this.resizeObserver.observe(this.mapContainer.nativeElement);
      setTimeout(() => {
        this.leafletMap?.invalidateSize();
        this.updateMinZoomToFitContainer();
      }, 0);
    }
    catch { }
  }

  private updateMapView(): void {
    if (!this.leafletMap || !this.lat || !this.lon) {
      return;
    }
    this.leafletMap.setView([this.lat, this.lon], this.deltaToZoom(this.delta));
    this.leafletMap.invalidateSize();
    if (this.clickMarker) {
      this.leafletMap.removeLayer(this.clickMarker);
    }
    this.clickMarker = this.L.circleMarker([this.lat, this.lon], {
      radius: 8, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.25, weight: 2,
    }).addTo(this.leafletMap);
  }

  private updateMinZoomToFitContainer(): void {
    if (!this.leafletMap || !this.L) {
      return;
    }

    const worldBounds = this.L.latLngBounds(MapSectionComponent.WORLD_BOUNDS);
    const minZoom = Math.max(1, this.leafletMap.getBoundsZoom(worldBounds, true));
    this.leafletMap.setMinZoom(minZoom);

    if (this.leafletMap.getZoom() < minZoom) {
      this.leafletMap.setZoom(minZoom);
    }
  }

  private switchLayer(): void {
    if (!this.leafletMap || !this.L) {
      return;
    }
    this.refreshBaseLayerDetail();
  }

  private refreshBaseLayerDetail(): void {
    if (!this.leafletMap) {
      return;
    }
    const zoom = this.leafletMap.getZoom?.() ?? 3;
    const useLowRes = zoom < 5;

    [this.esriLayer, this.esriLowResLayer, this.osmLayer, this.osmLowResLayer].forEach(layer => {
      if (layer && this.leafletMap.hasLayer(layer)) {
        this.leafletMap.removeLayer(layer);
      }
    });

    if (this.selectedLayer === 'osm') {
      (useLowRes ? this.osmLowResLayer : this.osmLayer)?.addTo(this.leafletMap);
    }
    else {
      (useLowRes ? this.esriLowResLayer : this.esriLayer)?.addTo(this.leafletMap);
    }
  }

  private async initCountryBoundaryLayer(): Promise<void> {
    if (!this.leafletMap || !this.L || this.countryBoundaryLayer) {
      this.updateCountryHighlight();
      return;
    }

    try {
      const response = await fetch('/assets/data/map/world.json');
      if (!response.ok) {
        console.error('[Country Highlight] Failed to fetch world.json:', response.status);
        return;
      }

      const topology = await response.json();
      const countryCollection = topojsonFeature(topology, topology.objects?.countries) as any;
      this.worldCountryFeatures = Array.isArray(countryCollection?.features) ? countryCollection.features : [];
      const renderableCountryCollection = {
        ...countryCollection,
        features: this.worldCountryFeatures.map((feature: any) => this.normalizeCountryFeature(feature)),
      };
      // Create highlight and hover layers before wiring the country boundaries
      this.countryHighlightLayer = this.L.geoJSON(null, {
        interactive: false,
        pane: 'countryPane',
        noClip: true,
        style: () => this.getCountryHighlightStyle(),
      }).addTo(this.leafletMap);

      this.countryHoverLayer = this.L.geoJSON(null, {
        interactive: false,
        pane: 'countryPane',
        noClip: true,
        style: () => this.getCountryHoverStyle(),
      }).addTo(this.leafletMap);

      this.countryBoundaryLayer = this.L.geoJSON(renderableCountryCollection, {
        interactive: true,
        pane: 'countryPane',
        noClip: true,
        smoothFactor: 0,
        style: () => this.getCountryBoundaryStyle(),
        onEachFeature: (feature: any, layer: any) => {
          const countryName = feature?.properties?.name || 'Country';
          layer.bindTooltip(countryName, {
            direction: 'center',
            sticky: true,
            opacity: 0.95,
            className: 'country-hover-tooltip',
          });
          // click to highlight this country permanently
          layer.on('click', () => {
            if (this.isSameCountryFeature(feature, this.highlightedCountryFeature)) {
              this.clearCountryHighlight();
              return;
            }

            this.highlightCountryFeature(feature);
          });

          // hover: show visual highlight using a stroke-only overlay layer
          layer.on('mouseover', () => {
            try {
              if (this.countryHoverLayer) {
                this.countryHoverLayer.clearLayers();
                this.countryHoverLayer.addData(feature);
                this.countryHoverLayer.bringToFront();
              }
            }
            catch { }
          });

          // mouseout: restore base style and re-apply persistent highlight if present
          layer.on('mouseout', () => {
            try {
              if (this.countryHoverLayer) {
                this.countryHoverLayer.clearLayers();
              }
              if (this.highlightedCountryFeature && this.countryHighlightLayer) {
                this.countryHighlightLayer.clearLayers();
                this.countryHighlightLayer.addData(this.highlightedCountryFeature);
                this.countryHighlightLayer.bringToFront();
              }
            }
            catch { }
          });
        },
      }).addTo(this.leafletMap);

      this.updateCountryHighlight();
    }
    catch (error) {
      console.error('[Country Highlight] Error loading country data:', error);
      this.worldCountryFeatures = [];
    }
  }

  private getCountryBoundaryStyle(): Record<string, any> {
    return {
      color:       'rgba(34,34,34,0.9)',
      weight:      1,
      opacity:     0.9,
      fillColor:   'rgba(0,0,0,0)',
      fillOpacity: 0,
      lineJoin:    'round',
      lineCap:     'round',
    };
  }

  private getCountryHoverStyle(): Record<string, any> {
    return {
      color:       'rgba(96,165,250,0.98)',
      weight:      2.5,
      opacity:     1,
      fillColor:   'rgba(96,165,250,0)',
      fillOpacity: 0,
      lineJoin:    'round',
      lineCap:     'round',
    };
  }

  private normalizeCountryFeature(feature: any): any {
    if (!feature?.geometry) {
      return feature;
    }

    return {
      ...feature,
      geometry: this.normalizeCountryGeometry(feature.geometry),
    };
  }

  private normalizeCountryGeometry(geometry: any): any {
    const type = geometry?.type;
    const coordinates = geometry?.coordinates;

    if (!type || !coordinates) {
      return geometry;
    }

    if (type === 'Polygon') {
      return {
        ...geometry,
        coordinates: coordinates.map((ring: any) => this.unwrapCountryRing(ring)),
      };
    }

    if (type === 'MultiPolygon') {
      return {
        ...geometry,
        coordinates: coordinates.map((polygon: any) => polygon.map((ring: any) => this.unwrapCountryRing(ring))),
      };
    }

    return geometry;
  }

  private unwrapCountryRing(ring: any[]): any[] {
    if (!Array.isArray(ring) || ring.length < 2) {
      return ring;
    }

    const normalizedRing: any[] = [];
    let offset = 0;

    const firstPoint = ring[0];
    normalizedRing.push([firstPoint[0], firstPoint[1]]);
    let previousLongitude = firstPoint[0];

    for (let index = 1; index < ring.length; index += 1) {
      const point = ring[index];
      if (!Array.isArray(point) || point.length < 2) {
        continue;
      }

      let longitude = point[0] + offset;
      const latitude = point[1];

      while (longitude - previousLongitude > 180) {
        offset -= 360;
        longitude = point[0] + offset;
      }

      while (previousLongitude - longitude > 180) {
        offset += 360;
        longitude = point[0] + offset;
      }

      normalizedRing.push([longitude, latitude]);
      previousLongitude = longitude;
    }

    return normalizedRing;
  }

  private getCountryHighlightStyle(): Record<string, any> {
    return {
      color:       'rgba(59,130,246,0.98)',
      weight:      2.2,
      opacity:     0.95,
      fillColor:   'rgba(56,189,248,0)',
      fillOpacity: 0,
      lineJoin:    'round',
      lineCap:     'round',
    };
  }

  private getFocusedFeatureCoordinates(): [number, number] | null {
    const coordinates = this.focusedFeature?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return null;
    }

    const [lon, lat] = coordinates;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return null;
    }

    return [lon, lat];
  }

  private updateCountryHighlight(): void {
    const coordinates = this.getFocusedFeatureCoordinates();
    this.highlightedCountryFeature = null;

    if (coordinates) {
      this.highlightedCountryFeature = this.worldCountryFeatures.find((countryFeature: any) => {
        try {
          return geoContains(countryFeature, coordinates);
        }
        catch {
          return false;
        }
      }) ?? null;
    }

    if (this.countryHighlightLayer) {
      this.countryHighlightLayer.clearLayers();
      if (this.highlightedCountryFeature) {
        this.countryHighlightLayer.addData(this.highlightedCountryFeature);
        this.countryHighlightLayer.bringToFront();
      }
    }
  }

  private highlightCountryFeature(feature: any): void {
    if (!feature) {
      return;
    }

    this.highlightedCountryFeature = feature;

    if (this.countryHighlightLayer) {
      this.countryHighlightLayer.clearLayers();
      this.countryHighlightLayer.addData(feature);
      this.countryHighlightLayer.bringToFront();
    }
  }

  private clearCountryHighlight(): void {
    this.highlightedCountryFeature = null;

    if (this.countryHighlightLayer) {
      this.countryHighlightLayer.clearLayers();
    }
  }

  private isSameCountryFeature(left: any, right: any): boolean {
    if (!left || !right) {
      return false;
    }

    const leftId = left?.id ?? left?.properties?.name ?? left?.properties?.iso_a3 ?? left?.properties?.admin;
    const rightId = right?.id ?? right?.properties?.name ?? right?.properties?.iso_a3 ?? right?.properties?.admin;
    return String(leftId || '').trim() !== '' && String(leftId) === String(rightId);
  }

  private renderAircraftCluster(): void {
    if (!this.aircraftCluster) {
      return;
    }

    const renderKey = this.getAircraftRenderKey();
    if (renderKey === this.aircraftRenderKey) {
      return;
    }
    this.aircraftRenderKey = renderKey;

    this.aircraftCluster.clearLayers();

    const markers = this.getRenderableAircraft()
      .filter(a => Number.isFinite(a.latitude) && Number.isFinite(a.longitude))
      .map(a => {
        const icaoId = this.normalizeEntityId(a.icao24);
        const isSelected = !!icaoId && this.activeEntity?.type === 'aircraft' && this.activeEntity.id === icaoId;
        const isLoading = !!icaoId && this.loadingEntity?.type === 'aircraft' && this.loadingEntity.id === icaoId;
        const marker = this.L.marker([a.latitude, a.longitude], {
          icon: this.createAircraftIcon(a, isSelected, isLoading),
        });
        if (a.icao24) {
          marker.on('click', () => {
            const markerId = this.normalizeEntityId(a.icao24);
            if (!markerId) {
              return;
            }
            const token = this.openSidebarLoading('aircraft', markerId, a);
            this.satelliteService.pollAircraftByICAO(a.icao24).subscribe({
              next: (res) => {
                if (token !== this.sidebarRequestToken) {
                  return;
                } // stale, discard
                const aircraft = this.extractAircraftDetails(res);
                const status = this.getResponseStatus(res);
                if (aircraft) {
                  this.ngZone.run(() => this.openSidebar('aircraft', aircraft));
                }
                else if (this.isPendingStatus(status)) {
                  return;
                }
                else {
                  this.openSidebarError('aircraft', markerId, 'Unable to load aircraft details');
                }
              },
              error: (err) => {
                if (token !== this.sidebarRequestToken) {
                  return;
                } // stale, discard
                this.openSidebarError('aircraft', markerId, err?.error?.detail || err?.message || 'Aircraft details request failed');
              }
            });
          });
        }
        return marker;
      });
    markers.forEach(marker => this.aircraftCluster.addLayer(marker));
  }

  private renderShipCluster(): void {
    if (!this.shipCluster) {
      return;
    }

    const renderKey = this.getShipRenderKey();
    if (renderKey === this.shipRenderKey) {
      return;
    }
    this.shipRenderKey = renderKey;

    this.shipCluster.clearLayers();

    const markers = this.getRenderableShips()
      .filter(s => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
      .map(s => {
        const mmsiId = this.normalizeEntityId(s.mmsi);
        const isSelected = !!mmsiId && this.activeEntity?.type === 'ship' && this.activeEntity.id === mmsiId;
        const isLoading = !!mmsiId && this.loadingEntity?.type === 'ship' && this.loadingEntity.id === mmsiId;
        const marker = this.L.marker([s.latitude!, s.longitude!], {
          icon: this.createShipIcon(s, isSelected, isLoading),
        });
        if (s.mmsi) {
          marker.on('click', () => {
            const markerId = this.normalizeEntityId(s.mmsi);
            if (!markerId) {
              return;
            }
            const token = this.openSidebarLoading('ship', markerId, s);
            this.satelliteService.pollShipByMMSI(s.mmsi).subscribe({
              next: (res) => {
                if (token !== this.sidebarRequestToken) {
                  return;
                }
                const ship = this.extractShipDetails(res);
                const status = this.getResponseStatus(res);
                if (ship) {
                  this.ngZone.run(() => this.openSidebar('ship', ship));
                }
                else if (this.isPendingStatus(status)) {
                  return;
                }
                else {
                  this.openSidebarError('ship', markerId, 'Unable to load ship details');
                }
              },
              error: (err) => {
                if (token !== this.sidebarRequestToken) {
                  return;
                }
                this.openSidebarError('ship', markerId, err?.error?.detail || err?.message || 'Ship details request failed');
              }
            });
          });
        }
        return marker;
      });

    markers.forEach(marker => this.shipCluster.addLayer(marker));
  }

  private createAircraftIcon(a: SatelliteLiveAircraft, isSelected: boolean, isLoading: boolean): any {
    const size = this.getMarkerBaseSize('aircraft');
    const half = Math.round(size / 2);
    const iconSize = Math.round(size * 0.86);
    const halo = isSelected ? 'drop-shadow(0 0 8px rgba(250,204,21,0.95)) drop-shadow(0 0 18px rgba(250,204,21,0.72))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))';
    const hoverHalo = isSelected
      ? 'drop-shadow(0 0 8px rgba(250,204,21,0.95)) drop-shadow(0 0 18px rgba(250,204,21,0.72))'
      : 'drop-shadow(0 0 7px rgba(56,189,248,0.9)) drop-shadow(0 0 16px rgba(56,189,248,0.55))';
    const strokeColor = isSelected ? '#fff7bf' : '#eab308';
    const badge = isLoading
      ? `<div style="position:absolute;top:-1px;right:-1px;width:12px;height:12px;border-radius:9999px;background:#fde68a;border:2px solid #081421;"></div>`
      : '';
    return this.L.divIcon({
      html: `
        <style>
          .aircraft-marker:hover .aircraft-icon-wrap { filter:${hoverHalo} !important; }
          .aircraft-marker:hover .aircraft-icon { fill:#38bdf8 !important; stroke:#dbeafe !important; }
        </style>
        <div class="aircraft-marker" style="position:relative;width:${size}px;height:${size}px;">
          <div class="aircraft-icon-wrap" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${a.true_track ?? 0}deg);filter:${halo};">
            <svg class="aircraft-icon" viewBox="0 0 24 24" style="width:${iconSize}px;height:${iconSize}px;fill:#facc15;stroke:${strokeColor};stroke-width:0.65;transition:fill 120ms ease,stroke 120ms ease;">
              <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L12 19v-5.5L21 16z"/>
            </svg>
          </div>
          ${badge}
        </div>
      `,
      className: 'bg-transparent border-0',
      iconSize: [size, size],
      iconAnchor: [half, half],
    });
  }

  private createShipIcon(s: SatelliteLiveShip, isSelected: boolean, isLoading: boolean): any {
    const size = this.getMarkerBaseSize('ship');
    const half = Math.round(size / 2);
    const iconSize = Math.round(size * 0.8);
    const glow = isSelected ? 'drop-shadow(0 0 8px rgba(96,165,250,0.92)) drop-shadow(0 0 18px rgba(96,165,250,0.62))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.42))';
    const badge = isLoading
      ? `<div style="position:absolute;top:1px;right:1px;width:12px;height:12px;border-radius:9999px;background:#fde68a;border:2px solid #081421;"></div>`
      : '';
    return this.L.divIcon({
      html: `
        <div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${s.true_heading ?? s.course ?? 0}deg);filter:${glow};">
            <svg viewBox="0 0 24 24" style="width:${iconSize}px;height:${iconSize}px;fill:#38bdf8;stroke:${isSelected ? '#dbeafe' : '#0ea5e9'};stroke-width:0.6;">
              <path d="M12 2L19 20L12 16L5 20L12 2Z"/>
            </svg>
          </div>
          ${badge}
        </div>
      `,
      className: 'bg-transparent border-0',
      iconSize: [size, size],
      iconAnchor: [half, half],
    });
  }

  private refreshSelectionState(): void {
    this.aircraftRenderKey = '';
    this.shipRenderKey = '';
    this.orionRenderKey = '';
    this.renderAircraftCluster();
    this.renderShipCluster();
  }

  private getEntityId(type: 'aircraft' | 'ship', data: any): string | null {
    return this.normalizeEntityId(type === 'aircraft' ? data?.icao24 : data?.mmsi);
  }

  private normalizeEntityId(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized ? normalized : null;
  }

  private getMarkerBaseSize(type: 'aircraft' | 'ship'): number {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const base = type === 'aircraft' ? 26 : 28;
    const growth = type === 'aircraft' ? 1.8 : 1.6;
    const cap = type === 'aircraft' ? 20 : 8;
    return base + Math.max(0, Math.min(cap, Math.round((zoom - 3) * growth)));
  }

  private getResponseStatus(res: any): string | undefined {
    return res?.result?.status || res?.status;
  }

  private isPendingStatus(status: string | undefined): boolean {
    return status === 'pending' || status === 'busy';
  }

  private getClusterSize(count: number): number {
    if (count >= 1000) {
      return 52;
    }
    if (count >= 100) {
      return 48;
    }
    if (count >= 25) {
      return 44;
    }
    if (count >= 10) {
      return 40;
    }
    return 36;
  }

  private refreshMarkerSizingForZoom(zoom: number): void {
    const bucket = Math.round(zoom * 2);
    if (bucket === this.markerZoomBucket) {
      return;
    }
    this.markerZoomBucket = bucket;
    this.aircraftRenderKey = '';
    this.shipRenderKey = '';
    this.orionRenderKey = '';
    this.renderAircraftCluster();
    this.renderShipCluster();
  }

  private getAircraftRenderKey(): string {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|sel:${this.activeEntity?.id || ''}|load:${this.loadingEntity?.id || ''}|count:${this.aircraftData.length}`;
    }
    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `sel:${this.activeEntity?.id || ''}`,
      `load:${this.loadingEntity?.id || ''}`,
      `count:${this.aircraftData.length}`,
    ].join('|');
  }

  private getRenderableAircraft(): SatelliteLiveAircraft[] {
    const bounds = this.leafletMap?.getBounds?.();
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const visible = this.aircraftData.filter(a => {
      if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude)) {
        return false;
      }
      if (!bounds) {
        return true;
      }
      return bounds.pad(0.18).contains([a.latitude, a.longitude]);
    });
    const sampleRatio = this.getAircraftSampleRatio(zoom);
    if (sampleRatio >= 1) {
      return visible;
    }
    return visible.filter(a => this.shouldKeepAircraftSample(a, sampleRatio));
  }

  private getAircraftSampleRatio(zoom: number): number {
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
      return 0.08;
    }
    return 0.05;
  }

  private shouldKeepAircraftSample(a: SatelliteLiveAircraft, ratio: number): boolean {
    const key = this.normalizeEntityId(a.icao24) ?? `${a.latitude}:${a.longitude}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 100) < Math.round(ratio * 100);
  }

  private getRenderableShips(): SatelliteLiveShip[] {
    const bounds = this.leafletMap?.getBounds?.();
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const visible = this.shipsData.filter(s => {
      if (!Number.isFinite(s.latitude) || !Number.isFinite(s.longitude)) {
        return false;
      }
      if (!bounds) {
        return true;
      }
      return bounds.pad(0.18).contains([s.latitude, s.longitude]);
    });
    const sampleRatio = this.getShipSampleRatio(zoom);
    if (sampleRatio >= 1) {
      return visible;
    }
    return visible.filter(s => this.shouldKeepShipSample(s, sampleRatio));
  }

  private getShipSampleRatio(zoom: number): number {
    if (zoom >= 8) {
      return 1;
    }
    if (zoom >= 7) {
      return 0.8;
    }
    if (zoom >= 6) {
      return 0.55;
    }
    if (zoom >= 5) {
      return 0.26;
    }
    if (zoom >= 4) {
      return 0.12;
    }
    if (zoom >= 3) {
      return 0.07;
    }
    return 0.04;
  }

  private shouldKeepShipSample(s: SatelliteLiveShip, ratio: number): boolean {
    const key = this.normalizeEntityId(s.mmsi) ?? `${s.latitude}:${s.longitude}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 100) < Math.round(ratio * 100);
  }

  private getShipRenderKey(): string {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|sel:${this.activeEntity?.id || ''}|load:${this.loadingEntity?.id || ''}|count:${this.shipsData.length}`;
    }
    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `sel:${this.activeEntity?.id || ''}`,
      `load:${this.loadingEntity?.id || ''}`,
      `count:${this.shipsData.length}`,
    ].join('|');
  }

  private extractAircraftDetails(res: any): SatelliteLiveAircraft | null {
    const payload = res?.result ?? res;
    if (Array.isArray(payload?.aircraft) && payload.aircraft.length > 0) {
      return payload.aircraft[0] as SatelliteLiveAircraft;
    }
    if (payload?.aircrafts && Array.isArray(payload.aircrafts) && payload.aircrafts.length > 0) {
      return payload.aircrafts[0] as SatelliteLiveAircraft;
    }
    if (payload?.aircraft && typeof payload.aircraft === 'object' && !Array.isArray(payload.aircraft)) {
      return payload.aircraft as SatelliteLiveAircraft;
    }
    if (payload && typeof payload === 'object' && payload.icao24 != null) {
      return payload as SatelliteLiveAircraft;
    }
    if (res && typeof res === 'object' && res.icao24 != null) {
      return res as SatelliteLiveAircraft;
    }
    return null;
  }

  private extractShipDetails(res: any): SatelliteLiveShip | null {
    const payload = res?.result ?? res;
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

  private renderFacilities(): void {
    if (!this.facLayer) {
      return;
    }
    this.facLayer.clearLayers();
    if (this.facilitiesData?.features?.length) {
      this.facLayer.addData(this.facilitiesData);
    }
  }

  private renderAnomaly(): void {
    if (!this.anomalyLayer || !this.anomalyData?.bbox) {
      return;
    }
    this.anomalyLayer.clearLayers();
    const [mnLo, mnLa, mxLo, mxLa] = this.anomalyData.bbox;
    const C: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', nominal: '#22c55e', unknown: '#3b82f6' };
    const c = C[this.anomalyData.alert_level] || '#3b82f6';
    this.L.rectangle([[mnLa, mnLo], [mxLa, mxLo]], { color: c, weight: 2, fillColor: c, fillOpacity: 0.08, dashArray: '6 4' })
      .addTo(this.anomalyLayer)
      .bindPopup(`<b>Anomaly zone</b><br>Alert: <b>${this.anomalyData.alert_level}</b><br>NDVI delta: <b>${this.anomalyData.delta_score}%</b>`);
    this.leafletMap?.fitBounds([[mnLa, mnLo], [mxLa, mxLo]], { padding: [40, 40] });
  }

  private renderOrionData(): void {
    if (!this.orionCluster || !this.L) {
      return;
    }

    const renderKey = this.getOrionRenderKey();
    if (renderKey === this.orionRenderKey) {
      return;
    }
    this.orionRenderKey = renderKey;

    const data = this.getRenderableOrionFeatures();
    const visibleIds = new Set<string>();
    const markersToAdd: any[] = [];

    for (const feat of data) {
      const featureId = String(feat?.id || '').trim();
      if (!featureId) {
        continue;
      }

      visibleIds.add(featureId);

      const nextSignature = this.getOrionFeatureSignature(feat);
      const existing = this.orionMarkers.get(featureId);
      const previousSignature = this.orionMarkerSignatures.get(featureId);

      if (!existing) {
        const marker = this.createOrionMarker(feat);
        this.orionMarkers.set(featureId, marker);
        this.orionMarkerSignatures.set(featureId, nextSignature);
        markersToAdd.push(marker);
        continue;
      }

      if (previousSignature !== nextSignature) {
        this.orionCluster.removeLayer(existing);
        const marker = this.createOrionMarker(feat);
        this.orionMarkers.set(featureId, marker);
        this.orionMarkerSignatures.set(featureId, nextSignature);
        markersToAdd.push(marker);
      }
    }

    for (const [featureId, marker] of Array.from(this.orionMarkers.entries())) {
      if (visibleIds.has(featureId)) {
        continue;
      }
      this.orionCluster.removeLayer(marker);
      this.orionMarkers.delete(featureId);
      this.orionMarkerSignatures.delete(featureId);
    }

    if (markersToAdd.length > 0) {
      if (typeof this.orionCluster.addLayers === 'function') {
        this.orionCluster.addLayers(markersToAdd);
      }
      else {
        markersToAdd.forEach(marker => this.orionCluster.addLayer(marker));
      }
    }
  }

  private scheduleOrionRender(): void {
    if (!this.orionCluster || !this.L) {
      return;
    }
    if (this.orionRenderTimer) {
      return;
    }
    this.orionRenderTimer = setTimeout(() => {
      this.orionRenderTimer = null;
      this.renderOrionData();
    }, 80);
  }

  private getRenderableOrionFeatures(): any[] {
    const bounds = this.leafletMap?.getBounds?.();
    const paddedBounds = bounds?.pad(0.18);
    const zoom = this.leafletMap?.getZoom?.() ?? 3;

    const visibleFeatures = (this.orionData || []).filter((feat) => {
      if (!this.isValidOrionFeature(feat)) {
        return false;
      }
      if (!this.facilitiesVisible && feat.source !== 'WRI') {
        return false;
      }

      const [lon, lat] = feat.coordinates;
      if (paddedBounds && !paddedBounds.contains([lat, lon])) {
        return false;
      }

      return true;
    });

    return this.limitOrionFeaturesForZoom(visibleFeatures, zoom, paddedBounds);
  }

  private isValidOrionFeature(feat: any): boolean {
    if (!feat?.id || !Array.isArray(feat.coordinates) || feat.coordinates.length < 2) {
      return false;
    }

    const [lon, lat] = feat.coordinates;
    return feat.properties?.hasValidCoordinates !== false &&
      Number.isFinite(lon) &&
      Number.isFinite(lat) &&
      lon !== 0 &&
      lat !== 0;
  }

  private limitOrionFeaturesForZoom(features: any[], zoom: number, bounds: any): any[] {
    const limit = this.getOrionVisibleLimit(zoom);
    if (!Number.isFinite(limit) || features.length <= limit) {
      return features;
    }

    const focusedId = this.focusedFeature?.id ? String(this.focusedFeature.id) : '';
    const focusedFeature = focusedId
      ? features.find((feat) => String(feat?.id || '') === focusedId) ?? null
      : null;
    const remainingLimit = Math.max(0, limit - (focusedFeature ? 1 : 0));
    const grid = this.getOrionGridSize(zoom);
    const buckets = new Map<string, Array<{ feat: any; score: number }>>();

    for (const feat of features) {
      if (focusedFeature && String(feat?.id || '') === focusedId) {
        continue;
      }

      const bucketKey = this.getOrionGridKey(feat, bounds, grid.cols, grid.rows);
      const bucket = buckets.get(bucketKey) || [];
      bucket.push({
        feat,
        score: Math.abs(this.stableHash(String(feat?.id || `${feat?.coordinates?.[1]}:${feat?.coordinates?.[0]}`))),
      });
      buckets.set(bucketKey, bucket);
    }

    const sortedBuckets = Array.from(buckets.values())
      .map((bucket) => bucket.sort((left, right) => left.score - right.score))
      .sort((left, right) => right.length - left.length);

    const limitedFeatures: any[] = [];
    let round = 0;
    while (limitedFeatures.length < remainingLimit) {
      let addedThisRound = false;
      for (const bucket of sortedBuckets) {
        const entry = bucket[round];
        if (!entry) {
          continue;
        }
        limitedFeatures.push(entry.feat);
        addedThisRound = true;
        if (limitedFeatures.length >= remainingLimit) {
          break;
        }
      }
      if (!addedThisRound) {
        break;
      }
      round += 1;
    }

    return focusedFeature ? [focusedFeature, ...limitedFeatures] : limitedFeatures;
  }

  private getOrionVisibleLimit(zoom: number): number {
    if (zoom >= 11) {
      return Number.POSITIVE_INFINITY;
    }
    if (zoom >= 10) {
      return 8000;
    }
    if (zoom >= 9) {
      return 5200;
    }
    if (zoom >= 8) {
      return 3200;
    }
    if (zoom >= 7) {
      return 1900;
    }
    if (zoom >= 6) {
      return 1100;
    }
    if (zoom >= 5) {
      return 700;
    }
    if (zoom >= 4) {
      return 450;
    }
    return 280;
  }

  private getOrionGridSize(zoom: number): { cols: number; rows: number } {
    if (zoom >= 10) {
      return { cols: 36, rows: 24 };
    }
    if (zoom >= 8) {
      return { cols: 30, rows: 20 };
    }
    if (zoom >= 6) {
      return { cols: 24, rows: 16 };
    }
    if (zoom >= 4) {
      return { cols: 20, rows: 12 };
    }
    return { cols: 16, rows: 10 };
  }

  private getOrionGridKey(feat: any, bounds: any, cols: number, rows: number): string {
    const [lon, lat] = feat.coordinates;
    const west = bounds?.getWest?.() ?? -180;
    const east = bounds?.getEast?.() ?? 180;
    const south = bounds?.getSouth?.() ?? -85;
    const north = bounds?.getNorth?.() ?? 85;
    const lonSpan = Math.max(0.000001, east - west);
    const latSpan = Math.max(0.000001, north - south);
    const x = Math.max(0, Math.min(cols - 1, Math.floor(((lon - west) / lonSpan) * cols)));
    const y = Math.max(0, Math.min(rows - 1, Math.floor(((north - lat) / latSpan) * rows)));

    return `${x}:${y}`;
  }

  private stableHash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    }
    return hash;
  }

  private getOrionRenderKey(): string {
    const zoom = this.leafletMap?.getZoom?.() ?? 3;
    const bounds = this.leafletMap?.getBounds?.();
    if (!bounds) {
      return `z:${Math.round(zoom * 2)}|count:${this.orionData.length}|v:${this.orionRenderVersion}|fac:${this.facilitiesVisible}|focus:${this.focusedFeature?.id || ''}`;
    }

    const center = bounds.getCenter();
    return [
      `z:${Math.round(zoom * 2)}`,
      `c:${center.lat.toFixed(1)},${center.lng.toFixed(1)}`,
      `d:${bounds.getNorth().toFixed(1)},${bounds.getEast().toFixed(1)},${bounds.getSouth().toFixed(1)},${bounds.getWest().toFixed(1)}`,
      `count:${this.orionData.length}`,
      `v:${this.orionRenderVersion}`,
      `fac:${this.facilitiesVisible}`,
      `focus:${this.focusedFeature?.id || ''}`,
    ].join('|');
  }

  private createOrionMarker(feat: any): any {
    const [lon, lat] = feat.coordinates;
    const color = feat.color || '#3b82f6';
    const marker = feat.source === 'WRI'
      ? this.L.marker([lat, lon], {
        icon: this.L.divIcon({
          html: `<div style="
            position:relative;
            width:18px;
            height:18px;
            background:${color};
            border:2px solid #ffffff;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-sizing:border-box;
          ">
            <div style="
              position:absolute;
              top:50%;
              left:50%;
              width:6px;
              height:6px;
              border-radius:50%;
              background:#ffffff;
              transform:translate(-50%, -50%) rotate(45deg);
            "></div>
          </div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 18],
        }),
      })
      : this.L.circleMarker([lat, lon], {
        radius:      6,
        color:       '#ffffff',
        fillColor:   color,
        fillOpacity: 0.88,
        weight:      1.5,
      });

    const rows: string[] = [];
    const title = typeof feat.name === 'string' && feat.name.trim() ? feat.name.trim() : 'Feature';
    const properties = feat.properties && typeof feat.properties === 'object' ? feat.properties as Record<string, unknown> : {};

    rows.push(`<div style="font-size:12px;font-weight:700;line-height:1.35;margin-bottom:8px;color:#ffffff;">${title}</div>`);
    this.appendPopupRow(rows, 'Country', properties['country']);
    this.appendPopupRow(rows, 'Fuel', properties['fuel'] ?? properties['primary_fuel']);
    this.appendPopupRow(rows, 'Capacity', this.formatCapacityValue(properties['capacity_mw'] ?? feat.capacityMw));
    this.appendPopupRow(rows, 'Source', properties['source'] ?? feat.source);

    for (const [key, rawValue] of Object.entries(properties)) {
      if ([ 'name', 'country', 'fuel', 'primary_fuel', 'capacity_mw', 'source' ].includes(key)) {
        continue;
      }
      this.appendPopupRow(rows, this.humanizeFieldLabel(key), rawValue);
    }

    rows.push(this.popupRow('Coordinates', `${lat.toFixed(3)}, ${lon.toFixed(3)}`, true));

    marker.bindPopup(`<div style="width:178px;padding:8px 9px;background:#0d1627;border-radius:8px;">
      ${rows.join('')}
    </div>`, { className: 'orion-popup' });

    marker.orionFeature = feat;
    marker.on('click', () => {
      this.featureSelected.emit(feat);
      if (feat?.source === 'WRI' && feat?.id) {
        this.featureIdsSelected.emit([feat.id]);
      }
    });
    return marker;
  }

  private getOrionFeatureSignature(feat: any): string {
    const coords = Array.isArray(feat?.coordinates) ? feat.coordinates : [null, null];
    const properties = feat?.properties && typeof feat.properties === 'object' ? feat.properties : {};
    return JSON.stringify({
      id: feat?.id ?? null,
      name: feat?.name ?? null,
      source: feat?.source ?? null,
      type: feat?.type ?? null,
      rawType: feat?.rawType ?? null,
      color: feat?.color ?? null,
      capacityMw: feat?.capacityMw ?? null,
      lon: coords[0] ?? null,
      lat: coords[1] ?? null,
      properties,
    });
  }

  private popupRow(label: string, value: string, stacked = false): string {
    return `<div style="display:flex;${stacked ? 'flex-direction:column;align-items:flex-start;' : 'justify-content:space-between;align-items:flex-start;'}gap:4px;
      padding:4px 0;border-top:1px solid rgba(255,255,255,0.12);font-size:11px;line-height:1.35;">
      <span style="color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.04em;">${label}</span>
      <span style="color:#ffffff;font-weight:600;${stacked ? '' : 'text-align:right;'}word-break:break-word;">${value}</span>
    </div>`;
  }

  private appendPopupRow(rows: string[], label: string, value: unknown): void {
    const formatted = this.formatPopupValue(value);
    if (!formatted) {
      return;
    }
    rows.push(this.popupRow(label, formatted));
  }

  powerPlantDotClass(type: string): string {
    const map: Record<string, string> = {
      hydro: 'bg-[#2563eb]',
      solar: 'bg-[#facc15]',
      wind: 'bg-[#16a34a]',
      gas: 'bg-[#f59e0b]',
      coal: 'bg-[#111827]',
      oil: 'bg-[#f97316]',
      nuclear: 'bg-[#dc2626]',
      geothermal: 'bg-[#ec4899]',
      biomass: 'bg-[#84cc16]',
      waste: 'bg-[#8b5cf6]',
      storage: 'bg-[#06b6d4]',
      cogeneration: 'bg-[#14b8a6]',
      petcoke: 'bg-[#78716c]',
      wave_and_tidal: 'bg-[#0ea5e9]',
      airport: 'bg-[#9333ea]',
      port: 'bg-[#0d9488]',
      warehouse: 'bg-[#92400e]',
      industrial: 'bg-[#6b7280]',
      military: 'bg-[#d71c1c]',
      other: 'bg-[#a3a3a3]',
    };
    return map[type] || 'bg-[#6b7280]';
  }

  private humanizeFieldLabel(key: string): string {
    return key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/^./, (char) => char.toUpperCase());
  }

  private formatPopupValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return JSON.stringify(value);
  }

  private formatCapacityValue(value: unknown): string {
    if (typeof value !== 'number') {
      return this.formatPopupValue(value);
    }
    return `${value} MW`;
  }

  private focusOnFeature(): void {
    if (!this.leafletMap || !this.L || !this.focusedFeature) {
      this.updateCountryHighlight();
      return;
    }
    const [lon, lat] = this.focusedFeature.coordinates;
    const currentZoom = this.leafletMap.getZoom();
    this.leafletMap.flyTo([lat, lon], Math.max(currentZoom, 8));
    this.updateCountryHighlight();
  }

  private deltaToZoom(d: number): number {
    if (d <= 0.005) {
      return 17;
    } if (d <= 0.01) {
      return 16;
    } if (d <= 0.02) {
      return 15;
    }
    if (d <= 0.04)  {
      return 14;
    } if (d <= 0.08) {
      return 13;
    } if (d <= 0.15) {
      return 12;
    }
    if (d <= 0.3)   {
      return 11;
    } if (d <= 0.6)  {
      return 10;
    } return 9;
  }

  private facColor(kind: string): string {
    const M: Record<string, string> = {
      industrial: '#f59e0b', port: '#ef4444', depot: '#f97316',
      warehouse: '#f59e0b', logistics: '#f97316', dock: '#38bdf8',
      boatyard: '#38bdf8', pier: '#38bdf8', crane: '#a78bfa',
      storage_tank: '#ef4444', pipeline: '#6b7280', breakwater: '#6b7280',
      hangar: '#a78bfa', factory: '#ef4444',
    };
    return M[kind] || '#6b7280';
  }
}
