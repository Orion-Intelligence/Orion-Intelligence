import { ThreatLensMapUtils } from '../map-utils/threat-lens-map.utils';

export class ThreatLensCountryLayerRenderer {
  private static readonly COUNTRY_LAYER_URL = 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer/0';
  private layerView: any | null = null;
  private highlightHandle: { remove: () => void } | null = null;
  private hoverHighlightHandle: { remove: () => void } | null = null;
  private readonly countryNameFields = ['COUNTRY', 'COUNTRYAFF', 'NAME', 'ADMIN', 'SOVEREIGNT'];

  layer: any | null = null;
  featureIndex = new Map<string, any>();

  createLayer(FeatureLayer: any): any {
    this.layer = new FeatureLayer({
      url: ThreatLensCountryLayerRenderer.COUNTRY_LAYER_URL,
      outFields: ['*'],
      popupEnabled: false,
      opacity: 1,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [29, 45, 71, 0.01],
          outline: {
            color: [255, 255, 255, 0],
            width: 0.8,
          },
        },
      },
      labelsVisible: true,
    });

    return this.layer;
  }

  async init(view: any, normalizeCountryLabel: (value: string) => string, toCountryKey: (value: string) => string): Promise<void> {
    if (!this.layer) {
      return;
    }

    this.layerView = await view.whenLayerView(this.layer);
    await this.buildFeatureIndex(normalizeCountryLabel, toCountryKey);
  }

  hasCountryKey(countryKey: string): boolean {
    return Boolean(countryKey && this.featureIndex.has(countryKey));
  }

  getFeature(countryKey: string): any | null {
    return this.featureIndex.get(countryKey) || null;
  }

  getCountryName(countryKey: string): string {
    return this.extractCountryName(this.getFeature(countryKey)?.attributes);
  }

  extractCountryName(attributes: Record<string, unknown> | undefined): string {
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

  applyHighlight(graphic: any): void {
    if (!this.layerView) {
      return;
    }

    this.clearHighlight();
    this.highlightHandle = this.layerView.highlight(graphic);
  }

  clearHighlight(): void {
    this.highlightHandle?.remove();
    this.highlightHandle = null;
  }

  applyHoverHighlight(graphic: any): void {
    if (!this.layerView) {
      return;
    }

    this.clearHoverHighlight();
    this.hoverHighlightHandle = this.layerView.highlight(graphic);
  }

  clearHoverHighlight(): void {
    this.hoverHighlightHandle?.remove();
    this.hoverHighlightHandle = null;
  }

  destroy(): void {
    this.clearHighlight();
    this.clearHoverHighlight();
    this.layerView = null;
    this.layer = null;
    this.featureIndex.clear();
  }

  private async buildFeatureIndex(normalizeCountryLabel: (value: string) => string, toCountryKey: (value: string) => string): Promise<void> {
    if (!this.layer) {
      return;
    }

    const query = this.layer.createQuery();
    query.where = '1=1';
    query.returnGeometry = true;
    query.outFields = ['*'];

    const response = await this.layer.queryFeatures(query);
    this.featureIndex = ThreatLensMapUtils.buildCountryFeatureIndex(response.features, this.countryNameFields, normalizeCountryLabel, toCountryKey);
  }
}
