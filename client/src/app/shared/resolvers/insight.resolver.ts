import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { InsightCallbackModel } from '../model/homepage/stats_insight.model';

@Injectable({ providedIn: 'root' })
export class InsightResolver implements Resolve<InsightCallbackModel> {
  private cache$?: Observable<InsightCallbackModel>;

  constructor(private apiService: ApiService) {}

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<InsightCallbackModel> {
    if (!this.cache$) {
      this.cache$ = this.apiService.get<InsightCallbackModel>('insight').pipe(shareReplay(1));
    }
    return this.cache$;
  }
}
