import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../authetication/auth.service';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  console.log("🚀 Interceptor Executed! Request URL:", req.url); // ✅ Log first thing to check if it's running

  const router = inject(Router);
  const authService = inject(AuthService);

  const token = authService.getToken();
  console.log("🔑 Retrieved Token:", token); // ✅ Log token value

  if (!token) {
    console.warn("⚠️ No authentication token found! You may need to log in.");
  }

  // Clone request and add Authorization header if token exists
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  console.log("📩 Modified Request Headers:", authReq.headers.get('Authorization')); // ✅ Log headers

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error("❌ HTTP Error Occurred:", error.status, error.message);

      if (error.status === 401) {
        alert("Session expired! Redirecting to login...");
        authService.logout();
        router.navigate(['/login'], { queryParams: { sessionExpired: 'true' } }).then();
      }

      return throwError(() => error);
    })
  );
};
