import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest
} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {throwError, Observable, TimeoutError} from 'rxjs';
import {catchError, finalize, timeout} from 'rxjs/operators';
import {AuthService} from '../authetication/auth.service';
import {LoadingService} from '../../shared/services/loading.service';

let activeRequests = 0;
let hideTimeout: any = null;

const GLOBAL_TIMEOUT = 150000;

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
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

  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }

  return next(authReq).pipe(
    timeout<HttpEvent<any>>(GLOBAL_TIMEOUT),
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        hideTimeout = setTimeout(() => {
          loadingService.hide();
          hideTimeout = null;
        }, 1000);
      }
    }),
    catchError((error: any) => {
      if (error instanceof TimeoutError) {
        console.error('Request timed out:', req.url);
        return throwError(() => new HttpErrorResponse({
          error: 'Request timed out',
          status: 408,
          statusText: 'Request Timeout',
          url: req.url
        }));
      }

      if (error instanceof HttpErrorResponse && error.status === 401) {
        if (authService.isAuthenticated()) {
          router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } }).then();
          authService.logout();
          alert('Session timeout');
        }
      }

      return throwError(() => error);
    })
  );
};
