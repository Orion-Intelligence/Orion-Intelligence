import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, TimeoutError, Subject } from 'rxjs';
import { catchError, finalize, timeout, takeUntil } from 'rxjs/operators';
import { LoadingService } from '../../shared/services/loading.service';
import { MessageNotificationService } from '../message_notification/message-notification.service';
import { AuthService } from '../authetication/auth.service';
let activeRequests = 0;
let hideTimeout: any = null;
const inFlightCancels = new Map<string, Subject<void>>();
const GLOBAL_TIMEOUT = 150000;
const STATUS_MEANINGS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  408: 'Request Timeout',
  409: 'Conflict',
  424: 'Mail Configuration Failed',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};
export const httpInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const loadingService = inject(LoadingService);
  const msg = inject(MessageNotificationService);
  const injector = inject(Injector);
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
  if (activeRequests === 0) {
    loadingService.show();
  }
  activeRequests++;
  if (hideTimeout) {
    clearTimeout(hideTimeout);
  }
  return next(authReq).pipe(cancel$ ? takeUntil(cancel$) : (s) => s, timeout<HttpEvent<any>>(GLOBAL_TIMEOUT), finalize(() => {
    if (key) {
      const current = inFlightCancels.get(key);
      if (current === cancel$) {
        inFlightCancels.delete(key);
      }
    }
    activeRequests--;
    if (activeRequests === 0) {
      hideTimeout = setTimeout(() => {
        loadingService.hide();
        hideTimeout = null;
      }, 1000);
    }
  }), catchError((error: unknown) => {
    const authService = injector.get(AuthService, null);
    if (authService?.isAuthenticated()) {
      if (error instanceof HttpErrorResponse && authReq.url.includes('api/search')) {
        const detail = typeof error.error === 'object' ? String((error.error as any)?.detail || '') : '';
        if (error.status === 404 && /document not found/i.test(detail)) {
          msg.show('Report Expired');
          return throwError(() => error);
        }
      }
      if (error instanceof HttpErrorResponse && error.status === 0) {
        msg.show('Cannot connect to server');
        return throwError(() => error);
      }
      let message = STATUS_MEANINGS[(error as any).status] || 'Error';
      if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
        const keys = Object.keys(error.error);
        if (keys.length === 1) {
          message = `${(error.error as any)[keys[0]]}`;
        }
      }
      const silentLogoutMessages = new Set([
        'Token has expired',
        'Logged out due to multiple active sessions',
      ]);
      const isSilentLogout = silentLogoutMessages.has(message);
      const isPublicCaseShareRequest = error instanceof HttpErrorResponse && authReq.url.includes('public/case-shares/');
      if (error instanceof HttpErrorResponse && !isPublicCaseShareRequest && error.status !== 400 && error.status !== 409 && error.status !== 424 && error.status !== 429) {
        localStorage.clear();
        sessionStorage.clear();
        router.navigate(['/login']).then();
      }
      if (isSilentLogout) {
        msg.show(message);
      }
    }
    else if (error instanceof HttpErrorResponse && error.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      router.navigate(['/login']).then();
    }
    if (error instanceof TimeoutError) {
      return throwError(() => new HttpErrorResponse({
        error: 'Request timed out',
        status: 408,
        statusText: 'Request Timeout',
        url: (error as any).url,
      }));
    }
    return throwError(() => error);
  }));
};
