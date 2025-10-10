import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { filter, map, Observable, take } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private router: Router, private authService: AuthService) { }

    canActivate(): Observable<boolean> {
        return this.authService.getRole$().pipe(
            filter((role): role is string => role !== null),
            take(1),
            map((role) => {
                if (role === 'profile') {
                    this.router.navigate(['dashboard/profile']);
                    return false;
                }
                return true;
            })
        );
    }

}