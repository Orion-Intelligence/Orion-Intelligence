import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { AuthModel } from '../../shared/model/auth/auth.model';
import { TokenRefreshService } from './token-refresh.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = new BehaviorSubject<AuthModel>(this.loadAuthState());

  constructor(private apiService: ApiService, private router: Router, private tokenRefreshService: TokenRefreshService) {
    if (this.isAuthenticated()) {
      this.startTokenRefresh();
    }
  }

  get authState$(): Observable<AuthModel> {
    return this.authState.asObservable();
  }

  getUsername$(): Observable<string | null> {
    return this.authState$.pipe(map((state) => state.username));
  }

  getRole$(): Observable<string | null> {
    return this.authState$.pipe(map((state) => state.role));
  }

  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this.apiService.post<any>('token', body.toString(), { headers }).pipe(
      tap({
        next: (response) => {
          if (response.twofa_required) {
            this.authState.next({
              token: null,
              username,
              role: null,
              isAuthenticated: false,
              onboarding: null,
              error: '2FA required'
            });
            return response.provisioning_uri || null;
          }

          if (response.role === 'crawler') {
            this.authState.next({
              token: null,
              username: null,
              role: null,
              isAuthenticated: false,
              onboarding: null,
              error: 'Access denied!'
            });
            return;
          }
          if (response.role === 'admin' || response.role === 'demo') {
            localStorage.setItem('role', response.role);
            this.setToken(response.access_token, username, response.role);
            this.startTokenRefresh();
            this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
          }
          else {
            switch (response.status) {
              case 'verification_pending':
                this.authState.next({
                  token: null,
                  username: null,
                  role: null,
                  isAuthenticated: false,
                  onboarding: null,
                  error: 'Account under verification'
                });
                break;

              case 'onboarding':
                this.setToken(response.access_token, username, response.role);
                this.startTokenRefresh();
                this.router.navigate(['/onboarding']).then();
                break;

              case 'active':
                this.setToken(response.access_token, username, response.role, response.hasOnboarding);
                this.startTokenRefresh();
                this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
                break;

              default:
                this.authState.next({
                  token: null,
                  username: null,
                  role: null,
                  isAuthenticated: false,
                  onboarding: 'false',
                  error: 'Unknown account status'
                });
                break;
            }
          }
        },
        error: (_) => {
          this.authState.next({
            token: null,
            username: null,
            role: null,
            isAuthenticated: false,
            error: 'Access denied!',
            onboarding: null,
          });
        }
      })
    );
  }

  verifyTwofa(code: string, tempToken: string, username: string): Observable<any> {
    if (!tempToken) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tempToken}`
    });

    return this.apiService.post<any>('token/2fa/verify', { code }, { headers }).pipe(
      tap({
        next: (res) => {
          if (res?.access_token) {
            this.setToken(res.access_token, username, res.role, res.hasOnboarding);
            this.startTokenRefresh();
          } else {
            this.authState.next({
              token: null, username, role: null, isAuthenticated: false, onboarding: null, error: 'Invalid 2FA code'
            });
          }
        },
        error: (_) => {
          this.authState.next({
            token: null, username, role: null, isAuthenticated: false, onboarding: null, error: 'Invalid 2FA code'
          });
        }
      })
    );
  }


  logout(): void {
    this.apiService.post('logout', {}).subscribe();
    localStorage.clear();
    sessionStorage.clear();

    this.authState.next({
      token: null, username: null, role: null, isAuthenticated: false, onboarding: null, error: null
    });
    this.tokenRefreshService.stopTokenRefresh();

    this.router.navigate(['/login']).then();
  }

  signup(username: string, email: string, password: string): Observable<any> {
    return this.apiService.post('signup', { username, email, password });
  }
  forgotPassword(email: string): Observable<any> {
    return this.apiService.post('forgot', { email });
  }
  updatePassword(token: string, password: string): Observable<any> {
    return this.apiService.post('updatePassword', { token, password });
  }
  getToken(): string | null {
    return this.getStoredToken();
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
  getOnboardingStatus(): boolean {
    return localStorage.getItem('onboarding') === 'true';
  }
  getUsername(): string {
    return localStorage.getItem('username') ?? '';
  }
  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
  setOnboarding(value: boolean): void {
    localStorage.setItem('onboarding', String(value));
  }

  private setToken(token: string, username: string, role: string, hasOnboarding?: boolean): void {
    this.authState.next({
      token, username, role, isAuthenticated: true, onboarding: String(hasOnboarding), error: null
    });
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    if (hasOnboarding !== undefined)
      this.setOnboarding(hasOnboarding)
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  private loadAuthState(): AuthModel {
    const token = this.getStoredToken();
    return {
      token,
      username: localStorage.getItem('username'),
      role: localStorage.getItem('role'),
      isAuthenticated: !!token,
      onboarding: localStorage.getItem('onboarding'),
      error: null
    };
  }

  private startTokenRefresh(): void {
    if (this.isAuthenticated()) {
      this.tokenRefreshService.startTokenRefresh(() => this.refreshToken());
    }
  }

  refreshToken(): Observable<string | null> {
    const currentToken = this.getStoredToken();
    if (!currentToken) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    return this.apiService.post<{
      hasOnboarding: boolean;
      access_token: string;
      role: string
    }>('token/refresh', { token: currentToken }, { headers: new HttpHeaders({ 'Authorization': `Bearer ${currentToken}` }) }).pipe(tap((response) => {
      if (response) {
        this.setToken(response.access_token, localStorage.getItem('username') || '', response.role, response.hasOnboarding);
      }
    }), map((response) => response?.access_token || null));
  }
}
