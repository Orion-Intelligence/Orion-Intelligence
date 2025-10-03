import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { LoadingService } from '../../shared/services/loading.service';

let activeRequests = 0;
let hideTimeout: any = null;

const GLOBAL_TIMEOUT = 150000;

export const httpInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const loadingService = inject(LoadingService);

  const token = localStorage.getItem('token');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` }, withCredentials: true })
    : req.clone({ withCredentials: true });

  if (activeRequests === 0) loadingService.show();
  activeRequests++;

  if (hideTimeout) clearTimeout(hideTimeout);

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
        return throwError(() => new HttpErrorResponse({
          error: 'Request timed out',
          status: 408,
          statusText: 'Request Timeout',
          url: req.url
        }));
      }

      if (error instanceof HttpErrorResponse && error.status === 402) {
        localStorage.clear();
        sessionStorage.clear();
        if (router.url !== '/payment') {
          router.navigate(['/payment'], { replaceUrl: true, state: { fromInterceptor: true } }).then();
        }
      }

      if (error instanceof HttpErrorResponse && error.status === 401) {
        const currentUrl = router.url;
        if (localStorage.getItem('token')) {
          localStorage.clear();
          sessionStorage.clear();
          if (currentUrl !== '/login') {
            router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } }).then();
            alert('Session timeout');
          }
        }
      }

      return throwError(() => error);
    })
  );
};
