import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, of, timer } from 'rxjs';
import { catchError, expand, finalize, switchMap, takeWhile } from 'rxjs/operators';
import { EmptyResultComponent } from '../../../shared/partials/empty-result/empty-result.component';
import { EmptyQueryComponent } from '../../../shared/partials/empty-query/empty-query.component';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ReportExportService } from '../../../shared/services/report-export.service';
import { GraphReportPayload } from '../../../shared/model/report/report-export.model';
@Component({
  selector: 'app-dashboard-api',
  imports: [FormsModule, NgOptimizedImage, EmptyResultComponent, EmptyQueryComponent, NgClass],
  animations: [fadeInDashboardItem],
  templateUrl: './dashboard-api.component.html'
})
export class DashboardApiComponent implements OnInit {
  q1 = '';
  q2 = '';
  displayQ1 = '';
  displayQ2 = '';
  loading = false;
  breachData: any = null;
  query_triggered = false;
  apiType: string | null = null;
  progress = 0;
  currentStep = '';
  responseData: any = null;
  txDrilldown = false;
  prevResponseData: any = null;
  prevQ1 = '';
  prevQ2 = '';
  prevDisplayQ1 = '';
  prevDisplayQ2 = '';
  prevBreachData: any = null;
  expandedResultIndex: number | null = null;
  trackByIndex = (index: number) => index;

  constructor(private route: ActivatedRoute, private http: HttpClient, private graphReportExport: ReportExportService) { }

  get cardsData(): any[] {
    const r = this.responseData;
    if (!r) {
      return [];
    }
    if (Array.isArray(r)) {
      return r;
    }
    if (Array.isArray(r?.cards_data)) {
      return r.cards_data;
    }
    if (Array.isArray(r?.result)) {
      return r.result;
    }
    if (Array.isArray(r?.data?.cards_data)) {
      return r.data.cards_data;
    }
    if (Array.isArray(r?.result?.cards_data)) {
      return r.result.cards_data;
    }
    return [];
  }

  get cryptoResult(): any {
    const r = this.responseData;
    if (!r) {
      return null;
    }
    if (r?.result && typeof r.result === 'object') {
      return r.result;
    }
    if (typeof r === 'object') {
      return r;
    }
    return null;
  }

  get hasResults(): boolean {
    if (this.apiType === 'crypto') {
      return !!this.cryptoResult;
    }
    return this.genericItems.length > 0;
  }

  get progressValue(): number {
    const p = Number(this.progress);
    if (!Number.isFinite(p)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(p)));
  }

  get genericItems(): any[] {
    if (this.apiType === 'crypto') {
      return [];
    }
    if (
      this.responseData &&
      typeof this.responseData === 'object' &&
      (
        Array.isArray(this.responseData.cards_data) ||
        Array.isArray(this.responseData.result) ||
        Array.isArray(this.responseData.data?.cards_data) ||
        Array.isArray(this.responseData.result?.cards_data)
      )
    ) {
      return this.cardsData;
    }
    if (this.cardsData.length > 0) {
      return this.cardsData;
    }
    if (this.responseData && typeof this.responseData === 'object') {
      return [this.responseData];
    }
    return [];
  }

  getObjectEntries(item: any): { key: string; value: any }[] {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }
    return Object.entries(item).map(([key, value]) => ({ key, value }));
  }

  displayFieldLabel(key: string): string {
    return key
      .replace(/^m_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  isArrayValue(value: any): boolean {
    return Array.isArray(value);
  }

  deduplicateWithCount(arr: any[]): { value: any; count: number }[] {
    if (!Array.isArray(arr)) {
      return [];
    }
    const map = new Map<string, number>();
    arr.forEach(item => {
      const key = String(item);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([value, count]) => ({ value, count }));
  }

  isObjectValue(value: any): boolean {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  isUrlValue(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return /^https?:\/\//i.test(value.trim());
  }

  stringifyPrimitive(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'not available';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  stringifyJson(value: any): string {
    try {
      return JSON.stringify(value, null, 2);
    }
    catch {
      return String(value);
    }
  }

  ngOnInit(): void {
    this.apiType = this.route.snapshot.data?.['type'] ? String(this.route.snapshot.data['type']) : null;
    this.route.data.subscribe(d => {
      this.apiType = d?.['type'] ? String(d['type']) : this.apiType;
    });
    this.route.queryParams.subscribe(params => {
      if (this.apiType === 'user') {
        if (params['username']) {
          this.q1 = params['username'];
        }
        if (params['email']) {
          this.q2 = params['email'];
        }
      }
      else if (this.apiType === 'social') {
        if (params['username']) {
          this.q1 = params['username'];
        }
        this.q2 = '';
      }
      else if (this.apiType === 'wanted') {
        if (params['query']) {
          this.q1 = params['query'];
        }
        this.q2 = '';
      }
      else if (this.apiType === 'national-identity') {
        if (params['cnic']) {
          this.q1 = params['cnic'];
        }
        this.q2 = '';
      }
      else if (this.apiType === 'cracked') {
        if (params['playstore']) {
          this.q1 = params['playstore'];
        }
        this.q2 = '';
      }
      else if (this.apiType === 'software') {
        if (params['name']) {
          this.q1 = params['name'];
        }
        this.q2 = '';
      }
      else if (this.apiType === 'crypto') {
        if (params['text']) {
          this.q1 = params['text'];
        }
        this.q2 = '';
      }
      else {
        if (params['q1']) {
          this.q1 = params['q1'];
        }
        if (params['q2']) {
          this.q2 = params['q2'];
        }
      }
      if (this.q1 || this.q2) {
        this.onSearchSubmit(null);
      }
    });
  }

  openTx(txid: string | null | undefined) {
    const t = (txid || '').trim();
    if (!t) {
      return;
    }
    if (this.apiType !== 'crypto') {
      return;
    }
    if (!this.txDrilldown) {
      this.prevResponseData = this.responseData;
      this.prevQ1 = this.q1;
      this.prevQ2 = this.q2;
      this.prevDisplayQ1 = this.displayQ1;
      this.prevDisplayQ2 = this.displayQ2;
      this.prevBreachData = this.breachData;
    }
    this.txDrilldown = true;
    this.q1 = t;
    this.displayQ1 = t;
    this.onSearchSubmit(null);
  }

  openAddr(addr: string | null | undefined) {
    const a = (addr || '').trim();
    if (!a) {
      return;
    }
    this.openTx(a);
  }

  backFromTx() {
    this.txDrilldown = false;
    this.responseData = this.prevResponseData;
    this.q1 = this.prevQ1;
    this.q2 = this.prevQ2;
    this.displayQ1 = this.prevDisplayQ1;
    this.displayQ2 = this.prevDisplayQ2;
    this.breachData = this.prevBreachData;
    this.loading = false;
    this.progress = 0;
    this.currentStep = '';
    this.query_triggered = true;
  }

  onSearchSubmit($event: SubmitEvent | null) {
    if ($event) {
      $event.preventDefault();
    }
    this.loading = true;
    this.responseData = null;
    this.breachData = null;
    this.progress = 0;
    this.currentStep = '';
    this.query_triggered = true;
    this.expandedResultIndex = null;
    let payload: any;
    if (this.apiType === 'user') {
      payload = { text: { username: this.q1, email: this.q2 } };
    }
    else if (this.apiType === 'social') {
      payload = { text: { username: this.q1 } };
    }
    else if (this.apiType === 'wanted') {
      payload = { text: { query: this.q1 } };
    }
    else if (this.apiType === 'national-identity') {
      payload = { text: { pak_query: this.q1 } };
    }
    else if (this.apiType === 'cracked') {
      payload = { text: { playstore: this.q1 } };
    }
    else if (this.apiType === 'software') {
      payload = { text: { name: this.q1 } };
    }
    else if (this.apiType === 'crypto') {
      const t = (this.q1 || '').trim();
      const isHash = /^(0x)?[a-fA-F0-9]{64}$/.test(t);
      payload = { text: isHash ? { hash: t } : { wallet: t } };
    }
    else {
      payload = { text: { q1: this.q1, q2: this.q2 } };
    }
    let endpoint = '/api/dynamic/';
    if (this.apiType === 'user') {
      endpoint = '/api/dynamic/user';
    }
    else if (this.apiType === 'social') {
      endpoint = '/api/dynamic/social';
    }
    else if (this.apiType === 'wanted') {
      endpoint = '/api/dynamic/wanted';
    }
    else if (this.apiType === 'national-identity') {
      endpoint = '/api/dynamic/national-identity';
    }
    else if (this.apiType === 'cracked') {
      endpoint = '/api/dynamic/cracked';
    }
    else if (this.apiType === 'software') {
      endpoint = '/api/dynamic/software';
    }
    else if (this.apiType === 'crypto') {
      endpoint = '/api/crypto/scan';
    }
    this.fetchSearchResults(endpoint, payload)
      .pipe(finalize(() => {
        this.loading = false;
      }))
      .subscribe({
        next: res => {
          const pending = this.isPendingResponse(res);
          const failedPending = this.isFailedPendingResponse(res);
          if (pending) {
            const p = res?.result?.progress ?? res?.progress;
            if (typeof p === 'number' && !Number.isNaN(p)) {
              this.progress = p;
            }
            const st = res?.result?.step ?? res?.step;
            if (typeof st === 'string' && st) {
              this.currentStep = st;
            }
            if (failedPending) {
              return;
            }
            return;
          }
          if (this.isFailedDoneResponse(res)) {
            this.responseData = null;
            this.breachData = null;
            this.expandedResultIndex = null;
            this.displayQ1 = this.q1;
            this.displayQ2 = this.q2;
            return;
          }
          if (this.apiType === 'crypto') {
            this.responseData = res;
            this.expandedResultIndex = null;
          }
          else {
            const normalized = (res && typeof res === 'object')
              ? (res.data ?? res.result ?? res)
              : res;
            this.responseData = normalized;
            this.breachData = (this.cardsData && this.cardsData.length > 0) ? this.cardsData[0] : null;
            this.expandedResultIndex = this.genericItems.length === 1 ? 0 : null;
          }
          this.displayQ1 = this.q1;
          this.displayQ2 = this.q2;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  get crackedValid(): boolean {
    try {
      const u = new URL(this.q1);
      return ((u.protocol === 'https:' || u.protocol === 'http:') && u.hostname === 'play.google.com') || /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(this.q1);
    }
    catch {
      return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(this.q1);
    }
  }

  get cryptoTextValid(): boolean {
    const t = (this.q1 || '').trim();
    if (!t) {
      return false;
    }
    const txHashPattern = /^(0x)?[a-fA-F0-9]{64}$/;
    const btcLegacy = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const btcSegwit = /^bc1[a-z0-9]{39,59}$/;
    const eth = /^0x[a-fA-F0-9]{40}$/;
    return txHashPattern.test(t) || btcLegacy.test(t) || btcSegwit.test(t) || eth.test(t);
  }

  private fetchSearchResults(apiEndpoint: string, paramModel: any): Observable<any> {
    return this.http.post<any>(apiEndpoint, paramModel).pipe(expand(res => this.shouldContinuePolling(res)
      ? timer(2000).pipe(switchMap(() => this.http.post<any>(apiEndpoint, paramModel)))
      : EMPTY), takeWhile(res => this.shouldContinuePolling(res), true), catchError(_ => of(null)));
  }

  private isPendingResponse(res: any): boolean {
    const topStatus = (res?.status || '').toLowerCase();
    const nestedStatus = (res?.result?.status || '').toLowerCase();
    return ['pending', 'processing', 'running', 'busy'].includes(topStatus) ||
      ['pending', 'processing', 'running', 'busy'].includes(nestedStatus);
  }

  private isFailedPendingResponse(res: any): boolean {
    return (res?.status === 'pending' || res?.result?.status === 'pending') &&
            ((res?.result?.progress ?? res?.progress) === 0) &&
            ((res?.result?.step ?? res?.step) === 'failed');
  }

  private isFailedDoneResponse(res: any): boolean {
    const status = (res?.result?.status ?? res?.status ?? '').toLowerCase();
    const step = (res?.result?.step ?? res?.step ?? '').toLowerCase();
    return status === 'done' && step === 'failed';
  }

  private shouldContinuePolling(res: any): boolean {
    return this.isPendingResponse(res) && !this.isFailedPendingResponse(res);
  }

  toggleResultItem(index: number): void {
    this.expandedResultIndex = this.expandedResultIndex === index ? null : index;
  }

  exportPdfReport(): void {
    if (!this.hasResults) {
      return;
    }

    const query = (this.displayQ1 || this.q1 || 'query').trim();
    const now = new Date().toISOString();
    const apiLabel = (this.apiType || 'api').replace(/-/g, ' ');
    const toCompact = (v: any): string => {
      const raw = this.isObjectValue(v) || this.isArrayValue(v) ? this.stringifyJson(v) : this.stringifyPrimitive(v);
      return raw.length > 500 ? `${raw.slice(0, 497)}...` : raw;
    };

    if (this.apiType === 'crypto' && this.cryptoResult) {
      const r = this.cryptoResult;
      const values: Record<string, string> = {};
      Object.entries(r || {}).forEach(([k, v]) => {
        values[this.displayFieldLabel(k)] = toCompact(v);
      });

      const payload: GraphReportPayload = {
        graphKind: 'cti',
        title: `Entity API Report - ${this.displayFieldLabel(apiLabel)}`,
        sessionName: `${this.apiType || 'api'}-${query || 'query'}`.slice(0, 80),
        generatedAtIso: now,
        nodes: Object.keys(values).map((k, i) => ({ id: `field-${i + 1}`, label: k, type: 'field' })),
        edges: Object.keys(values).map((k, i) => ({ id: `edge-${i + 1}`, from: query || 'query', to: k, label: 'contains' })),
        summary: {
          api_type: this.displayFieldLabel(apiLabel),
          query,
          status: this.stringifyPrimitive(r?.status),
          network: this.stringifyPrimitive(r?.network || r?.detected_network),
          query_type: this.stringifyPrimitive(r?.query_type),
          total_fields: Object.keys(values).length,
          exported_at: now
        },
        tables: [
          {
            title: 'Request Context',
            values: {
              'API Type': this.displayFieldLabel(apiLabel),
              'Query': query || 'not available',
              'Query 2': this.displayQ2 || this.q2 || 'not available',
              'Exported At': new Date(now).toLocaleString()
            }
          },
          { title: 'Crypto Result', values }
        ]
      };
      this.graphReportExport.exportByType(payload, 'doc_pdf');
      return;
    }

    const items = this.genericItems || [];
    const tables = items.slice(0, 40).map((item, idx) => {
      const values: Record<string, string> = {};
      this.getObjectEntries(item).slice(0, 25).forEach(entry => {
        values[this.displayFieldLabel(entry.key)] = toCompact(entry.value);
      });
      return { title: `Result ${idx + 1}`, values };
    });

    const payload: GraphReportPayload = {
      graphKind: (this.apiType === 'social' || this.apiType === 'wanted' || this.apiType === 'national-identity') ? 'social' : 'cti',
      title: `Entity API Report - ${this.displayFieldLabel(apiLabel)}`,
      sessionName: `${this.apiType || 'api'}-${query || 'query'}`.slice(0, 80),
      generatedAtIso: now,
      nodes: items.slice(0, 200).map((item, idx) => ({
        id: `result-${idx + 1}`,
        label: this.stringifyPrimitive(item?.m_title || item?.m_app_name || item?.title || `Result ${idx + 1}`),
        type: 'record'
      })),
      edges: items.slice(0, 200).map((_, idx) => ({
        id: `edge-result-${idx + 1}`,
        from: query || 'query',
        to: `result-${idx + 1}`,
        label: 'matched'
      })),
      summary: {
        api_type: this.displayFieldLabel(apiLabel),
        query,
        total_results: items.length,
        expanded_default: items.length === 1 ? 'yes' : 'no',
        exported_at: now
      },
      tables: [
        {
          title: 'Request Context',
          values: {
            'API Type': this.displayFieldLabel(apiLabel),
            'Query': query || 'not available',
            'Query 2': this.displayQ2 || this.q2 || 'not available',
            'Result Count': String(items.length),
            'Exported At': new Date(now).toLocaleString()
          }
        },
        ...tables
      ]
    };

    this.graphReportExport.exportByType(payload, 'doc_pdf');
  }
}
