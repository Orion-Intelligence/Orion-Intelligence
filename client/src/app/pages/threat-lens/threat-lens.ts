import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { loadModules, setDefaultOptions } from 'esri-loader';

@Component({
  selector: 'app-threat-lens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './threat-lens.html',
})
export class ThreatLensComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) private mapViewNode?: ElementRef<HTMLDivElement>;
  private view: any | null = null;
  private countryLayer: any | null = null;
  private countryLayerView: any | null = null;
  private highlightHandle: { remove: () => void } | null = null;
  private hoverFrameId: number | null = null;
  private readonly countryNameFields = ['COUNTRY', 'COUNTRYAFF', 'NAME', 'ADMIN', 'SOVEREIGNT'];

  searchTerm = 'Pakistan';
  hoverCountryName = '';
  selectedCountryName = '';
  statusMessage = '';

  constructor(private ngZone: NgZone) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.hoverFrameId !== null) {
      cancelAnimationFrame(this.hoverFrameId);
      this.hoverFrameId = null;
    }
    this.clearHighlight();
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  }

  async onSearch(): Promise<void> {
    const term = this.searchTerm.trim();
    if (!term) {
      this.statusMessage = 'Enter a country name to search.';
      return;
    }
    await this.searchCountry(term);
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapViewNode?.nativeElement) {
      return;
    }

    setDefaultOptions({ version: '4.34' });

    const [
      EsriMap,
      SceneView,
      FeatureLayer,
      GraphicsLayer,
      Graphic,
      Polyline,
      Point,
    ] = await loadModules([
      'esri/Map',
      'esri/views/SceneView',
      'esri/layers/FeatureLayer',
      'esri/layers/GraphicsLayer',
      'esri/Graphic',
      'esri/geometry/Polyline',
      'esri/geometry/Point',
    ]);

    this.countryLayer = new FeatureLayer({
      url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0',
      outFields: ['*'],
      popupEnabled: false,
      opacity: 0.42,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [62, 127, 220, 0.18],
          outline: {
            color: [148, 185, 255, 0.35],
            width: 0.6,
          },
        },
      },
    });

    const arcLayer = new GraphicsLayer({ title: 'Threat Lens Arc' });

    const map = new EsriMap({
      basemap: 'satellite',
      ground: 'world-elevation',
      layers: [this.countryLayer, arcLayer],
    });

    this.view = new SceneView({
      container: this.mapViewNode.nativeElement,
      map,
      qualityProfile: 'high',
      viewingMode: 'global',
      camera: {
        position: { longitude: -10, latitude: 30, z: 17000000 },
        tilt: 0,
      },
      environment: {
        atmosphereEnabled: true,
        starsEnabled: true,
      },
    });

    await this.view.when();
    this.countryLayerView = await this.view.whenLayerView(this.countryLayer);
    this.drawArc(arcLayer, Graphic, Polyline, Point);
    this.registerHoverHandler();
    this.registerClickHandler();
    await this.searchCountry(this.searchTerm);
  }

  private drawArc(arcLayer: any, Graphic: any, Polyline: any, Point: any): void {
    const usa: [number, number] = [-95.7129, 37.0902];
    const pakistan: [number, number] = [69.3451, 30.3753];
    const arcPath: [number, number, number][] = [];

    for (let i = 0; i <= 72; i += 1) {
      const t = i / 72;
      const lon = usa[0] + (pakistan[0] - usa[0]) * t;
      const lat = usa[1] + (pakistan[1] - usa[1]) * t;
      const z = 24000 + Math.sin(Math.PI * t) * 780000;
      arcPath.push([lon, lat, z]);
    }

    const arcGraphic = new Graphic({
      geometry: new Polyline({
        hasZ: true,
        paths: [arcPath],
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'line-3d',
        symbolLayers: [
          {
            type: 'path',
            profile: 'tube',
            width: 7,
            cap: 'round',
            material: { color: '#38bdf8' },
            anchor: 'center',
          },
        ],
      },
    });

    const usaPoint = new Graphic({
      geometry: new Point({ longitude: usa[0], latitude: usa[1], z: 5000 }),
      attributes: { country: 'United States' },
      symbol: {
        type: 'point-3d',
        symbolLayers: [
          {
            type: 'icon',
            resource: { primitive: 'circle' },
            size: 11,
            material: { color: '#f97316' },
            outline: { color: '#fdba74', size: 2 },
          },
        ],
      },
    });

    const pakistanPoint = new Graphic({
      geometry: new Point({ longitude: pakistan[0], latitude: pakistan[1], z: 5000 }),
      attributes: { country: 'Pakistan' },
      symbol: {
        type: 'point-3d',
        symbolLayers: [
          {
            type: 'icon',
            resource: { primitive: 'circle' },
            size: 11,
            material: { color: '#22c55e' },
            outline: { color: '#86efac', size: 2 },
          },
        ],
      },
    });

    arcLayer.addMany([arcGraphic, usaPoint, pakistanPoint]);
  }

  private registerHoverHandler(): void {
    if (!this.view || !this.countryLayer) {
      return;
    }

    this.view.on('pointer-move', (event: any) => {
      if (this.hoverFrameId !== null) {
        cancelAnimationFrame(this.hoverFrameId);
      }

      this.hoverFrameId = requestAnimationFrame(async () => {
        if (!this.view || !this.countryLayer) {
          return;
        }

        const hit = await this.view.hitTest(event, { include: [this.countryLayer] });
        const countryGraphic = hit.results.find((result: any) => result.graphic?.layer === this.countryLayer)?.graphic;
        const countryName = this.extractCountryName(countryGraphic?.attributes);

        this.ngZone.run(() => {
          this.hoverCountryName = countryName;
        });
      });
    });
  }

  private registerClickHandler(): void {
    if (!this.view || !this.countryLayer) {
      return;
    }

    this.view.on('click', async (event: any) => {
      if (!this.view || !this.countryLayer) {
        return;
      }

      const hit = await this.view.hitTest(event, { include: [this.countryLayer] });
      const countryGraphic = hit.results.find((result: any) => result.graphic?.layer === this.countryLayer)?.graphic;

      if (!countryGraphic) {
        this.clearHighlight();
        this.ngZone.run(() => {
          this.selectedCountryName = '';
          this.statusMessage = 'No country selected.';
        });
        return;
      }

      const name = this.extractCountryName(countryGraphic.attributes);
      this.applyHighlight(countryGraphic);

      this.ngZone.run(() => {
        this.selectedCountryName = name;
        this.statusMessage = name ? `Selected ${name}.` : 'Country selected.';
        if (name) {
          this.searchTerm = name;
        }
      });
    });
  }

  private async searchCountry(country: string): Promise<void> {
    if (!this.countryLayer || !this.countryLayerView || !this.view) {
      return;
    }

    const normalized = country.trim().toUpperCase().replace(/'/g, "''");
    const candidateFields = this.countryNameFields.filter((fieldName) => this.countryLayer.fields?.some((field: any) => String(field.name || '').toUpperCase() === fieldName));
    const fieldsToSearch = candidateFields.length ? candidateFields : ['COUNTRY', 'NAME'];

    let feature: any | null = null;

    for (const fieldName of fieldsToSearch) {
      const query = this.countryLayer.createQuery();
      query.where = `UPPER(${fieldName}) = '${normalized}'`;
      query.returnGeometry = true;
      query.outFields = ['*'];
      query.num = 1;
      const response = await this.countryLayer.queryFeatures(query);
      if (response.features.length) {
        feature = response.features[0];
        break;
      }
    }

    if (!feature) {
      for (const fieldName of fieldsToSearch) {
        const query = this.countryLayer.createQuery();
        query.where = `UPPER(${fieldName}) LIKE '%${normalized}%'`;
        query.returnGeometry = true;
        query.outFields = ['*'];
        query.num = 1;
        const response = await this.countryLayer.queryFeatures(query);
        if (response.features.length) {
          feature = response.features[0];
          break;
        }
      }
    }

    if (!feature) {
      this.ngZone.run(() => {
        this.statusMessage = `No country found for "${country}".`;
      });
      return;
    }

    this.applyHighlight(feature);

    const focusGeometry = feature.geometry?.extent ?? feature.geometry;
    if (focusGeometry) {
      try {
        await this.view.goTo(focusGeometry, { duration: 1200, easing: 'ease-in-out' });
      }
      catch {
      }
    }

    const name = this.extractCountryName(feature.attributes) || country;
    this.ngZone.run(() => {
      this.selectedCountryName = name;
      this.hoverCountryName = name;
      this.searchTerm = name;
      this.statusMessage = `Focused on ${name}.`;
    });
  }

  private applyHighlight(graphic: any): void {
    if (!this.countryLayerView) {
      return;
    }
    this.clearHighlight();
    this.highlightHandle = this.countryLayerView.highlight(graphic);
  }

  private clearHighlight(): void {
    if (this.highlightHandle) {
      this.highlightHandle.remove();
      this.highlightHandle = null;
    }
  }

  private extractCountryName(attributes: Record<string, unknown> | undefined): string {
    if (!attributes) {
      return '';
    }

    for (const fieldName of this.countryNameFields) {
      const value = attributes[fieldName];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return '';
  }
}
