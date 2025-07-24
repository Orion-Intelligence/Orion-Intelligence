import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {ApiService} from '../services/api.service';
import {InsightCallbackModel} from '../model/homepage/insight.model';

@Injectable({providedIn: 'root'})
export class InsightResolver implements Resolve<any> {
  constructor(private apiService: ApiService) {
  }

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<InsightCallbackModel> {
    return this.apiService.get<InsightCallbackModel>('insight');
  }
}
