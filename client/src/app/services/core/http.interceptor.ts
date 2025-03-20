import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../authetication/auth.service';
import { LoadingService } from '../../shared/services/loading.service';

let activeRequests = 0;

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);
  const token = authService.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  if (activeRequests === 0) {
    loadingService.show();
  }
  activeRequests++;

  return next(authReq).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingService.hide();
      }
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (authService.isAuthenticated()) {
          router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } }).then();
          authService.logout();
          alert("Session timeout");
        }
      }
      return throwError(() => error);
    })
  );
};
