import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {AuthService} from '../authetication/auth.service';
import {LoadingService} from '../../shared/services/loading.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);

  const token = authService.getToken();

  if (!token) {
    console.warn("⚠️ No authentication token found! You may need to log in.");
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  loadingService.show();

  return next(authReq).pipe(
    finalize(() => loadingService.hide()),
    catchError((error: HttpErrorResponse) => {
      console.error("❌ HTTP Error Occurred:", error.status, error.message);

      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } }).then();
      }

      return throwError(() => error);
    })
  );
};
