import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgClass, NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ResultRowHelperService } from '../../../shared/services/result-row-helper.service';
type TelemetryGroup = {
    key: string;
    label: string;
    values: string[];
};
@Component({
  selector: 'app-expanded-row',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, TooltipDirective, TitleCasePipe],
  templateUrl: './expanded-row.component.html'
})
export class ExpandedRowComponent implements OnChanges {
  private copiedTimer: any = null;

  activeTelemetryKey: string | null = null;
  matchedValues: string[] = [];
  copiedKey: string | null = null;

  @Input() mode: 'stealer' | 'threat' = 'stealer';
  @Input() item: any = null;
  @Input() result: any = null;
  @Input() index: number = 0;
  @Input() searchQuery: string = '';

  constructor(private rowHelper: ResultRowHelperService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['item'] || changes['result'] || changes['index']) {
      this.activeTelemetryKey = null;
      this.copiedKey = null;
      if (this.copiedTimer) {
        clearTimeout(this.copiedTimer);
      }
      this.parseSearchQuery();
    }
  }

  parseSearchQuery() {
    if (!this.searchQuery) {
      return;
    }
    const parts = this.searchQuery
      .split(/\s*(\|\||\||&&|&)\s*/)
      .filter(p => p && !['||', '|', '&&', '&'].includes(p));
    for (let part of parts) {
      part = part.trim();
      let value = part;
      const tagMatch = part.match(/^(\w+):(.+)$/);
      if (tagMatch) {
        value = tagMatch[2].trim();
      }
      this.matchedValues.push(value);
    }
  }

  isTelemetryMatched(group: TelemetryGroup): boolean {
    return group.values.some(groupValue => this.matchedValues.some(matched => groupValue.toLowerCase().includes(matched.toLowerCase())));
  }

  isValueMatched(value: string): boolean {
    const lowerValue = value.toLowerCase();
    return this.matchedValues.some(v => lowerValue.includes(v.toLowerCase()));
  }

  get indexValue(): string {
    const n = Number.isFinite(this.index) ? this.index + 1 : 1;
    return String(n);
  }

  get rowTypeLabel(): string {
    return this.indexValue === '1' ? 'Stealer Log' : 'Threats';
  }

  get channelValue(): string {
    const v = this.item?.['channel'] ??
          this.item?.['m_channel'] ??
          this.item?.['source_channel'] ??
          this.item?.['m_source_channel'] ??
          this.result?.['channel'] ??
          this.result?.['m_channel'] ??
          this.result?.['source_channel'] ??
          this.result?.['m_source_channel'];
    const arr = this.rowHelper.normalizeToArray(v);
    return arr[0] || '-';
  }

  get yearValue(): string {
    const d = this.item?.date || this.result?.m_update_date;
    return d ? new Date(d).toISOString().slice(0, 7) : '-';
  }

  get fileTypeValue(): string {
    const v = this.item?.['type'] ??
          this.item?.['file_type'] ??
          this.item?.['fileType'] ??
          this.result?.['type'] ??
          this.result?.['file_type'] ??
          this.result?.['fileType'];
    const arr = this.rowHelper.normalizeToArray(v);
    return arr[0] || '-';
  }

  selectTelemetry(key: string, e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    this.activeTelemetryKey = this.activeTelemetryKey === key ? null : key;
  }

  get telemetryGroups(): TelemetryGroup[] {
    return this.mode === 'stealer' ? this.buildStealerGroups(this.item) : this.buildThreatGroups(this.result);
  }

  get telemetryCount(): number {
    return this.telemetryGroups.reduce((acc, g) => acc + (g.values?.length || 0), 0);
  }

  get activeTelemetryGroup(): TelemetryGroup | null {
    if (!this.activeTelemetryKey) {
      return null;
    }
    return this.telemetryGroups.find(g => g.key === this.activeTelemetryKey) || null;
  }

  telemetryIcon(key: string): string {
    const k = (key || '').toLowerCase();
    if (k.includes('email')) {
      return 'bi-envelope-fill';
    }
    if (k.includes('phone')) {
      return 'bi-telephone-fill';
    }
    if (k.includes('domain')) {
      return 'bi-globe2';
    }
    if (k.includes('url')) {
      return 'bi-link-45deg';
    }
    if (k.includes('ip')) {
      return 'bi-router-fill';
    }
    if (k.includes('country')) {
      return 'bi-flag-fill';
    }
    if (k.includes('cve') || k.includes('cwe')) {
      return 'bi-bug-fill';
    }
    if (k.includes('yara')) {
      return 'bi-shield-lock-fill';
    }
    if (k.includes('credit') || k.includes('card')) {
      return 'bi-credit-card-2-front-fill';
    }
    if (k.includes('org') || k.includes('company') || k.includes('industry')) {
      return 'bi-building';
    }
    if (k.includes('person') || k.includes('author')) {
      return 'bi-person-fill';
    }
    if (k.includes('location')) {
      return 'bi-geo-alt-fill';
    }
    if (k.includes('language')) {
      return 'bi-translate';
    }
    if (k.includes('agent')) {
      return 'bi-window';
    }
    if (k.includes('asn')) {
      return 'bi-diagram-3-fill';
    }
    if (k.includes('team')) {
      return 'bi-people-fill';
    }
    if (k.includes('hash') || k.includes('id')) {
      return 'bi-fingerprint';
    }
    if (k.includes('platform')) {
      return 'bi-cpu-fill';
    }
    if (k.includes('file') || k.includes('path')) {
      return 'bi-folder-fill';
    }
    return 'bi-tag-fill';
  }

  async copyText(text: any, key: string, e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    const value = text == null ? '' : String(text);
    if (!value || value === '-') {
      return;
    }
    const ok = await this.rowHelper.copyToClipboard(value);
    if (!ok) {
      return;
    }
    this.setCopied(key);
  }

  async copyAll(e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    const payload = this.buildReportText();
    if (!payload.trim()) {
      return;
    }
    const ok = await this.rowHelper.copyToClipboard(payload);
    if (!ok) {
      return;
    }
    this.setCopied('copy-all');
  }

  downloadReport(e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    const payload = this.buildReportText();
    if (!payload.trim()) {
      return;
    }
    const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const year = this.yearValue && this.yearValue !== '-' ? this.yearValue : 'report';
    const idx = this.indexValue || '1';
    a.href = url;
    a.download = `${year}_${idx}_${this.rowTypeLabel.replace(/\s+/g, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    this.setCopied('download');
  }

  isCopied(key: string): boolean {
    return this.copiedKey === key;
  }

  private setCopied(key: string) {
    this.copiedKey = key;
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = setTimeout(() => (this.copiedKey = null), 1200);
  }

  private buildReportText(): string {
    const lines: string[] = [];
    lines.push(`Type: ${this.rowTypeLabel}`);
    lines.push(`Index: ${this.indexValue}`);
    lines.push(`Channel: ${this.channelValue}`);
    lines.push(`Year: ${this.yearValue}`);
    lines.push(`File Type: ${this.fileTypeValue}`);
    lines.push('');
    if (this.mode === 'stealer') {
      const email = this.item?.['email']?.[0] || '-';
      const domain = this.item?.['domain']?.[0] || '-';
      const ip = this.item?.['ip']?.[0] || '-';
      const password = this.item?.['password']?.[0] || '-';
      lines.push('Identity Intelligence');
      lines.push(`Email: ${email}`);
      lines.push(`Domain: ${domain}`);
      lines.push(`IP: ${ip}`);
      lines.push(`Password: ${password}`);
      lines.push('');
    }
    else {
      lines.push('Indicator Details');
      lines.push(`ID: RANK-${this.indexValue}`);
      lines.push(`Credential: ${this.result?.rank_index || '-'}`);
      lines.push(`IOC: ${this.result?.m_url || '-'}`);
      lines.push(`Description: ${this.result?.m_important_content || '-'}`);
      lines.push('');
    }
    lines.push(`Metadata Telemetry Array (${this.telemetryCount})`);
    for (const g of this.telemetryGroups) {
      if (!g?.values?.length) {
        continue;
      }
      lines.push(`- ${g.label} (${g.values.length})`);
      for (const v of g.values) {
        lines.push(`  • ${v}`);
      }
    }
    lines.push('');
    const raw = this.mode === 'stealer' ? this.item?.['raw'] : this.result?.['raw'];
    if (raw != null) {
      lines.push('Raw Trace Buffer');
      lines.push(String(raw));
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildStealerGroups(item: any): TelemetryGroup[] {
    if (!item) {
      return [];
    }
    const emails = this.rowHelper.normalizeToArray(item?.['email']);
    const domains = this.rowHelper.normalizeToArray(item?.['domain']);
    const ips = this.rowHelper.normalizeToArray(item?.['ip']);
    const passwords = this.rowHelper.normalizeToArray(item?.['password']);
    const exclude = new Set<string>([
      '_id',
      'raw',
      'type',
      'file_type',
      'date',
      'fileType',
      'channel',
      'm_channel',
      'm_sub_host',
      'source_channel',
      'm_source_channel',
      'ip',
      'password',
      'mapping',
      'delimiter'
    ]);
    const core: TelemetryGroup[] = [];
    if (emails.length > 1) {
      core.push({ key: 'email', label: 'Email', values: emails });
    }
    if (domains.length > 1) {
      core.push({ key: 'domain', label: 'Domain', values: domains });
    }
    if (ips.length > 1) {
      core.push({ key: 'ip', label: 'IP', values: ips });
    }
    if (passwords.length > 1) {
      core.push({ key: 'password', label: 'Password', values: passwords });
    }
    const rest: TelemetryGroup[] = Object.keys(item)
      .filter(k => !exclude.has(k))
      .map(k => ({ key: k, label: this.rowHelper.prettyLabel(k), values: this.rowHelper.normalizeToArray(item?.[k]) }))
      .filter(g => g.values.length > 0)
      .sort((a, b) => a.label.localeCompare(b.label));
    return [...core, ...rest];
  }

  private buildThreatGroups(result: any): TelemetryGroup[] {
    if (!result) {
      return [];
    }
    const exclude = new Set<string>([
      'm_date',
      'm_file',
      'm_year',
      'm_source',
      'm_root_domain',
      'm_channel',
      'm_rank_index'
    ]);
    const groups: TelemetryGroup[] = Object.keys(result)
      .filter(k => k.startsWith('m_') && Array.isArray(result[k]) && result[k].length > 0 && !exclude.has(k))
      .map(k => ({ key: k, label: this.rowHelper.prettyLabel(k), values: this.rowHelper.normalizeToArray(result?.[k]) }))
      .filter(g => g.values.length > 0);
    const emailK = 'm_email';
    const domainK = 'm_domain';
    const ipK = 'm_ip';
    const passK = 'm_password';
    const emailV = this.rowHelper.normalizeToArray(result?.[emailK]);
    const domainV = this.rowHelper.normalizeToArray(result?.[domainK]);
    const ipV = this.rowHelper.normalizeToArray(result?.[ipK]);
    const passV = this.rowHelper.normalizeToArray(result?.[passK]);
    const core: TelemetryGroup[] = [];
    if (emailV.length > 0) {
      core.push({ key: emailK, label: 'Email', values: emailV });
    }
    if (domainV.length > 0) {
      core.push({ key: domainK, label: 'Domain', values: domainV });
    }
    if (ipV.length > 0) {
      core.push({ key: ipK, label: 'IP', values: ipV });
    }
    if (passV.length > 0) {
      core.push({ key: passK, label: 'Password', values: passV });
    }
    const rest = groups
      .filter(g => ![emailK, domainK, ipK, passK].includes(g.key))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [...core, ...rest];
  }
}
