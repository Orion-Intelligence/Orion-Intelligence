import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { AuthModel } from '../../shared/model/auth/auth.model';
import { TokenRefreshService } from './token-refresh.service';
import { HttpHeaders } from '@angular/common/http';
import { AppStorageService } from '../core/app/app-storage.service';
import { AppService } from '../core/app/app.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = new BehaviorSubject<AuthModel>({ isAuthenticated: false, isValidated: true, error: null });

  constructor(private appService: AppService, private appStorageService: AppStorageService, private apiService: ApiService, private router: Router, private tokenRefreshService: TokenRefreshService) {
    this.authState.next(this.loadAuthState());
    if (this.isAuthenticated()) {
      this.startTokenRefresh();
    }
  }

  get authState$(): Observable<AuthModel> {
    return this.authState.asObservable();
  }

  login(mail: string, password: string, isDemo: boolean = false): Observable<any> {
    if (this.appService.isMobileMode()) {
      localStorage.setItem('mobileDemo', 'true');
    }
    const body = new URLSearchParams();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let route = 'token?cookie_only=true';
    if (isDemo) {
      route = 'token/demo?cookie_only=true';
    }
    else {
      body.set('username', mail);
      body.set('password', password);
    }
    return this.apiService.post<any>(route, body.toString(), { headers }).pipe(tap({
      next: (response) => {
        if (response.twofa_required) {
          this.denyAccess('2FA required');
          return response.provisioning_uri || null;
        }
        if (!this.applyLoginResponse(response)) {
          return;
        }
      },
      error: (error) => {
        if (error?.error?.detail === 'Verification pending.') {
          this.authState.next({
            isAuthenticated: false,
            isValidated: false,
            error: 'Access denied!',
          });
        }
        else {
          this.denyAccess('Access denied!');
        }
      },
    }));
  }

  verifyTwofa(code: string, tempToken: string, _: string): Observable<any> {
    if (!tempToken) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tempToken}`,
    });
    return this.apiService.post<any>('token/2fa/verify?cookie_only=true', { code }, { headers }).pipe(tap({
      next: (response) => {
        if (!this.applyLoginResponse(response, 'Invalid 2FA code')) {
          return;
        }
      },
      error: () => {
        this.denyAccess('Invalid 2FA code');
      },
    }));
  }

  logout(): void {
    this.authState.next({
      isAuthenticated: false,
      isValidated: true,
      error: null,
    });
    this.router.navigate(['/login']).then(() => {
      this.apiService.post('logout', {}).subscribe();
      localStorage.clear();
      sessionStorage.clear();
      this.tokenRefreshService.stopTokenRefresh();
      localStorage.setItem('onboarding', String(false));
      this.appStorageService.clearStorage();
      this.appService.clearAll();
      this.appService.loadConfig().subscribe();
    });
  }

  demoLogin(): void {
    this.login('_', '_', true).subscribe(() => void 0);
  }

  signup(username: string, email: string, password: string): Observable<any> {
    return this.apiService.post('signup', { username, email, password });
  }

  signup_verification(mail: string, password: string): Observable<any> {
    return this.apiService.post('signup/verificaion', { username: mail, password });
  }

  forgotPassword(email: string): Observable<any> {
    return this.apiService.post('forgot', { email });
  }

  updatePassword(token: string, password: string): Observable<any> {
    return this.apiService.post('updatePassword', { token, password });
  }

  getIsMobileDemo(): boolean {
    return localStorage.getItem('mobileDemo') === 'true' &&
      typeof window !== 'undefined' &&
      window.innerWidth <= 900;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  getSessionStatus(): {
        isAuthenticated: boolean;
        hasSession: boolean;
        } {
    const isAuthenticated = this.isAuthenticated();
    const hasSession = !!this.appService.userSessionData().user.username &&
            !!this.appService.userSessionData().user.role &&
            !!this.appService.userSessionData().user.verificationDate;
    return { isAuthenticated, hasSession };
  }

  private denyAccess(error: string): void {
    this.clearAuthentication(error);
  }

  public clearAuthentication(error: string | null = null): void {
    this.tokenRefreshService.stopTokenRefresh();
    this.authState.next({
      isAuthenticated: false,
      isValidated: true,
      error,
    });
  }

  private setAuthenticated(): void {
    this.authState.next({
      isAuthenticated: true,
      isValidated: true,
      error: null,
    });
  }

  private loadAuthState(): AuthModel {
    const isAuthenticated = !!this.appService.userSessionData().user.username;
    return {
      isValidated: true,
      isAuthenticated,
      error: null,
    };
  }

  private startTokenRefresh(): void {
    if (this.isAuthenticated()) {
      this.tokenRefreshService.startTokenRefresh(() => this.refreshToken());
    }
  }

  refreshToken(): Observable<void> {
    if (!this.isAuthenticated()) {
      return new Observable((observer) => {
        observer.next();
        observer.complete();
      });
    }
    return this.apiService
      .post<{
            session?: any;
        }>('token/refresh?cookie_only=true', {})
      .pipe(tap((response) => {
        if (response?.session) {
          this.setAuthenticated();
        }
      }), map(() => void 0));
  }

  private applyLoginResponse(response: any, deniedMessage: string = 'Access denied!'): boolean {
    if (!response?.session) {
      this.denyAccess(deniedMessage);
      return false;
    }
    const sessionData = response?.session || {};
    if (sessionData?.role === 'crawler') {
      this.denyAccess(deniedMessage);
      return false;
    }
    this.setAuthenticated();
    this.startTokenRefresh();
    return true;
  }

  private toBool(v: any): boolean {
    if (typeof v === 'boolean') {
      return v;
    }
    if (typeof v === 'string') {
      return v === 'true';
    }
    return !!v;
  }
}
