import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ApiService} from '../services/api.service';
import {DirectoryCallbackModel} from '../model/directory/directory.model';
import {DirectoryService} from '../../services/directory/directory.service';
import {directory_filters} from '../constants/filters';
import {HttpParams} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class DirectoryResolver implements Resolve<DirectoryCallbackModel> {
  constructor(private apiService: ApiService, private directoryService: DirectoryService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DirectoryCallbackModel> {
    const queryParams = route.queryParams;

    const validFilters: Record<string, string> = {};
    const filterConfig = directory_filters.filters;

    for (const key of Object.keys(filterConfig)) {
      const value = queryParams[key];
      if (value) {
        validFilters[key] = value;
      }
    }
    let httpParams = new HttpParams();
    for (const key in validFilters) {
      httpParams = httpParams.set(key, validFilters[key]);
    }
    this.directoryService.setSelectedFilters(validFilters);

    return this.apiService.get<DirectoryCallbackModel>('directory', {
      params: httpParams
    }).pipe(tap((data) => this.directoryService.setDirectoryData(data)));
  }
}
