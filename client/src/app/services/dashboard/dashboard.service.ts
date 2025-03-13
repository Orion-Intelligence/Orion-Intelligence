import {Injectable} from '@angular/core';
import {BehaviorSubject, of, Subject} from 'rxjs';
import {GeneralParamModel} from '../../shared/model/intel-results/general/general.param.model';
import {GeneralCallbackModel} from '../../shared/model/intel-results/general/general.callback.model';
import {SearchLeakParamModel} from '../../shared/model/intel-results/leak/leak.param.model';
import {LeakCallbackModel} from '../../shared/model/intel-results/leak/leak.callback.model';
import {HttpParams} from '@angular/common/http';
import {catchError, map, tap, takeUntil} from 'rxjs/operators';
import {ApiService} from '../../shared/services/api.service';
import {search_dynamic_email_param_model} from '../../shared/model/dynamic/email/search_dynamic_email_param_model';
import {SearchDynamicEmailCallbackModel} from '../../shared/model/dynamic/email/search_dynamic_email_callback_model';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  searchGeneralParamModel: GeneralParamModel = new GeneralParamModel();
  searchGeneralCallbackModel: GeneralCallbackModel = new GeneralCallbackModel();

  searchLeakParamModel: SearchLeakParamModel = new SearchLeakParamModel();
  searchLeakCallbackModel: LeakCallbackModel = new LeakCallbackModel();

  searchDynamicEmailParambackModel: search_dynamic_email_param_model = new search_dynamic_email_param_model();
  searchDynamicEmailCallbackbackModel: SearchDynamicEmailCallbackModel = new SearchDynamicEmailCallbackModel();

  searchQuery$ = new BehaviorSubject<string>('');
  private activeRequest$ = new Subject<void>();

  constructor(private apiService: ApiService, private router: Router) {
  }

  fetchDynamicEmailSearchResults() {
    this.cancelOngoingRequest();
    const params = new HttpParams({fromObject: this.searchDynamicEmailParambackModel as any});

    return this.apiService.get<SearchDynamicEmailCallbackModel>('dynamic/email', {params}).pipe(takeUntil(this.activeRequest$), tap((response: SearchDynamicEmailCallbackModel) => {
      this.searchDynamicEmailCallbackbackModel = new SearchDynamicEmailCallbackModel(response);
    }), map((response: SearchDynamicEmailCallbackModel) => ({
      success: true, isEmpty: response.cards_data?.length === 0
    })), catchError(() => of({success: false, isEmpty: false})));
  }

  fetchGeneralSearchResults() {
    this.cancelOngoingRequest();
    const params = new HttpParams({fromObject: this.searchGeneralParamModel as any});

    return this.apiService.get<GeneralCallbackModel>('search/general', {params}).pipe(takeUntil(this.activeRequest$), tap((response: GeneralCallbackModel) => {
      this.searchGeneralCallbackModel = new GeneralCallbackModel(response);
      this.updateUrlWithParams(this.searchGeneralParamModel);
    }), map((response: GeneralCallbackModel) => ({
      success: true, isEmpty: response.Result?.length === 0
    })), catchError(() => of({success: false, isEmpty: false})));
  }

  fetchLeakSearchResults() {
    this.cancelOngoingRequest();
    const params = new HttpParams({fromObject: this.searchLeakParamModel as any});

    return this.apiService.get<LeakCallbackModel>('search/leak', {params}).pipe(takeUntil(this.activeRequest$), tap(response => {
      this.searchLeakCallbackModel = new LeakCallbackModel(response);
      this.updateUrlWithParams(this.searchLeakParamModel);
    }), map((response: LeakCallbackModel) => ({
      success: true, isEmpty: response.Result?.length === 0
    })), catchError(() => of({success: false, isEmpty: false})));
  }

  updateUrlWithParams(params: any) {
    const {pSearchParamType, ...filteredParams} = params;
    this.router.navigate([], {
      queryParams: filteredParams, queryParamsHandling: 'merge', replaceUrl: true
    }).then();
  }

  private cancelOngoingRequest() {
    this.activeRequest$.next();
  }

  public parseParamValue(value: any): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value) && value !== '') return +value;
    return value;
  }
}
