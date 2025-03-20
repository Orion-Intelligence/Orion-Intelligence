import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportResolver implements Resolve<any> {
  constructor(private apiService: ApiService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const category = route.parent?.url[0]?.path || '';
    const hash = route.paramMap.get('m_hash');
    const lang = route.queryParamMap.get('lang');

    let apiUrl = '';

    switch (category) {
      case 'breach':
        apiUrl = hash ? `search/leak/${hash}` : `search/leak`;
        break;
      case 'strategic':
        apiUrl = hash ? `search/general/${hash}` : `search/general`;
        break;
      case 'defacement':
        apiUrl = hash ? `search/defacement/${hash}` : `search/defacement`;
        break;
      default:
        return of(null);
    }

    if (lang) {
      apiUrl += `?lang=${lang}`;
    }

    return this.apiService.get<any>(apiUrl).pipe(
      catchError((error) => {
        console.error(`Error fetching data for category ${category} with hash ${hash}:`, error);
        return of(null);
      })
    );
  }
}
