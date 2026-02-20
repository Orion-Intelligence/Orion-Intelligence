import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LicenseService } from '../../services/licenses/licenses.service';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../services/authetication/auth.service';
import { AppService } from '../../services/core/app/app.service';
@Injectable({
  providedIn: 'root'
})
export class LicenseGuard implements CanActivate {
  constructor(private appService: AppService, private router: Router, private licenseService: LicenseService) { }

  canActivate(): Observable<boolean> {
    return this.licenseService.loadLicenses().pipe(map(() => {
      const role = this.appService.userSessionData().user.role;
      if (role == "member" || role == "admin") {
        return true;
      }
      this.router.navigate(['dashboard/strategic']).then();
      return false;
    }));
  }
}
