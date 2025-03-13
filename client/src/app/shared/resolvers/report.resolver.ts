import {Injectable} from '@angular/core';
import {Resolve, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ApiService} from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportResolver implements Resolve<any> {
  constructor(private apiService: ApiService) {
  }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const cetegory = route.parent?.url[0]?.path || '';
    const hash = route.paramMap.get('m_hash');

    let apiUrl = '';
    switch (cetegory) {
      case 'breach':
        apiUrl = hash ? `search/leak/${hash}` : `search/leak`;
        break;

      case 'strategic':
        apiUrl = hash ? `search/general/${hash}` : `search/general`;
        break;

      case 'defacement':
        apiUrl = hash ? `search/defacement/${hash}` : `search/defacement`;
        break;
    }
    return this.apiService.get<any>(apiUrl).pipe(catchError((_) => {
      return of(null);
    }));
  }
}
