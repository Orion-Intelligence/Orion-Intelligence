import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, TimeoutError, Subject } from 'rxjs';
import { catchError, finalize, timeout, takeUntil } from 'rxjs/operators';
import { LoadingService } from '../../shared/services/loading.service';

let activeRequests = 0;
let hideTimeout: any = null;
const inFlightCancels = new Map<string, Subject<void>>();

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

  const key = authReq.url.startsWith('api/') ? authReq.url : null;
  let cancel$: Subject<void> | null = null;
  if (key) {
    const existing = inFlightCancels.get(key);
    if (existing) {
      existing.next();
      existing.complete();
    }
    cancel$ = new Subject<void>();
    inFlightCancels.set(key, cancel$);
  }

  if (activeRequests === 0) loadingService.show();
  activeRequests++;

  if (hideTimeout) clearTimeout(hideTimeout);

  return next(authReq).pipe(
    cancel$ ? takeUntil(cancel$) : (s) => s,
    timeout<HttpEvent<any>>(GLOBAL_TIMEOUT),
    finalize(() => {
      if (key) {
        const current = inFlightCancels.get(key);
        if (current === cancel$) inFlightCancels.delete(key);
      }
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
