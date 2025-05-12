import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

import { ApiService } from '../services/api.service';
import { DumpService } from '../../services/dump/dump.service';
import {DumpCallbackModel} from '../model/dump/dump.mode';
import {dump_filters} from '../constants/filters';

@Injectable({ providedIn: 'root' })
export class DumpResolver implements Resolve<DumpCallbackModel> {
  constructor(private apiService: ApiService, private dumpService: DumpService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DumpCallbackModel> {
    const queryParams = route.queryParams;

    const validFilters: { [key: string]: string } = {};
    const filterConfig = dump_filters.filters;

    for (const key of Object.keys(filterConfig)) {
      const value = queryParams[key];
      const validOptions = filterConfig[key].options;

      if (value && validOptions.includes(value)) {
        validFilters[key] = value;
      }
    }

    let httpParams = new HttpParams();
    for (const key in validFilters) {
      httpParams = httpParams.set(key, validFilters[key]);
    }

    this.dumpService.setSelectedFilters(validFilters);

    return this.apiService.get<DumpCallbackModel>('dumps', {
      params: httpParams
    }).pipe(tap((data) => this.dumpService.setDumpData(data)));
  }
}
