import { SelectedCountryCategoryCount } from '../../../models/geo-fencing.models';

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
    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--ip';

    const title = document.createElement('div');
    title.className = 'threat-lens-tooltip__arc-title';
    title.textContent = 'IP Scan';

    tooltipContent.append(title, this.buildTooltipRow('IP address', ip));
    this.show(event, tooltipContent);
  }

  showArc(event: any, attributes: Record<string, unknown>): void {
    if (!this.tooltipEl) {
      return;
    }

    const startCountry = typeof attributes['start_country'] === 'string' ? attributes['start_country'] : 'Unknown start';
    const endCountry = typeof attributes['end_country'] === 'string' ? attributes['end_country'] : 'Unknown end';
    const category = typeof attributes['category_label'] === 'string' ? attributes['category_label'] : 'Threat';
    const weight = typeof attributes['weight'] === 'number' ? attributes['weight'] : Number(attributes['weight'] || 0);

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--arc';

    const title = document.createElement('div');
    title.className = 'threat-lens-tooltip__arc-title';
    title.textContent = 'Arc Route';

    tooltipContent.append(title,
      this.buildTooltipRow('Start', startCountry),
      this.buildTooltipRow('End', endCountry),
      this.buildTooltipRow('Category', category),
      this.buildTooltipRow('Records', String(weight)),);

    this.show(event, tooltipContent);
  }

  showCountry(event: any, countryName: string, threatCount: number, breakdown: SelectedCountryCategoryCount[]): void {
    if (!this.tooltipEl) {
      return;
    }

    const tooltipContent = document.createElement('div');
    tooltipContent.className = 'threat-lens-tooltip__content threat-lens-tooltip__content--country';

    const countryTitle = document.createElement('div');
    countryTitle.className = 'threat-lens-tooltip__country-title';
    countryTitle.textContent = countryName;

    const totalRow = document.createElement('div');
    totalRow.className = 'threat-lens-tooltip__total-row';

    const totalLabel = document.createElement('span');
    totalLabel.className = 'threat-lens-tooltip__total-label';
    totalLabel.textContent = 'Total Threats';

    const totalValue = document.createElement('span');
    totalValue.className = 'threat-lens-tooltip__total-value';
    totalValue.textContent = String(threatCount);

    totalRow.append(totalLabel, totalValue);
    tooltipContent.append(countryTitle, totalRow);

    if (breakdown.length) {
      for (const item of breakdown) {
        tooltipContent.append(this.buildBreakdownTooltipRow(item));
      }
    }
    else {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'threat-lens-tooltip__empty';
      emptyMessage.textContent = 'No data found';
      tooltipContent.append(emptyMessage);
    }

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

  private buildBreakdownTooltipRow(item: SelectedCountryCategoryCount): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'threat-lens-tooltip__breakdown-row';

    const labelWrap = document.createElement('div');
    labelWrap.className = 'threat-lens-tooltip__breakdown-label-wrap';

    const dot = document.createElement('span');
    dot.setAttribute('aria-hidden', 'true');
    dot.className = 'threat-lens-tooltip__breakdown-dot';
    dot.style.setProperty('--threat-lens-dot-color', item.colorHex);

    const label = document.createElement('span');
    label.className = 'threat-lens-tooltip__breakdown-label';
    label.textContent = item.label;

    const count = document.createElement('span');
    count.className = 'threat-lens-tooltip__breakdown-count';
    count.textContent = String(item.count);

    labelWrap.append(dot, label);
    row.append(labelWrap, count);

    return row;
  }
}
