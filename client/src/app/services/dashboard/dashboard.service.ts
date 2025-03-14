import {Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {HttpParams} from '@angular/common/http';
import {catchError, map, takeUntil} from 'rxjs/operators';
import {ApiService} from '../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private cancelRequest$ = new Subject<void>();

  constructor(private apiService: ApiService) {
  }

  fetchSearchResults<T extends { Result?: any[]; cards_data?: any[] }>(apiEndpoint: string, paramModel: any): Observable<{
    success: boolean;
    isEmpty: boolean;
    data: T | null
  }> {
    this.cancelOngoingRequest();

    const params = new HttpParams({fromObject: paramModel as any});

    return this.apiService.get<T>(apiEndpoint, {params}).pipe(takeUntil(this.cancelRequest$), map((response: T) => ({
      success: true, isEmpty: (response.Result?.length === 0 || response.cards_data?.length === 0), data: response
    })), catchError(() => of({success: false, isEmpty: false, data: null})));
  }

  private cancelOngoingRequest() {
    this.cancelRequest$.next();
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

      active_links: resultItems.filter(item => {
        const daysOld = (new Date().getTime() - new Date(item.m_update_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld <= 5;
      }).length,

      seldom_active_links: resultItems.filter(item => {
        const daysOld = (new Date().getTime() - new Date(item.m_update_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > 5 && daysOld <= 10;
      }).length,

      inactive_links: resultItems.filter(item => {
        const daysOld = (new Date().getTime() - new Date(item.m_update_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > 10;
      }).length,

      consolidated_lists: {
        m_urls: resultItems.map(item => (item as any).m_url || ""),
        m_emails: resultItems.flatMap(item => (item as any).m_emails || (item as any).m_email_addresses || []),
        mPhoneNumber: resultItems.flatMap(item => (item as any).m_phone_numbers || []),
        mArchiveUrl: resultItems.flatMap(item => (item as any).m_archive_url || []),
        mName: resultItems.flatMap(item => (item as any).m_names || []),
        m_document: resultItems.flatMap(item => (item as any).m_document || [])
      }
    };
  }
}
