import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { ReportRouteUtil } from '../utils/report-route.util';
import { resolveReportDetailEndpoint } from './report-resolver.util';
@Injectable({
  providedIn: 'root'
})
export class ReportResolver implements Resolve<unknown> {
  constructor(private apiService: ApiService, private router: Router) {
  }

  resolve(route: ActivatedRouteSnapshot): Observable<unknown> {
    const category_1 = route.parent?.url[0]?.path ?? '';
    const category_2 = route.url[0]?.path || '';
    const hash = route.paramMap.get('m_hash');
    const lang = route.queryParamMap.get('lang');
    const apiUrl = ReportRouteUtil.getReportDetailEndpointForRoute(category_1, category_2, hash);
    return resolveReportDetailEndpoint(apiUrl, lang, this.apiService, this.router);
  }
}
