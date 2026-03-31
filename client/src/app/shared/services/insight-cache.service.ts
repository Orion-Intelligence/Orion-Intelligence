import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class InsightCacheService {
  private insight$?: Observable<any>;

  constructor(private apiService: ApiService) {}

  getInsight(): Observable<any> {
    if (!this.insight$) {
      this.insight$ = this.apiService.get<any>('insight').pipe(shareReplay(1));
    }
    return this.insight$;
  }
}
