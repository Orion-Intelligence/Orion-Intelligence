import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, EventEmitter, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { SatelliteLiveAircraft, SatelliteLiveShip } from '../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ORION_POWER_FILTERS } from '../model/satellite-intel.model';

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
  private osmLayer: any     = null;
  private facLayer: any     = null;
  private anomalyLayer: any = null;
  private orionCluster: any = null;
  private clickMarker: any  = null;
  private L: any            = null;
  private moveTimer: any    = null;
  private resizeObserver: ResizeObserver | null = null;
  private aircraftCluster!: any;
  private shipCluster!: any;

  readonly powerPlantLegend = ORION_POWER_FILTERS;
  zoomLabel = 'zoom 2.5';
  isMapFeaturesHovered = false;

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
      this.renderOrionData();
    }
    if (changes['focusedFeature']) {
      this.focusOnFeature();
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
      });

      this.esriLayer = this.L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles © Esri', maxZoom: 20, maxNativeZoom: 19, noWrap: true, bounds: MapSectionComponent.WORLD_BOUNDS },).addTo(this.leafletMap);

      this.osmLayer = this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap', maxZoom: 19, noWrap: true, bounds: MapSectionComponent.WORLD_BOUNDS },);

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

        await import('leaflet.markercluster' as any) as any;
        this.orionCluster = this.L.markerClusterGroup({
          maxClusterRadius: 40,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: false,
          spiderfyOnMaxZoom: false,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            return this.L.divIcon({
              html: `<div style="
                background:#3b82f6;border-radius:50%;width:32px;height:32px;
                display:flex;align-items:center;justify-content:center;
                color:#fff;font-size:11px;font-weight:700;
                box-shadow:0 0 0 3px rgba(59,130,246,0.3);">
                ${count}
              </div>`,
              className: '',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });
          },
        }).addTo(this.leafletMap);
        this.aircraftCluster = (this.L as any).markerClusterGroup({
          maxClusterRadius: 40,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: false,
          spiderfyOnMaxZoom: false,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            return this.L.divIcon({
              html: `<div style="
          background:#22c55e;
          border-radius:50%;
          width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:11px;font-weight:700;
          box-shadow:0 0 0 3px rgba(34,197,94,0.3);">
          ${count}
        </div>`,
              className: '',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });
          },
        }).addTo(this.leafletMap);
        this.shipCluster = (this.L as any).markerClusterGroup({
          maxClusterRadius: 40,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: false,
          spiderfyOnMaxZoom: false,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            return this.L.divIcon({
              html: `<div style="
          background:#06b6d4;
          border-radius:50%;
          width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:11px;font-weight:700;
          box-shadow:0 0 0 3px rgba(6,182,212,0.3);">
          ${count}
        </div>`,
              className: '',
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });
          },
        }).addTo(this.leafletMap);

        this.leafletMap.on('moveend zoomend', () => {
          const c = this.leafletMap.getCenter();
          const z = this.leafletMap.getZoom();
          this.zoomLabel = `zoom ${z.toFixed(1)}  ·  ${c.lat.toFixed(4)}°N  ${c.lng.toFixed(4)}°E`;
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
    if (this.selectedLayer === 'osm') {
      this.leafletMap.removeLayer(this.esriLayer);
      this.osmLayer.addTo(this.leafletMap);
    }
    else {
      this.leafletMap.removeLayer(this.osmLayer);
      this.esriLayer.addTo(this.leafletMap);
    }
  }

  private renderAircraftCluster(): void {
    if (!this.aircraftCluster) {
      return;
    }

    this.aircraftCluster.clearLayers();

    const markers = this.aircraftData.map(a => {
      return this.L.marker([a.latitude, a.longitude], {
        icon: this.L.divIcon({
          html: `
                <div class="w-10 h-10 flex items-center justify-center 
                            rounded-full bg-blue-600 shadow-xl border-2 border-white"
                     style="transform: rotate(${a.true_track ?? 0}deg);">

                  <svg viewBox="0 0 24 24" class="w-6 h-6 fill-white">
                    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9L2 14v2l8-2.5V19l-2 1.5V22l3-1 3 1v-1.5L12 19v-5.5L21 16z"/>
                  </svg>

                </div>
              `,
          className: 'bg-transparent border-0',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      });
    });

    this.aircraftCluster.addLayers(markers);
  }

  private renderShipCluster(): void {
    if (!this.shipCluster) {
      return;
    }

    this.shipCluster.clearLayers();

    const markers = this.shipsData.map(s => {
      return this.L.marker([s.latitude!, s.longitude!], {
        icon: this.L.divIcon({
          html: `
                <div class="relative w-11 h-11 flex items-center justify-center">

                  <!-- soft radar glow -->
                  <div class="absolute w-full h-full rounded-full bg-emerald-500/20"></div>

                  <!-- ship base -->
                  <div class="w-9 h-9 flex items-center justify-center 
                              rounded-full bg-emerald-700 shadow-lg">

                    <!-- clean AIS-style ship -->
                    <svg 
                      viewBox="0 0 24 24" 
                      class="w-6 h-6 fill-white"
                      style="transform: rotate(${s.true_heading ?? s.course ?? 0}deg); transform-origin: center;">

                      <path d="M12 2l2 6h6l-4 3 2 7-6-4-6 4 2-7-4-3h6z"/>
                    </svg>

                  </div>
                </div>
              `,
          className: 'bg-transparent border-0',
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      });
    });

    this.shipCluster.addLayers(markers);
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
    this.orionCluster.clearLayers();

    const data = this.orionData || [];
    for (const feat of data) {
      if (!this.facilitiesVisible && feat.source !== 'WRI') {
        continue;
      }
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

      marker.on('click', () => this.featureSelected.emit(feat));
      this.orionCluster.addLayer(marker);
    }
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
      nuclear: 'bg-[#dc2626]',
      coal: 'bg-[#111827]',
      oil: 'bg-[#f97316]',
      solar: 'bg-[#facc15]',
      wind: 'bg-[#16a34a]',
      gas: 'bg-[#6b7280]',
      other: 'bg-[#6b7280]',
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
      return;
    }
    const [lon, lat] = this.focusedFeature.coordinates;
    const currentZoom = this.leafletMap.getZoom();
    this.leafletMap.flyTo([lat, lon], Math.max(currentZoom, 8));
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
