import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

@Injectable({
  providedIn: 'root'
})
export class ReportResolver implements Resolve<any> {
  constructor(private apiService: ApiService, private router: Router) {}

  private adjustCategory(category_1: string, category_2: string): string {
    const specialCategories = ['warfare', 'cloud', 'email', 'logs', 'tools', 'zeroday'];
    return specialCategories.includes(category_2) ? 'social' : category_1.toLowerCase();
  }

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<any> {
    let category_1 = route.parent?.url[0]?.path || '';
    const category_2 = route.url[0]?.path || '';
    const hash = route.paramMap.get('m_hash');
    const lang = route.queryParamMap.get('lang');

    category_1 = this.adjustCategory(category_1, category_2);

    let apiUrl = '';
    switch (category_1) {
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
        if (category_2 == "twitter" || category_2 == "reddit" || category_2 == "forum")
          apiUrl = hash ? `search/social/${hash}` : `search/social`;
        else
          apiUrl = hash ? `search/chat/${hash}` : `search/chat`;
        break;
      case 'exploit':
        apiUrl = hash ? `search/exploit/${hash}` : `search/exploit`;
        break;
      case 'feed':
        apiUrl = hash ? `search/news/${hash}` : `search/news`;
        break;
      default:
        this.router.navigate(['/']).then();
        return of(null);
    }

    if (lang) {
      apiUrl += `?lang=${lang}`;
    }

    return this.apiService.get<any>(apiUrl).pipe(
      catchError((_) => {
        alert(_?.message || 'Unknown error');
        this.router.navigate(['/']).then();
        return of(null);
      })
    );
  }
}
