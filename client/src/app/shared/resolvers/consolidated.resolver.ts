import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ApiService} from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportConsolidatedResolver implements Resolve<any> {
  constructor(private apiService: ApiService, private router: Router) {
  }

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<any> {
    const index = route.queryParamMap.get('ci') || '';
    const hash = route.paramMap.get('m_hash');
    const lang = route.queryParamMap.get('lang');

    let category = index.replace('_model', '').toLowerCase();
    let apiUrl = '';

    switch (category) {
      case 'leak':
      case 'tracking':
      case 'news':
        apiUrl = hash ? `search/breach/${hash}` : `search/breach`;
        break;
      case 'defacement':
        apiUrl = hash ? `search/defacement/${hash}` : `search/defacement`;
        break;
      case 'general':
        apiUrl = hash ? `search/strategic/${hash}` : `search/strategic`;
        break;
      case 'exploit':
        apiUrl = hash ? `search/exploit/${hash}` : `search/exploit`;
        break;
      case 'social':
        apiUrl = hash ? `search/social/${hash}` : `search/chat`;
        break;
      case 'chat':
        apiUrl = hash ? `search/chat/${hash}` : `search/chat`;
        break;
      case 'credential':
        apiUrl = hash ? `search/chat/${hash}` : `search/chat`;
        break;
      default:
        this.router.navigate(['/']).then();
        return of(null);
    }

    if (lang) {
      apiUrl += `?lang=${lang}`;
    }

    return this.apiService.get<any>(apiUrl).pipe(
      catchError((err) => {
        alert(err?.message || 'Unknown error');
        this.router.navigate(['/']).then();
        return of(null);
      })
    );
  }
}
