import { Injectable } from '@angular/core';
import {Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import { DashboardService } from '../../services/dashboard/dashboard.service';
import { Category, GeneralSubCategory } from '../../pages/dashboard/enums/pages';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<boolean> {
  constructor(private dashboardService: DashboardService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const queryParam = route.queryParams['q'];

    if (queryParam) {
      this.dashboardService.searchGeneralParamModel.q = queryParam;
      this.dashboardService.searchQuery$.next(queryParam);
      this.dashboardService.tracker.setSection(Category.GENERAL_INTELLIGENCE);
      this.dashboardService.tracker.setOption(GeneralSubCategory.ALL);
    }else {
      this.router.navigate(['/']).then();
      return false;
    }

    return true;
  }
}
