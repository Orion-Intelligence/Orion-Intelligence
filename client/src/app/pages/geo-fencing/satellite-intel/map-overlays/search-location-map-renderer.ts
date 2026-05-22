export class SearchLocationMapRenderer {
  private marker: any = null;

  constructor(private L: any, private map: any) {}

  render(lat: number | null, lon: number | null): void {
    this.clear();
    if (!this.L || !this.map || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return;
    }

    this.marker = this.L.circleMarker([lat, lon], {
      radius: 8,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.25,
      weight: 2,
    }).addTo(this.map);
  }

  destroy(): void {
    this.clear();
  }

  private clear(): void {
    if (this.marker) {
      this.map?.removeLayer(this.marker);
      this.marker = null;
    }
  }
}
