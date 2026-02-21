import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, of, timer } from 'rxjs';
import { catchError, expand, finalize, switchMap, takeWhile } from 'rxjs/operators';
import { EmptyResultComponent } from '../../../shared/partials/empty-result/empty-result.component';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
@Component({
  selector: 'app-dashboard-api',
  imports: [FormsModule, NgForOf, NgOptimizedImage, NgIf, EmptyResultComponent, NgClass],
  animations: [fadeInDashboardItem],
  templateUrl: './dashboard-api.component.html'
})
export class DashboardApiComponent implements OnInit {
  q1 = '';
  q2 = '';
  displayQ1 = '';
  displayQ2 = '';
  loading = false;
  breachData: any | null = null;
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
  prevBreachData: any | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) { }

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

  get cryptoResult(): any | null {
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
    return this.cardsData.length > 0;
  }

  ngOnInit(): void {
    this.apiType = this.route.snapshot.data && this.route.snapshot.data['type'] ? String(this.route.snapshot.data['type']) : null;
    this.route.data.subscribe(d => {
      this.apiType = d && d['type'] ? String(d['type']) : this.apiType;
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
    let payload: any;
    if (this.apiType === 'user') {
      payload = { text: { username: this.q1, email: this.q2 } };
    }
    else if (this.apiType === 'social') {
      payload = { text: { username: this.q1 } };
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
    const endpoint = this.apiType === 'user'
      ? '/api/dynamic/user'
      : this.apiType === 'social'
        ? '/api/dynamic/social'
        : this.apiType === 'cracked'
          ? '/api/dynamic/cracked'
          : this.apiType === 'software'
            ? '/api/dynamic/software'
            : this.apiType === 'crypto'
              ? '/api/crypto/scan'
              : '/api/dynamic/';
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
          if (this.apiType === 'crypto') {
            this.responseData = res;
          }
          else {
            const normalized = (res && typeof res === 'object')
              ? ((res as any).data ?? (res as any).result ?? res)
              : res;
            this.responseData = normalized;
            this.breachData = (this.cardsData && this.cardsData.length > 0) ? this.cardsData[0] : null;
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
    return (res?.status === 'pending') || (res?.result?.status === 'busy') || (res?.result?.status === 'pending');
  }

  private isFailedPendingResponse(res: any): boolean {
    return (res?.status === 'pending' || res?.result?.status === 'pending') &&
            ((res?.result?.progress ?? res?.progress) === 0) &&
            ((res?.result?.step ?? res?.step) === 'failed');
  }

  private shouldContinuePolling(res: any): boolean {
    return this.isPendingResponse(res) && !this.isFailedPendingResponse(res);
  }
}
