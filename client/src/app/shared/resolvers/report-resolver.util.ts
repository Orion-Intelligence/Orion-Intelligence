import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';

export function resolveReportDetailEndpoint(apiUrl: string | null | undefined, lang: string | null, apiService: ApiService, router: Router): Observable<unknown> {
  if (!apiUrl) {
    router.navigate(['/']).then();
    return of(null);
  }
  let url = apiUrl;
  if (lang) {
    url += `?lang=${lang}`;
  }
  return apiService.get<unknown>(url).pipe(catchError(() => {
    router.navigate(['/']).then();
    return of(null);
  }));
}
