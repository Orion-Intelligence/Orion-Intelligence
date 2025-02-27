import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {filters} from './filters';
import {SearchGeneralParamModel} from './models/search_general_param_model';
import {SearchGeneralCallbackModel} from './models/search_general_callback_model';
import {ApiService} from '../../shared/services/api.service';
import {Router} from '@angular/router';
import {SearchLeakParamModel} from './models/search_leak_param_model';
import {SearchLeakCallbackModel} from './models/search_leak_callback_model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  searchGeneralParamModel: SearchGeneralParamModel = new SearchGeneralParamModel();
  searchGeneralCallbackModel: SearchGeneralCallbackModel = new SearchGeneralCallbackModel();

  searchLeakParamModel: SearchLeakParamModel = new SearchLeakParamModel();
  searchLeakCallbackModel: SearchLeakCallbackModel = new SearchLeakCallbackModel();

  private searchQuerySubject = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySubject.asObservable();

  private currentPageSubject = new BehaviorSubject<string>('');
  currentPage$ = this.currentPageSubject.asObservable();

  filters: filters = new filters();

  constructor(private apiService: ApiService, private router: Router) {
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

  fetchLeakResults(): Observable<SearchLeakCallbackModel> {
    let params = new HttpParams();

    Object.keys(this.searchLeakParamModel).forEach((key) => {
      const value = (this.searchLeakParamModel as any)[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.apiService.get<SearchLeakCallbackModel>('search/leak', {params}).pipe(
      tap((response) => {
        this.searchLeakCallbackModel = new SearchLeakCallbackModel(response);
      })
    );
  }

  fetchGeneralResults(): Observable<SearchGeneralCallbackModel> {
    let params = new HttpParams();

    Object.keys(this.searchGeneralParamModel).forEach((key) => {
      const value = (this.searchGeneralParamModel as any)[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    console.log(params)
    return this.apiService.get<SearchGeneralCallbackModel>('search/general', {params}).pipe(
      tap((response) => {
        this.searchGeneralCallbackModel = new SearchGeneralCallbackModel(response);
      })
    );
  }
}
