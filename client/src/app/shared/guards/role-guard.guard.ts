import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private router: Router, private authService: AuthService) { }

    canActivate(): boolean {
        if (this.authService.getRole() === 'profile') {
            this.router.navigate(['dashboard/profile']);
        } else {
            return true;
        }

        return false;
    }
}