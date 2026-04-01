import { Injectable, signal } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { LeakCallbackModel } from '../../shared/model/results/leak/leak.callback.model';
import { GeneralCallbackModel } from '../../shared/model/results/general/general.callback.model';
import { ChatCallbackModel } from '../../shared/model/results/chat/chat.callback.model';
import { ExploitCallbackModel } from '../../shared/model/results/exploit/exploit.callback.model';
import { ConsolidatedCallbackModel } from '../../shared/model/results/consolidated/consolidated.callback.model';
import { StealerLogCallbackModel } from '../../shared/model/results/credentials/credential.callback.model';
import { SocialCallbackModel } from '../../shared/model/results/social/social.callback.model';
import { ConsolidatedParamModel } from '../../shared/model/results/consolidated/consolidated.param.model';
import { DefacementCallbackModel } from '../../shared/model/results/defacement/defacement.callback.model';
import { HelperService } from '../../shared/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from '../core/app/app.service';
import { RankedCallbackModel } from '../../shared/model/results/consolidated/ranked.callback.model';
import { PasswordSchemaFilter } from '../../shared/model/stealerlogs-filter/stealerlogs-filters';
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private cancelRequest$ = new Subject<void>();

  m_current_route = "";
  rankedResult: RankedCallbackModel = new RankedCallbackModel();
  consolidatedParamModel: ConsolidatedParamModel = new ConsolidatedParamModel();
  generalCallbackModel: GeneralCallbackModel = new GeneralCallbackModel();
  chatCallbackModel: ChatCallbackModel = new ChatCallbackModel();
  defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();
  exploitCallbackModel: ExploitCallbackModel = new ExploitCallbackModel();
  leakCallbackModel: LeakCallbackModel = new LeakCallbackModel();
  stealerlogCallbackModel: StealerLogCallbackModel = new StealerLogCallbackModel();
  consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  socialCallbackModel: SocialCallbackModel = new SocialCallbackModel();
  showSubscription = signal<boolean>(false);
  selectedFilters = signal<Record<string, string | null>>({});
  passwordSchemeFilter: PasswordSchemaFilter = { minLength: null, maxLength: null, hasAlphabets: false, hasNumbers: false, hasSpecialChars: false };

  constructor(private router: Router, private route: ActivatedRoute, private helperService: HelperService, private apiService: ApiService, private app_service: AppService) {
    this.initializeSideFilters();
  }

  fetchSearchResults<T extends {
        Result?: any[];
        cards_data?: any[];
    }>(apiEndpoint: string, paramModel: any, semantic = ""): Observable<{
        success: boolean;
        isEmpty: boolean;
        data: T | null;
    }> {
    const route: string = this.router.url.split('?')[0];
    this.m_current_route = String(route);
    this.cancelOngoingRequest();
    paramModel.page = this.consolidatedParamModel.page;
    let baseParams: any = { ...paramModel, ...this.selectedFilters() };
    this.syncQueryParamsToUrl(baseParams);
    const entityCategories = this.app_service.configData().localSettings.entityfilterCategories;
    if (semantic) {
      baseParams['matchtype'] = semantic;
    }
    else {
      baseParams['matchtype'] = this.app_service.configData().localSettings.matchType;
    }
    baseParams = this.helperService.removeEmptyOrNullValues(baseParams);
    baseParams['must'] = this.app_service.configData().localSettings.entityFilterCondition;
    this.syncQueryParamsToUrl(baseParams);
    if (entityCategories) {
      baseParams['entity_filter'] = Object.fromEntries(Object.entries(entityCategories).filter(([_, v]) => Array.isArray(v) ? v.length > 0 : true));
    }
    const passwordScheme = this.passwordSchemeFilter;
    if (passwordScheme && Object.values(passwordScheme).some(v => v !== null && v !== false)) {
      baseParams['password_schema'] = passwordScheme;
    }
    this.passwordSchemeFilter = {
      minLength: null,
      maxLength: null,
      hasAlphabets: false,
      hasNumbers: false,
      hasSpecialChars: false
    };
    return this.apiService.post<T>(apiEndpoint, baseParams).pipe(takeUntil(this.cancelRequest$), map((response: T) => ({
      success: true,
      isEmpty: response.Result?.length === 0 || response.cards_data?.length === 0,
      data: response
    })), catchError((_) => {
      return of({ success: false, isEmpty: false, data: null });
    }));
  }

  fetchConsolidatedRankededResults(apiEndpoint: string, paramModel: any): Observable<{
        success: boolean;
        isEmpty: boolean;
        data: RankedCallbackModel | null;
    }> {
    const { entityCategories, mergedParams } = this.beginRequestWithMergedParams(paramModel);
    let baseParams: any = mergedParams;
    baseParams = this.applyEntityFilter(baseParams, entityCategories);
    baseParams = this.helperService.removeEmptyOrNullValues(baseParams);
    baseParams['must'] = this.app_service.configData().localSettings.entityFilterCondition;
    let match_type = this.app_service.configData().localSettings.matchType;
    baseParams['matchtype'] = match_type ? match_type : this.app_service.configData().localSettings.matchType;
    this.syncQueryParamsToUrl(baseParams);
    return this.apiService.post<any>(apiEndpoint, baseParams).pipe(takeUntil(this.cancelRequest$), map((response: any) => {
      const hasAnyResults = Array.isArray(response?.Result) && response.Result.length > 0;
      return {
        success: true,
        isEmpty: !hasAnyResults,
        data: hasAnyResults ? new RankedCallbackModel({
          result: response.Result,
          pageCount: response.Page_Count,
          totalHits: response.Total_Hits
        }) : null
      };
    }), catchError(() => of({ success: false, isEmpty: false, data: null })));
  }

  fetchConsolidatedGroupedResults(apiEndpoint: string, paramModel: any): Observable<{
        success: boolean;
        isEmpty: boolean;
        data: ConsolidatedCallbackModel | null;
    }> {
    const { entityCategories, mergedParams } = this.beginRequestWithMergedParams(paramModel);
    let payload: any = mergedParams;
    payload = this.applyEntityFilter(payload, entityCategories);
    payload = this.helperService.removeEmptyOrNullValues(payload);
    payload['must'] = this.app_service.configData().localSettings.entityFilterCondition;
    this.syncQueryParamsToUrl(payload);
    return this.apiService.post<ConsolidatedCallbackModel>(apiEndpoint, payload).pipe(takeUntil(this.cancelRequest$), map((response: ConsolidatedCallbackModel) => {
      const hasAnyResults = !!(response?.leak_model?.Result?.length ||
                response?.exploit_model?.Result?.length ||
                response?.chat_model?.Result?.length ||
                response?.generic_model?.Result?.length ||
                response?.defacement_model?.Result?.length);
      return {
        success: true,
        isEmpty: !hasAnyResults,
        data: response
      };
    }), catchError(() => of({ success: false, isEmpty: false, data: null })));
  }

  generateAnalytics<T extends {
        m_update_date: string;
    }>(resultItems: T[]): any {
    if (!resultItems) {
      return null;
    }
    return {
      unique_urls: resultItems.length,
      total_p_document_list_length: resultItems.length,
      m_documents_length: resultItems.length,
      m_clearnet_links_count: resultItems.reduce((sum, item) => sum + ((item as any).m_clearnet_links?.length || 0), 0),
      active_links: resultItems.filter(item => (new Date().getTime() - new Date(item.m_update_date).getTime()) / (1000 * 60 * 60 * 24) <= 5).length,
      seldom_active_links: resultItems.filter(item => {
        const daysOld = (new Date().getTime() - new Date(item.m_update_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > 5 && daysOld <= 10;
      }).length,
      inactive_links: resultItems.filter(item => (new Date().getTime() - new Date(item.m_update_date).getTime()) / (1000 * 60 * 60 * 24) > 10).length,
      consolidated_lists: (() => {
        const consolidated: Record<string, string[]> = {};
        resultItems.forEach(item => {
          const typedItem = item as any;
          Object.entries(typedItem).forEach(([key, value]) => {
            if (Array.isArray(value) && value.every(v => typeof v === 'string') && value.length > 0) {
              const filteredValue = value.filter(v => v !== "");
              if (filteredValue.length > 0) {
                consolidated[key] = Array.from(new Set([...(consolidated[key] ?? []), ...filteredValue]));
              }
            }
            else if (typeof value === 'string' && key !== 'm_update_date' && value !== "") {
              consolidated[key] = Array.from(new Set([...(consolidated[key] ?? []), value]));
            }
          });
        });
        return consolidated;
      })()
    };
  }

  private initializeSideFilters() {
    const allowedKeys = [
      "source",
      "daterange",
      "status",
      "network",
      "index",
      "content_type",
      "safe",
      "content",
      "mitre"
    ];
    const params = new URLSearchParams(window.location.search);
    const selected: Record<string, string | null> = {};
    params.forEach((value, key) => {
      if (allowedKeys.includes(key)) {
        selected[key] = value === 'all' || value === '' ? null : value;
      }
    });
    this.selectedFilters.set(selected);
  }

  resetParams() {
    this.consolidatedParamModel.reset();
    this.selectedFilters.set({});
    this.m_current_route = "";
  }

  clearResultCaches(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('dashboard-results-cache|')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => { sessionStorage.removeItem(key); });
  }

  private cancelOngoingRequest() { return; }

  private beginRequestWithMergedParams(paramModel: any): {
        entityCategories: any;
        mergedParams: any;
    } {
    this.cancelOngoingRequest();
    const route: string = this.router.url.split('?')[0];
    this.m_current_route = String(route);
    const entityCategories = this.app_service.configData().localSettings.entityfilterCategories;
    const mergedParams: any = { ...paramModel, ...this.selectedFilters() };
    return { entityCategories, mergedParams };
  }

  private applyEntityFilter(params: any, entityCategories: any): any {
    if (entityCategories) {
      params['entity_filter'] = Object.fromEntries(Object.entries(entityCategories).filter(([_, v]) => (Array.isArray(v) ? v.length > 0 : true)));
    }
    return params;
  }

  private syncQueryParamsToUrl(params: any): void {
    const queryParamsForNav = { ...params };
    delete queryParamsForNav['entity_filter'];
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsForNav,
      replaceUrl: true
    }).then();
  }

  clearCallback(): void {
    this.rankedResult = new RankedCallbackModel();
    this.generalCallbackModel = new GeneralCallbackModel();
    this.chatCallbackModel = new ChatCallbackModel();
    this.defacementCallbackModel = new DefacementCallbackModel();
    this.exploitCallbackModel = new ExploitCallbackModel();
    this.leakCallbackModel = new LeakCallbackModel();
    this.stealerlogCallbackModel = new StealerLogCallbackModel();
    this.consolidatedCallbackModel = new ConsolidatedCallbackModel();
    this.socialCallbackModel = new SocialCallbackModel();
  }
}
