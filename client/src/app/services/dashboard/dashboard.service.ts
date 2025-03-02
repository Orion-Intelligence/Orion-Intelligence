import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { SearchGeneralParamModel } from '../../pages/dashboard/models/general/search_general_param_model';
import { SearchGeneralCallbackModel } from '../../pages/dashboard/models/general/search_general_callback_model';
import { SearchLeakParamModel } from '../../pages/dashboard/models/leak/search_leak_param_model';
import { SearchLeakCallbackModel } from '../../pages/dashboard/models/leak/search_leak_callback_model';
import { HttpParams } from '@angular/common/http';
import { catchError, map, tap, takeUntil } from 'rxjs/operators';
import { SelectionTracker } from '../../pages/dashboard/helper-classes/SelectionTracker';
import { search_dynamic_email_param_model } from '../../pages/dashboard/models/dynamic/email/search_dynamic_email_param_model';
import { ApiService } from '../../shared/services/api.service';
import { SearchDynamicEmailCallbackModel } from '../../pages/dashboard/models/dynamic/email/search_dynamic_email_callback_model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  searchGeneralParamModel: SearchGeneralParamModel = new SearchGeneralParamModel();
  searchGeneralCallbackModel: SearchGeneralCallbackModel = new SearchGeneralCallbackModel();

  searchDynamicEmailParambackModel: search_dynamic_email_param_model = new search_dynamic_email_param_model();
  searchDynamicEmailCallbackbackModel: SearchDynamicEmailCallbackModel = new SearchDynamicEmailCallbackModel();

  searchLeakParamModel: SearchLeakParamModel = new SearchLeakParamModel();
  searchLeakCallbackModel: SearchLeakCallbackModel = new SearchLeakCallbackModel();

  searchQuery$ = new BehaviorSubject<string>('');
  tracker: SelectionTracker = new SelectionTracker();

  private activeRequest$ = new Subject<void>();

  constructor(private apiService: ApiService) {}

  fetchGeneralSearchResults() {
    this.cancelOngoingRequest();
    const params = new HttpParams({ fromObject: this.searchGeneralParamModel as any });

    return this.apiService.get<SearchGeneralCallbackModel>('search/general', { params }).pipe(
      takeUntil(this.activeRequest$),
      tap((response: SearchGeneralCallbackModel) => {
        this.searchGeneralCallbackModel = new SearchGeneralCallbackModel(response);
      }),
      map((response: SearchGeneralCallbackModel) => ({
        success: true,
        isEmpty: response.Result?.length === 0
      })),
      catchError(() => of({ success: false, isEmpty: false }))
    );
  }

  fetchDynamicEmailSearchResults() {
    this.cancelOngoingRequest();
    const params = new HttpParams({ fromObject: this.searchDynamicEmailParambackModel as any });

    return this.apiService.get<SearchDynamicEmailCallbackModel>('dynamic/email', { params }).pipe(
      takeUntil(this.activeRequest$),
      tap((response: SearchDynamicEmailCallbackModel) => {
        this.searchDynamicEmailCallbackbackModel = new SearchDynamicEmailCallbackModel(response);
      }),
      map((response: SearchDynamicEmailCallbackModel) => ({
        success: true,
        isEmpty: response.cards_data?.length === 0
      })),
      catchError(() => of({ success: false, isEmpty: false }))
    );
  }

  fetchLeakSearchResults() {
    this.cancelOngoingRequest();
    const params = new HttpParams({ fromObject: this.searchLeakParamModel as any });

    return this.apiService.get<SearchLeakCallbackModel>('search/leak', { params }).pipe(
      takeUntil(this.activeRequest$),
      tap(response => {
        this.searchLeakCallbackModel = new SearchLeakCallbackModel(response);
      }),
      map((response: SearchLeakCallbackModel) => ({
        success: true,
        isEmpty: response.Result?.length === 0
      })),
      catchError(() => of({ success: false, isEmpty: false }))
    );
  }

  private cancelOngoingRequest() {
    this.activeRequest$.next();
  }
}
