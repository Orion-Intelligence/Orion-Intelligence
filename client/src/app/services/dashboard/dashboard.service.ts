import {Injectable, signal} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {ApiService} from '../../shared/services/api.service';
import {LeakCallbackModel} from '../../shared/model/results/leak/leak.callback.model';
import {GeneralCallbackModel} from '../../shared/model/results/general/general.callback.model';
import {ChatCallbackModel} from '../../shared/model/results/chat/chat.callback.model';
import {ExploitCallbackModel} from '../../shared/model/results/exploit/exploit.callback.model';
import {ConsolidatedCallbackModel} from '../../shared/model/results/consolidated/consolidated.callback.model';
import {StealerLogCallbackModel} from '../../shared/model/results/credentials/credential.callback.model';
import {SocialCallbackModel} from '../../shared/model/results/social/social.callback.model';
import {ConsolidatedParamModel} from '../../shared/model/results/consolidated/consolidated.param.model';
import {DefacementCallbackModel} from '../../shared/model/results/defacement/defacement.callback.model';
import {HelperService} from '../../shared/services/helper.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AppService} from '../core/app/app.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  m_current_route = "";

  rankedResult: any[] = [];

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

  private cancelRequest$ = new Subject<void>();

  constructor(private router: Router, private route: ActivatedRoute, private helperService: HelperService, private apiService: ApiService, private app_service: AppService) {
    this.initializeSideFilters()
  }

  fetchSearchResults<T extends { Result?: any[]; cards_data?: any[] }>(
    apiEndpoint: string,
    paramModel: any,
    semantic = ""
  ): Observable<{ success: boolean; isEmpty: boolean; data: T | null }> {
    const route: string = this.router.url.split('?')[0];
    this.m_current_route = String(route);

    this.cancelOngoingRequest();

    paramModel.page = this.consolidatedParamModel.page
    let baseParams: any = {...paramModel, ...this.selectedFilters()};

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: baseParams,
      replaceUrl: true
    }).then();

    const entityCategories = this.app_service.configData().localSettings.entityfilterCategories;
    if (semantic) {
      baseParams['matchtype'] = semantic;
    } else {
      baseParams['matchtype'] = this.app_service.configData().localSettings.matchType;
    }

    baseParams = this.helperService.removeEmptyOrNullValues(baseParams);
    baseParams['must'] = this.app_service.configData().localSettings.entityFilterCondition;
    const queryParamsForNav = {...baseParams};
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsForNav,
      replaceUrl: true
    }).then();

    if (entityCategories) {
      baseParams['entity_filter'] = Object.fromEntries(Object.entries(entityCategories).filter(([_, v]) => Array.isArray(v) ? v.length > 0 : true));
    }

    return this.apiService.post<T>(apiEndpoint, baseParams).pipe(
      takeUntil(this.cancelRequest$),
      map((response: T) => ({
        success: true,
        isEmpty:
          response.Result?.length === 0 || response.cards_data?.length === 0,
        data: response
      })),
      catchError((error) => {
        console.error('Search API call failed:', error);
        return of({success: false, isEmpty: false, data: null});
      })
    );
  }

  fetchConsolidatedRankededResults(
    apiEndpoint: string,
    paramModel: any
  ): Observable<{ success: boolean; isEmpty: boolean; data: any[] | null }> {
    this.cancelOngoingRequest();
    const route: string = this.router.url.split('?')[0];
    this.m_current_route = String(route);

    const entityCategories = this.app_service.configData().localSettings.entityfilterCategories;

    let baseParams: any = {...paramModel, ...this.selectedFilters()};
    baseParams['must'] = this.app_service.configData().localSettings.entityFilterCondition;
    if (entityCategories) {
      baseParams['entity_filter'] = Object.fromEntries(Object.entries(entityCategories).filter(([_, v]) => Array.isArray(v) ? v.length > 0 : true));
    }
    baseParams = this.helperService.removeEmptyOrNullValues(baseParams);

    let match_type = this.app_service.configData().localSettings.matchType
    if (match_type) {
      baseParams['matchtype'] = match_type;
    } else {
      baseParams['matchtype'] = this.app_service.configData().localSettings.matchType;
    }

    const queryParamsForNav = {...baseParams};
    delete queryParamsForNav['entity_filter'];
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsForNav,
      replaceUrl: true
    }).then();

    return this.apiService.post<any[]>(apiEndpoint, baseParams).pipe(
      takeUntil(this.cancelRequest$),
      map((response: any[]) => {
        const hasAnyResults = Array.isArray(response) && response.length > 0;
        return {
          success: true,
          isEmpty: !hasAnyResults,
          data: hasAnyResults ? response : null
        };
      }),
      catchError(() => of({success: false, isEmpty: false, data: null}))
    );
  }

  fetchConsolidatedGroupedResults(
    apiEndpoint: string,
    paramModel: any
  ): Observable<{ success: boolean; isEmpty: boolean; data: ConsolidatedCallbackModel | null }> {
    this.cancelOngoingRequest();
    const route: string = this.router.url.split('?')[0];
    this.m_current_route = String(route);

    const entityCategories = this.app_service.configData().localSettings.entityfilterCategories;

    let payload: any = {...paramModel, ...this.selectedFilters()};
    payload['must'] = this.app_service.configData().localSettings.entityFilterCondition;

    if (entityCategories) {
      payload['entity_filter'] = Object.fromEntries(Object.entries(entityCategories).filter(([_, v]) => Array.isArray(v) ? v.length > 0 : true));
    }
    payload = this.helperService.removeEmptyOrNullValues(payload);

    const queryParamsForNav = {...payload};
    delete queryParamsForNav['entity_filter'];


    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParamsForNav,
      replaceUrl: true
    }).then();

    return this.apiService.post<ConsolidatedCallbackModel>(apiEndpoint, payload).pipe(
      takeUntil(this.cancelRequest$),
      map((response: ConsolidatedCallbackModel) => {
        const hasAnyResults = !!(
          response?.leak_model?.Result?.length ||
          response?.exploit_model?.Result?.length ||
          response?.chat_model?.Result?.length ||
          response?.generic_model?.Result?.length ||
          response?.defacement_model?.Result?.length
        );

        return {
          success: true,
          isEmpty: !hasAnyResults,
          data: response
        };
      }),
      catchError(() => of({success: false, isEmpty: false, data: null}))
    );
  }

  generateAnalytics<T extends { m_update_date: string }>(resultItems: T[]): any {
    if (!resultItems) {
      console.warn("No data available in Result");
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
            } else if (typeof value === 'string' && key !== 'm_update_date' && value !== "") {
              consolidated[key] = Array.from(new Set([...(consolidated[key] ?? []), value]));
            }
          });
        });
        return consolidated;
      })()
    };
  }

  private initializeSideFilters() {
    let excludedKeys = Object.keys(new ConsolidatedParamModel());
    const params = new URLSearchParams(window.location.search);
    const selected: Record<string, string | null> = {};
    excludedKeys.push("ci")

    params.forEach((value, key) => {
      if (!excludedKeys.includes(key)) {
        selected[key] = value === 'all' || value === '' ? null : value;
      }
    });

    this.selectedFilters.set(selected);
  }

  resetParams() {
    this.consolidatedParamModel.reset();
    this.selectedFilters.set({})
    this.m_current_route = ""
  }

  private cancelOngoingRequest() {
    this.cancelRequest$.next();
  }

  clearCallback(): void {
    this.rankedResult = [];
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
