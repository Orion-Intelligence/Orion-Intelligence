import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import {ApiService} from '../services/api.service';
import {InsightData} from '../model/insight';

@Injectable({ providedIn: 'root' })
export class InsightResolver implements Resolve<any> {
  constructor(private apiService: ApiService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<InsightData> {
    return this.apiService.get<InsightData>('insight');
  }
}
