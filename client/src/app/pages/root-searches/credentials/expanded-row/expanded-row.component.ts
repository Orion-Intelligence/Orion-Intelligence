import { Component, OnChanges, OnDestroy, SimpleChanges, input } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { ResultRowHelperService } from '../../../../shared/services/result-row-helper.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ConfirmationPopupComponent } from '../../../../shared/partials/confirmation-popup/confirmation-popup.component';

interface TelemetryGroup {
    key: string;
    label: string;
    values: string[];
}
@Component({
  selector: 'app-expanded-row',
  standalone: true,
  imports: [NgClass, TitleCasePipe, TooltipDirective, TranslatePipe, ConfirmationPopupComponent],
  templateUrl: './expanded-row.component.html',
})
export class ExpandedRowComponent implements OnChanges, OnDestroy {
  private copiedTimer: any = null;
  private telemetryGroupsCache: TelemetryGroup[] = [];
  private visiblePasswordKeys = new Set<string>();
  private readonly passwordRevealConfirmKey = 'orion.passwordRevealConfirmed';
  private passwordRevealConfirmed = false;
  private pendingPasswordRevealKey: string | null = null;

  activeTelemetryKey: string | null = null;
  matchedValues: string[] = [];
  copiedKey: string | null = null;
  isPasswordRevealConfirmationOpen = false;
  readonly mode = input<'stealer' | 'threat'>('stealer');
  readonly item = input<any>(null);
  readonly result = input<any>(null);
  readonly index = input<number>(0);
  readonly searchQuery = input<string>('');

  constructor(private rowHelper: ResultRowHelperService) {
    this.passwordRevealConfirmed = this.getPasswordRevealConfirmed();
  }

  ngOnDestroy(): void {
    if (this.copiedTimer) {
      clearTimeout(this.copiedTimer);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['item'] || changes['result']) {
      this.activeTelemetryKey = null;
    }
    if (changes['mode'] || changes['item'] || changes['result'] || changes['index']) {
      this.copiedKey = null;
      if (this.copiedTimer) {
        clearTimeout(this.copiedTimer);
      }
      this.visiblePasswordKeys.clear();
    }
    if (changes['mode'] || changes['item'] || changes['result']) {
      this.rebuildTelemetryGroups();
    }
    if (changes['mode'] || changes['item'] || changes['result'] || changes['index'] || changes['searchQuery']) {
      this.parseSearchQuery();
    }
  }

  parseSearchQuery() {
    this.matchedValues = [];
    const searchQuery = this.searchQuery();
    if (!searchQuery) {
      return;
    }
    const parts = searchQuery
      .split(/\s*(\|\||\||&&|&)\s*/)
      .filter(p => p && !['||', '|', '&&', '&'].includes(p));
    for (let part of parts) {
      part = part.trim();
      let value = part;
      const tagMatch = part.match(/^(\w+):(.+)$/);
      if (tagMatch) {
        value = tagMatch[2].trim();
      }
      if (value) {
        this.matchedValues.push(value);
      }
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
    const index = this.index();
    const n = Number.isFinite(index) ? index + 1 : 1;
    return String(n);
  }

  get channelValue(): string {
    const item = this.item();
    const result = this.result();
    const v = item?.['channel'] ??
          item?.['m_channel'] ??
          item?.['source_channel'] ??
          item?.['m_source_channel'] ??
          result?.['channel'] ??
          result?.['m_channel'] ??
          result?.['source_channel'] ??
          result?.['m_source_channel'];
    const arr = this.rowHelper.normalizeToArray(v);
    return arr[0] || '-';
  }

  get yearValue(): string {
    const d = this.item()?.date || this.result()?.m_update_date;
    if (!d) {
      return '-';
    }
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toISOString().slice(0, 7);
  }

  get fileTypeValue(): string {
    const item = this.item();
    const result = this.result();
    const v = item?.['type'] ??
          item?.['file_type'] ??
          item?.['fileType'] ??
          result?.['type'] ??
          result?.['file_type'] ??
          result?.['fileType'];
    const arr = this.rowHelper.normalizeToArray(v);
    return arr[0] || '-';
  }

  get passwordValue(): string {
    const arr = this.rowHelper.normalizeToArray(this.item()?.['password']);
    return arr[0] || '-';
  }

  get sourceDomainValues(): string[] {
    const explicitSourceDomains = this.getSourceDomainValues(this.item());
    if (explicitSourceDomains.length) {
      return explicitSourceDomains;
    }
    return this.getRawDomainValues(this.item());
  }

  get sourceDomainValueText(): string {
    return this.sourceDomainValues.length ? this.sourceDomainValues.join(', ') : '-';
  }

  get domainValues(): string[] {
    const item = this.item();
    const domains = this.getRawDomainValues(item);
    if (domains.length) {
      return domains;
    }
    return this.getSourceDomainValues(item);
  }

  get domainValueText(): string {
    return this.domainValues.length ? this.domainValues.join(', ') : '-';
  }

  confidenceScore(): number {
    const record = this.mode() === 'stealer' ? this.item() : this.result();
    if (!record) {
      return 0;
    }

    const values = (value: any): string[] => this.rowHelper.normalizeToArray(value);
    const clean = (value: any): string => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const term = (value: string): string => {
      let text = String(value || '').trim().replace(/^['"]|['"]$/g, '');
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
        const fieldMatch = text.match(/^[a-z_][a-z0-9_]*:(.+)$/i);
        if (fieldMatch) {
          text = fieldMatch[1].trim();
        }
      }
      return clean(text);
    };
    const domain = (value: string): string => {
      let text = clean(value);
      if (!text || text === '-') {
        return '';
      }
      text = text.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
      text = text.replace(/^[^@/\s]+@/, '');
      text = text.split(/[/?#]/)[0] ?? '';
      text = text.split(':')[0] ?? '';
      text = text.replace(/^\.+|\.+$/g, '').replace(/^www\./, '');
      return text && text.includes('.') && !/\s/.test(text) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(text) ? text : '';
    };

    const searchTerms = Array.from(new Set((this.searchQuery() || '')
      .split(/\s*(?:\|\||&&|\||&)\s*|[\s,;]+/)
      .map(term)
      .filter(value => value.length >= 3)));
    const domains = Array.from(new Set((this.mode() === 'stealer'
      ? [...values(record?.['domain']), ...values(record?.['source_domain'])]
      : [...values(record?.m_domain), ...values(record?.m_root_domain), ...values(record?.m_url), ...values(record?.m_base_url), ...values(record?.m_weblink)])
      .map(domain)
      .filter(Boolean)));
    const keys = this.mode() === 'stealer'
      ? ['email', 'username', 'user', 'domain', 'source_domain', 'raw', 'url', 'ip', 'bin', 'card_type', 'channel', 'file', 'timestamp', 'date']
      : ['m_email', 'm_username', 'm_user', 'm_domain', 'm_root_domain', 'm_url', 'm_base_url', 'm_weblink', 'm_title', 'm_content', 'm_important_content', 'm_channel', 'm_date', 'm_update_date', 'rank_index', 'm_rank_index'];
    const searchable = Array.from(new Set([...domains, ...keys.flatMap(key => values(record?.[key]))])).map(clean).filter(value => value.length >= 3);
    const baseKeys = ['confidence', 'confidence_score', 'score', 'rank_score', 'relevance_score', 'm_score'];
    let score = baseKeys.reduce((found, key) => {
      if (found > 0) {
        return found;
      }
      const raw = Number(values(record?.[key])[0]);
      return Number.isFinite(raw) && raw > 0 ? (raw <= 1 ? raw * 100 : raw) : 0;
    }, 0) || 50;

    if (searchTerms.some(search => searchable.some(value => value.includes(search) || search.includes(value)))) {
      score += 18;
    }
    const dateValue = ['date', 'm_date', 'm_update_date', 'timestamp', 'created_at', 'updated_at', 'time', 'year']
      .map(key => values(record?.[key])[0])
      .find(Boolean);
    const parsedDate = dateValue ? new Date(dateValue) : null;
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      const days = (Date.now() - parsedDate.getTime()) / 86400000;
      score += days <= 30 ? 12 : days <= 180 ? 8 : days <= 365 ? 5 : 0;
    }
    if (domains.length > 1) {
      score += 8;
    }
    if (searchTerms.some(search => {
      const queryDomain = domain(search) || search;
      return queryDomain.length >= 3 && domains.some(value => value.includes(queryDomain) || queryDomain.includes(value));
    })) {
      score += 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  get identityPasswordKey(): string {
    return `${this.mode()}-identity-password`;
  }

  isPasswordVisible(key: string): boolean {
    return this.visiblePasswordKeys.has(key);
  }

  togglePassword(key: string, value: string, e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    if (!value || value === '-') {
      return;
    }
    if (this.visiblePasswordKeys.has(key)) {
      return;
    }
    if (!this.passwordRevealConfirmed) {
      this.pendingPasswordRevealKey = key;
      this.isPasswordRevealConfirmationOpen = true;
      return;
    }
    this.visiblePasswordKeys.add(key);
  }

  isPasswordMasked(key: string, value: string): boolean {
    return !!value && value !== '-' && !this.isPasswordVisible(key);
  }

  passwordTooltip(key: string, value: string): string {
    if (!value || value === '-') {
      return 'No password';
    }
    return this.isPasswordVisible(key) ? 'Password revealed' : 'Show password';
  }

  isPasswordGroup(group: TelemetryGroup): boolean {
    const key = (group?.key || '').toLowerCase();
    const label = (group?.label || '').toLowerCase();
    return key.includes('password') || label.includes('password');
  }

  passwordTelemetryKey(groupKey: string, index: number): string {
    return `${this.mode()}-${groupKey}-${index}`;
  }

  isTelemetryPasswordMasked(group: TelemetryGroup, index: number, value: string): boolean {
    return this.isPasswordGroup(group) && this.isPasswordMasked(this.passwordTelemetryKey(group.key, index), value);
  }

  telemetryValueTooltip(group: TelemetryGroup, value: string, index: number, copyKey: string): string {
    if (!this.isPasswordGroup(group)) {
      return this.isCopied(copyKey) ? 'Copied' : 'Copy';
    }
    return this.passwordTooltip(this.passwordTelemetryKey(group.key, index), value);
  }

  handleTelemetryValueClick(group: TelemetryGroup, value: string, index: number, copyKey: string, e?: MouseEvent) {
    if (!this.isPasswordGroup(group)) {
      this.copyText(value, copyKey, e);
      return;
    }
    this.togglePassword(this.passwordTelemetryKey(group.key, index), value, e);
  }

  handlePasswordRevealConfirmation(confirmed: boolean) {
    this.isPasswordRevealConfirmationOpen = false;
    if (confirmed) {
      this.passwordRevealConfirmed = true;
      this.setPasswordRevealConfirmed();
      if (this.pendingPasswordRevealKey) {
        this.visiblePasswordKeys.add(this.pendingPasswordRevealKey);
      }
    }
    this.pendingPasswordRevealKey = null;
  }

  private getPasswordRevealConfirmed(): boolean {
    try {
      return localStorage.getItem(this.passwordRevealConfirmKey) === 'true';
    }
    catch {
      return false;
    }
  }

  private setPasswordRevealConfirmed() {
    try {
      localStorage.setItem(this.passwordRevealConfirmKey, 'true');
    }
    catch {
      return;
    }
  }

  get telemetryGroups(): TelemetryGroup[] {
    return this.telemetryGroupsCache;
  }

  get activeTelemetryGroup(): TelemetryGroup | null {
    if (!this.activeTelemetryKey) {
      return null;
    }
    return this.telemetryGroups.find(g => g.key === this.activeTelemetryKey) || null;
  }

  selectTelemetry(key: string, e?: MouseEvent) {
    if (e) {
      e.stopPropagation();
    }
    this.activeTelemetryKey = key;
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

  copyText(text: any, key: string, e?: MouseEvent) {
    this.rowHelper.copyText(text, key, (copiedKey) => {
      this.copiedTimer = this.rowHelper.setCopiedState(copiedKey, this.copiedTimer, (value) => {
        this.copiedKey = value;
      });
    }, e);
  }

  isCopied(key: string): boolean {
    return this.rowHelper.isCopied(this.copiedKey, key);
  }

  private rebuildTelemetryGroups() {
    this.telemetryGroupsCache = this.mode() === 'stealer'
      ? this.buildStealerGroups(this.item())
      : this.buildThreatGroups(this.result());
    const domainKey = this.mode() === 'stealer' ? 'domain' : 'm_domain';
    this.activeTelemetryKey = this.telemetryGroupsCache.find(g => g.key === domainKey)?.key || this.telemetryGroupsCache[0]?.key || null;
  }

  private buildStealerGroups(item: any): TelemetryGroup[] {
    if (!item) {
      return [];
    }
    const emails = this.rowHelper.normalizeToArray(item?.['email']);
    const sourceDomains = this.getSourceDomainValues(item);
    const domains = this.uniqueValues([
      ...this.getRawDomainValues(item),
      ...sourceDomains
    ]);
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
      'hash',
      'index',
      'mapping',
      'delimiter',
      'domain',
      'source_domain'
    ]);
    const core: TelemetryGroup[] = [];
    if (emails.length > 1) {
      core.push({ key: 'email', label: 'Email', values: emails });
    }
    if (domains.length > 0) {
      core.push({ key: 'domain', label: sourceDomains.length ? 'Domain / Source Domain' : 'Domain', values: domains });
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
      .filter(g => !this.isHashOrIndexKey(g.key, g.label))
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
      'm_rank_index',
      'm_hash',
      'm_index'
    ]);
    const groups: TelemetryGroup[] = Object.keys(result)
      .filter(k => k.startsWith('m_') && Array.isArray(result[k]) && result[k].length > 0 && !exclude.has(k))
      .map(k => ({ key: k, label: this.rowHelper.prettyLabel(k), values: this.rowHelper.normalizeToArray(result?.[k]) }))
      .filter(g => g.values.length > 0)
      .filter(g => !this.isHashOrIndexKey(g.key, g.label));
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

  private isHashOrIndexKey(key: string, label?: string): boolean {
    const k = (key || '').toLowerCase();
    const l = (label || '').toLowerCase();
    return k.includes('hash') || k.includes('index') || l.includes('hash') || l.includes('index');
  }

  private uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.map(v => String(v).trim()).filter(Boolean)));
  }

  private getRawDomainValues(item: any): string[] {
    return this.uniqueValues(this.rowHelper.normalizeToArray(item?.['domain']));
  }

  private getSourceDomainValues(item: any): string[] {
    return this.uniqueValues(this.rowHelper.normalizeToArray(item?.['source_domain']));
  }
}
