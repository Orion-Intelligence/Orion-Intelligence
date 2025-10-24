import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, of, timer, forkJoin } from 'rxjs';
import { catchError, expand, filter, map, switchMap, takeWhile } from 'rxjs/operators';
import { SearchDynamicEmailCallbackModel } from '../model/api/email/search_dynamic_email_callback_model';
import { ConsolidatedLiveApis } from '../model/results/consolidated/consolidated.callback.model';
import { ConsolidatedLiveApiResults } from '../model/results/consolidated/consolidated.callback.model';
import { ConsolidatedScanResults } from '../model/results/consolidated/consolidated.callback.model';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class ConsolidatedApiService {

    constructor(private http: HttpClient, private apiService: ApiService) {
    }

    private getLiveApiDetails(input: ConsolidatedLiveApis): { apiEndpoint: string, payload: any } {
        let payload: any;
        let endpoint: string;

        switch (input.type) {
            case 'user':
                endpoint = '/api/dynamic/user';
                payload = { text: { username: input.q1, email: input.q2 } };
                break;
            case 'social':
                endpoint = '/api/dynamic/social';
                payload = { text: { username: input.q1 } };
                break;
            case 'cracked':
                endpoint = '/api/dynamic/cracked';
                payload = { text: { playstore: input.q1 } };
                break;
            default:
                endpoint = '/api/dynamic/';
                payload = { text: { q1: input.q1, q2: input.q2 } };
                break;
        }
        return { apiEndpoint: endpoint, payload };
    }

    private fetchLiveApiResults(input: ConsolidatedLiveApis): Observable<any> {
        const { apiEndpoint, payload } = this.getLiveApiDetails(input);

        return this.http.post<any>(apiEndpoint, payload).pipe(
            expand(res => {
                const isPending = (res?.status === 'pending') || (res?.result?.status === 'busy') || (res?.result?.status === 'pending');
                const isFailedPending =
                    (res?.status === 'pending' || res?.result?.status === 'pending') &&
                    ((res?.result?.progress ?? res?.progress) === 0) &&
                    ((res?.result?.step ?? res?.step) === 'failed');

                return isPending && !isFailedPending
                    ? timer(2000).pipe(switchMap(() => this.http.post<any>(apiEndpoint, payload)))
                    : EMPTY;
            }),
            takeWhile(res => {
                const isPending = (res?.status === 'pending') || (res?.result?.status === 'busy') || (res?.result?.status === 'pending');
                const isFailedPending =
                    (res?.status === 'pending' || res?.result?.status === 'pending') &&
                    ((res?.result?.progress ?? res?.progress) === 0) &&
                    ((res?.result?.step ?? res?.step) === 'failed');
                return isPending && !isFailedPending;
            }, true),
            catchError(error => {
                return new Observable(observer => observer.error(error));
            })
        );
    }
    public runLiveApiSearch(inputs: ConsolidatedLiveApis[]): Observable<ConsolidatedLiveApiResults[]> {
        const searchObservables = inputs.map(input =>
            this.fetchLiveApiResults(input).pipe(
                map(res => {
                    let data: SearchDynamicEmailCallbackModel | null = null;
                    if (Array.isArray(res?.result)) {
                        data = { cards_data: res.result } as SearchDynamicEmailCallbackModel;
                    } else if (res?.success && res?.data) {
                        data = res.data;
                    } else if ((res as SearchDynamicEmailCallbackModel)?.cards_data) {
                        data = res as SearchDynamicEmailCallbackModel;
                    }
                    return {
                        input,
                        status: data && data.cards_data?.length ? 'success' : 'error',
                        resultData: data,
                        errorMessage: null,
                    } as ConsolidatedLiveApiResults;
                }),
                catchError(error => of({
                    input,
                    status: 'error',
                    resultData: null,
                    errorMessage: 'API request failed or data not found.',
                } as ConsolidatedLiveApiResults))
            )
        );

        return forkJoin(searchObservables);
    }

    public scanDomain(domain: string): Observable<ConsolidatedScanResults> {
        return this.apiService
            .post<any>('urlscan/domain', { domain, scanType: 'basic' })
            .pipe(
                expand((res) => {
                    const isPending = res?.status === 'pending' || res?.step === 'queued' || res?.result?.status === 'pending';
                    if (isPending) {
                        return timer(5000).pipe(
                            switchMap(() =>
                                this.apiService.post<any>('urlscan/domain', { domain, scanType: 'basic' })
                            )
                        );
                    }
                    return EMPTY;
                }),
                takeWhile(
                    (res) => res?.status === 'pending' || res?.step === 'queued' || res?.result?.status === 'pending',
                    true
                ),
                map((res) => {
                    if (!res || res?.status === 'pending' || res?.step === 'queued') {
                        return null;
                    }
                    const meta = res?.result?.meta ?? null;
                    const grade = res?.result?.grade ?? res?.result?.meta?.grade ?? '—';

                    return { domain, meta, grade, hasError: false, errorMessage: '' } as ConsolidatedScanResults;
                }),
                filter((res): res is ConsolidatedScanResults => res !== null),

                catchError((err) => {
                    return of({
                        domain,
                        meta: null,
                        grade: '—',
                        hasError: true,
                        errorMessage: err?.error?.detail || 'Failed to scan domain.',
                    } as ConsolidatedScanResults);
                })
            );
    }

}