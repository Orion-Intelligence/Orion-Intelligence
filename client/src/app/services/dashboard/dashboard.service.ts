import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {filters} from './filters';
import {SearchGeneralParamModel} from './models/search_general_param_model';
import {SearchGeneralCallbackModel} from './models/search_general_callback_model';
import {ApiService} from '../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  searchGeneralParamModel: SearchGeneralParamModel = new SearchGeneralParamModel();
  searchGeneralCallbackModel: SearchGeneralCallbackModel = new SearchGeneralCallbackModel();

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private currentPageSubject = new BehaviorSubject<string>('');
  currentPage$ = this.currentPageSubject.asObservable();

  filters: filters = new filters();

  constructor(private apiService: ApiService) {
  }

  setSearchQuery(query: string) {
    this.searchQuerySubject.next(query);
  }

  setCurrentPage(page: string) {
    this.currentPageSubject.next(page);
  }

  updatePage(page: string) {
    this.setCurrentPage(page);
  }

  fetchSearchResults(): Observable<SearchGeneralCallbackModel> {
    const params = new HttpParams({fromObject: this.searchGeneralParamModel as any});

    return this.apiService.get<SearchGeneralCallbackModel>('search/general', {params}).pipe(
      tap((response) => {
        this.searchGeneralCallbackModel = new SearchGeneralCallbackModel(response);
      })
    );
  }
}
