import {Injectable, signal} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {ApiService} from '../../shared/services/api.service';
import {LeakCallbackModel} from '../../shared/model/results/leak/leak.callback.model';
import {GeneralCallbackModel} from '../../shared/model/results/general/general.callback.model';
import {ChatCallbackModel} from '../../shared/model/results/chat/chat.callback.model';
import {ExploitCallbackModel} from '../../shared/model/results/exploit/exploit.callback.model';
import {ConsolidatedCallbackModel} from '../../shared/model/results/consolidated/consolidated.callback.model';
import {StealerLogCallbackModel,} from '../../shared/model/results/credentials/credential.callback.model';
import {SocialCallbackModel} from '../../shared/model/results/social/social.callback.model';
import {FilterCategory} from '../../shared/model/filter/filter.model';
import {EntityFilterService} from '../entityFilter/entity.filter.service';
import {ConsolidatedParamModel} from '../../shared/model/results/consolidated/consolidated.param.model';
import {DefacementCallbackModel} from '../../shared/model/results/defacement/defacement.callback.model';
import {HelperService} from '../../shared/services/helper.service';
import {ActivatedRoute, Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

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

  private cancelRequest$ = new Subject<void>();

  constructor(private router: Router, private route: ActivatedRoute, private helperService: HelperService, private apiService: ApiService, private entityFilterService: EntityFilterService) {
  }

  fetchSearchResults<T extends { Result?: any[]; cards_data?: any[] }>(apiEndpoint: string, paramModel: any): Observable<{ success: boolean; isEmpty: boolean; data: T | null }> {

    this.cancelOngoingRequest();
    const currentFilterCategories: FilterCategory[] = this.entityFilterService.getCurrentFilterCategories();

    const categoriesWithTags = currentFilterCategories.filter(
      category => category.tags && category.tags.length > 0
    );

    const formattedFiltersForApi = categoriesWithTags.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      tags: category.tags.map(tag => tag.value),
    }));

    let baseParams: any = {...paramModel};
    baseParams = this.helperService.removeEmptyOrNullValues(baseParams)

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: baseParams,
      queryParamsHandling: '',
      replaceUrl: true
    }).then();

    if (formattedFiltersForApi.length > 0) {
      baseParams['filters_json'] = JSON.stringify(formattedFiltersForApi);
    }
    const params = new HttpParams({fromObject: baseParams});

    return this.apiService.get<T>(apiEndpoint, {params}).pipe(
      takeUntil(this.cancelRequest$),
      map((response: T) => ({
        success: true,
        isEmpty: response.Result?.length === 0 || response.cards_data?.length === 0,
        data: response
      })),
      catchError((error) => {
        console.error('Search API call failed:', error);
        return of({success: false, isEmpty: false, data: null});
      })
    );
  }

  fetchConsolidatedRankededResults(apiEndpoint: string, paramModel: any): Observable<{ success: boolean; isEmpty: boolean; data: any[] | null; }> {
    this.cancelOngoingRequest();

    let baseParams: any = {...paramModel};
    baseParams = this.helperService.removeEmptyOrNullValues(baseParams)
    const params = new HttpParams({fromObject: baseParams});
    console.log(params)

    return this.apiService.get<any[]>(apiEndpoint, {params}).pipe(
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

  fetchConsolidatedGroupedResults(apiEndpoint: string, paramModel: any): Observable<{ success: boolean; isEmpty: boolean; data: ConsolidatedCallbackModel | null }> {
    this.cancelOngoingRequest();

    const currentFilterCategories: FilterCategory[] = this.entityFilterService.getCurrentFilterCategories();

    const categoriesWithTags = currentFilterCategories.filter(
      category => category.tags && category.tags.length > 0
    );

    const formattedFiltersForApi = categoriesWithTags.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      tags: category.tags.map(tag => tag.value),
    }));

    let baseParams: any = {...paramModel};
    baseParams = this.helperService.removeEmptyOrNullValues(baseParams)

    if (formattedFiltersForApi.length > 0) {
      baseParams['filters_json'] = JSON.stringify(formattedFiltersForApi);
    }
    const params = new HttpParams({fromObject: baseParams});

    return this.apiService.get<ConsolidatedCallbackModel>(apiEndpoint, {params}).pipe(
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

  resetParams() {
    this.consolidatedParamModel.reset()
  }

  private cancelOngoingRequest() {
    this.cancelRequest$.next();
  }
}
