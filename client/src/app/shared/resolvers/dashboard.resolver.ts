import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DashboardResolver implements Resolve<boolean> {
  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {

    return true;
  }
}
