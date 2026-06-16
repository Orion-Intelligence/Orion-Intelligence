export class ThreatLensTooltipRenderer {
  private tooltipEl: HTMLDivElement | null = null;
  private tooltipPlacement: 'above' | 'below' = 'below';

  init(): void {
    if (typeof window === 'undefined' || this.tooltipEl) {
      return;
    }

    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'threat-lens-tooltip';
    this.tooltipEl.hidden = true;
    document.body.appendChild(this.tooltipEl);
  }

  destroy(): void {
    this.tooltipEl?.remove();
    this.tooltipEl = null;
  }

  showIpScan(event: any, attributes: Record<string, unknown>): void {
    if (!this.tooltipEl) {
      return;
    }

    const ip = typeof attributes['ip'] === 'string' ? attributes['ip'] : 'Unknown IP';
    const network = typeof attributes['network'] === 'string' ? attributes['network'] : '';
    const accuracyRadius = this.toFiniteNumber(attributes['accuracyRadius']);
    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--ip';

    const title = document.createElement('div');
    title.className = 'threat-lens-tooltip__arc-title';
    title.textContent = 'Approximate location';

    tooltipContent.append(title, this.buildTooltipRow('IP address', ip));
    if (network) {
      tooltipContent.append(this.buildTooltipRow('Network', network));
    }
    if (accuracyRadius !== undefined) {
      tooltipContent.append(this.buildTooltipRow('Approx. radius', this.formatKm(accuracyRadius)));
    }
    this.show(event, tooltipContent);
  }

  showIpCluster(event: any, attributes: Record<string, unknown>): void {
    if (!this.tooltipEl) {
      return;
    }

    const count = Number(attributes['count'] || 0);
    const networkCount = Number(attributes['networkCount'] || 0);
    const accuracyRadius = this.toFiniteNumber(attributes['accuracyRadius']);
    const accuracyMin = this.toFiniteNumber(attributes['accuracyMin']);
    const accuracyMax = this.toFiniteNumber(attributes['accuracyMax']);
    const records = Array.isArray(attributes['records']) ? attributes['records'] : [];
    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--ip';

    const title = document.createElement('div');
    title.className = 'threat-lens-tooltip__arc-title';
    title.textContent = 'Stacked approximate IPs';

    tooltipContent.append(title);
    tooltipContent.append(this.buildTooltipRow('Why stacked', String(attributes['stackReason'] || 'Same MaxMind coordinate')));
    tooltipContent.append(this.buildTooltipRow('IP records', String(count || records.length)));
    if (networkCount > 0) {
      tooltipContent.append(this.buildTooltipRow('Prefixes', String(networkCount)));
    }
    if (accuracyMin !== undefined && accuracyMax !== undefined) {
      tooltipContent.append(this.buildTooltipRow('Approx. radius', this.formatKmRange(accuracyMin, accuracyMax)));
    }
    else if (accuracyRadius !== undefined) {
      tooltipContent.append(this.buildTooltipRow('Approx. radius', this.formatKm(accuracyRadius)));
    }
    const sampleIps = records
      .map((record: any) => String(record?.ip || '').trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
    if (sampleIps) {
      tooltipContent.append(this.buildTooltipRow('Sample', sampleIps));
    }
    this.show(event, tooltipContent);
  }

  showCountry(event: any, countryName: string): void {
    if (!this.tooltipEl) {
      return;
    }

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--country';

    const countryTitle = document.createElement('div');
    countryTitle.className = 'threat-lens-tooltip__country-title';
    countryTitle.textContent = countryName;

    tooltipContent.append(countryTitle);
    this.show(event, tooltipContent, 'above');
  }

  move(event: any): void {
    if (!this.tooltipEl) {
      return;
    }

    const x = Number(event?.native?.clientX ?? event?.clientX ?? event?.touches?.[0]?.clientX ?? event?.x ?? 0);
    const y = Number(event?.native?.clientY ?? event?.clientY ?? event?.touches?.[0]?.clientY ?? event?.y ?? 0);
    const width = this.tooltipEl.offsetWidth;
    const height = this.tooltipEl.offsetHeight;
    const preferredLeft = this.tooltipPlacement === 'above' ? x - width / 2 : x + 10;
    const preferredTop = this.tooltipPlacement === 'above' ? y - height - 10 : y + 10;
    const left = Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8));
    const top = Math.max(8, Math.min(preferredTop, window.innerHeight - height - 8));
    this.tooltipEl.setAttribute('style', `left:${left}px;top:${top}px`);
  }

  hide(): void {
    if (this.tooltipEl) {
      this.tooltipEl.hidden = true;
    }
  }

  private show(event: any, content: HTMLDivElement, placement: 'above' | 'below' = 'below'): void {
    this.tooltipPlacement = placement;
    this.tooltipEl?.replaceChildren(content);
    if (this.tooltipEl) {
      this.tooltipEl.hidden = false;
    }
    this.move(event);
  }

  private buildTooltipRow(label: string, value: string): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'threat-lens-tooltip__row';

    const labelEl = document.createElement('span');
    labelEl.className = 'threat-lens-tooltip__label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'threat-lens-tooltip__value';
    valueEl.textContent = value;

    row.append(labelEl, valueEl);

    return row;
  }

  private toFiniteNumber(value: unknown): number | undefined {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  private formatKm(value: number): string {
    if (value >= 100) {
      return `${Math.round(value)} km`;
    }
    return `${Math.round(value * 10) / 10} km`;
  }

  private formatKmRange(min: number, max: number): string {
    if (Math.abs(max - min) < 0.1) {
      return this.formatKm(max);
    }
    return `${this.formatKm(min)}-${this.formatKm(max)}`;
  }

}
