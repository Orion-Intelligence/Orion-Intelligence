import {Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {ApiService} from '../../shared/services/api.service';
import {LeakCallbackModel} from '../../shared/model/results/leak/leak.callback.model';
import {GeneralCallbackModel} from '../../shared/model/results/general/general.callback.model';
import {GeneralParamModel} from '../../shared/model/results/shared/general.param.model';
import {ChatCallbackModel} from '../../shared/model/results/chat/chat.callback.model';
import {DefacementCallbackModel} from '../../shared/model/results/defacement/defacement.param.model';
import {ActivatedRoute, Router} from '@angular/router';
import {ExploitCallbackModel} from '../../shared/model/results/exploit/exploit.callback.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  generalParamModel: GeneralParamModel = new GeneralParamModel();
  generalCallbackModel: GeneralCallbackModel = new GeneralCallbackModel();
  chatCallbackModel: ChatCallbackModel = new ChatCallbackModel();
  exploitCallbackModel: ExploitCallbackModel = new ExploitCallbackModel();
  leakCallbackModel: LeakCallbackModel = new LeakCallbackModel();
  defacementCallbackModel: DefacementCallbackModel = new DefacementCallbackModel();

  private cancelRequest$ = new Subject<void>();

  constructor(private apiService: ApiService, private router: Router, private route: ActivatedRoute) {
  }

  fetchSearchResults<T extends {
    Result?: any[];
    cards_data?: any[]
  }>(apiEndpoint: string, paramModel: any): Observable<{
    success: boolean; isEmpty: boolean; data: T | null
  }> {
    this.cancelOngoingRequest();

    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: paramModel,
    //   queryParamsHandling: 'merge'
    // });

    const params = new HttpParams({fromObject: paramModel as any});

    return this.apiService.get<T>(apiEndpoint, {params}).pipe(
      takeUntil(this.cancelRequest$),
      map((response: T) => ({
        success: true,
        isEmpty: response.Result?.length === 0 || response.cards_data?.length === 0,
        data: response
      })),
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

  private cancelOngoingRequest() {
    this.cancelRequest$.next();
  }
}
