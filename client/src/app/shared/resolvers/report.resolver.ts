import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportResolver implements Resolve<any> {
  constructor(private apiService: ApiService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    const category = route.parent?.url[0]?.path || '';
    const hash = route.paramMap.get('m_hash');
    const lang = route.queryParamMap.get('lang');

    let apiUrl = '';

    switch (category) {
      case 'breach':
        apiUrl = hash ? `search/breach/${hash}` : `search/breach`;
        break;
      case 'strategic':
        apiUrl = hash ? `search/strategic/${hash}` : `search/strategic`;
        break;
      case 'defacement':
        apiUrl = hash ? `search/defacement/${hash}` : `search/defacement`;
        break;
      case 'social':
        apiUrl = hash ? `search/chat/${hash}` : `search/chat`;
        break;
      case 'exploit':
        apiUrl = hash ? `search/exploit/${hash}` : `search/exploit`;
        break;
      default:
        this.router.navigate(['/']);
        return of(null);
    }

    if (lang) {
      apiUrl += `?lang=${lang}`;
    }

    return this.apiService.get<any>(apiUrl).pipe(
      catchError((_) => {
        this.router.navigate(['/']).then();
        return of(null);
      })
    );
  }
}
