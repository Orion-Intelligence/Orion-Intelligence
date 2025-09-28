import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Observable, EMPTY, of, timer} from 'rxjs';
import {catchError, expand, finalize, switchMap, takeWhile} from 'rxjs/operators';
import {EmptyResultComponent} from '../../../empty-result/empty-result.component';
import {LoadingFormComponent} from '../../../loading-form/loading-form.component';
import {EmptyQueryComponent} from '../../../empty-query/empty-query.component';
import {fadeInDashboardItem} from '../../../../animations/dashboard.item.animation';
import {CardData, SearchDynamicEmailCallbackModel} from '../../../../model/api/email/search_dynamic_email_callback_model';

@Component({
  selector: 'app-dashboard-api',
  imports: [FormsModule, NgForOf, NgOptimizedImage, NgIf, EmptyResultComponent, LoadingFormComponent, EmptyQueryComponent, NgClass],
  animations: [fadeInDashboardItem],
  templateUrl: './dashboard-api.component.html'
})
export class DashboardApiComponent implements OnInit {
  q1 = '';
  q2 = '';
  displayQ1 = '';
  displayQ2 = '';
  loading = false;
  breachData: CardData | null = null;
  query_triggered = false;
  apiType: string | null = null;
  progress = 0;
  currentStep = '';

  emailCallbackbackModel: SearchDynamicEmailCallbackModel = new SearchDynamicEmailCallbackModel();

  constructor(private route: ActivatedRoute, private http: HttpClient) {
  }

  ngOnInit(): void {
    this.apiType = this.route.snapshot.data && this.route.snapshot.data['type'] ? String(this.route.snapshot.data['type']) : null;

    this.route.data.subscribe(d => {
      this.apiType = d && d['type'] ? String(d['type']) : this.apiType;
    });

    this.route.queryParams.subscribe(params => {
      if (this.apiType === 'user') {
        if (params['username']) this.q1 = params['username'];
        if (params['email']) this.q2 = params['email'];
      } else if (this.apiType === 'social') {
        if (params['username']) this.q1 = params['username'];
        this.q2 = '';
      } else {
        if (params['q1']) this.q1 = params['q1'];
        if (params['q2']) this.q2 = params['q2'];
      }
      if (this.q1 || this.q2) this.onSearchSubmit(null);
    });
  }

  onSearchSubmit($event: SubmitEvent | null) {
    if ($event) $event.preventDefault();
    this.loading = true;
    this.emailCallbackbackModel.cards_data = [];
    this.breachData = null;
    this.progress = 0;
    this.currentStep = '';

    let payload: any;
    if (this.apiType === 'user') {
      payload = {text: {username: this.q1, email: this.q2}};
    } else if (this.apiType === 'social') {
      payload = {text: {username: this.q1}};
    } else {
      payload = {text: {q1: this.q1, q2: this.q2}};
    }

    const endpoint =
      this.apiType === 'user'
        ? '/api/dynamic/user'
        : this.apiType === 'social'
          ? '/api/dynamic/social'
          : '/api/dynamic/';

    this.query_triggered = true;
    this.fetchSearchResults(endpoint, payload).pipe(finalize(() => {
      this.loading = false;
    })).subscribe({
      next: res => {
        const pending = res?.status === 'pending' || res?.result?.status === 'busy' || res?.result?.status === 'pending';
        if (pending) {
          const p = res?.result?.progress ?? res?.progress;
          if (typeof p === 'number' && !Number.isNaN(p)) this.progress = p;
          const st = res?.result?.step ?? res?.step;
          if (typeof st === 'string' && st) this.currentStep = st;
          return;
        }
        if (Array.isArray(res?.result)) {
          (this.emailCallbackbackModel as any).cards_data = res.result;
          this.breachData = (this.emailCallbackbackModel as any).cards_data?.[0] ?? null;
          this.displayQ1 = this.q1;
          this.displayQ2 = this.q2;
          return;
        }
        if (res?.success && res?.data) {
          this.emailCallbackbackModel = res.data;
          this.breachData = res.data.cards_data?.length > 0 ? res.data.cards_data[0] : null;
          this.displayQ1 = (res.data as any)?.username ?? this.q1;
          this.displayQ2 = (res.data as any)?.email ?? this.q2;
        } else {
          const data = res as SearchDynamicEmailCallbackModel;
          if ((data as any)?.cards_data) {
            this.emailCallbackbackModel = data;
            this.breachData = (data as any).cards_data?.length > 0 ? (data as any).cards_data[0] : null;
            this.displayQ1 = this.q1;
            this.displayQ2 = this.q2;
          } else {
            this.emailCallbackbackModel = new SearchDynamicEmailCallbackModel();
            this.breachData = null;
            this.displayQ1 = '';
            this.displayQ2 = '';
          }
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private fetchSearchResults(apiEndpoint: string, paramModel: any): Observable<any> {
    return this.http.post<any>(apiEndpoint, paramModel).pipe(
      expand(res => ((res?.status === 'pending') || (res?.result?.status === 'busy') || (res?.result?.status === 'pending')) ? timer(2000).pipe(switchMap(() => this.http.post<any>(apiEndpoint, paramModel))) : EMPTY),
      takeWhile(res => (res?.status === 'pending') || (res?.result?.status === 'busy') || (res?.result?.status === 'pending'), true),
      catchError(error => {
        console.error('Search API call failed:', error);
        return of(null);
      })
    );
  }
}
