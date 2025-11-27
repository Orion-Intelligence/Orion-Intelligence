import { Injectable, signal } from '@angular/core';
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
  private username = signal<string>('');
  private role = signal<string | null>(null);
  private onboarding = signal<boolean>(false);
  private subscription = signal<boolean>(false);
  private verificationDate = signal<string>('');
  private licenses = signal<string[]>([]);

  private authState = new BehaviorSubject<AuthModel>(this.loadAuthState());

  constructor(private appService: AppService, private appStorageService: AppStorageService, private apiService: ApiService, private router: Router, private tokenRefreshService: TokenRefreshService) {
    if (this.isAuthenticated()) {
      const needsSession = !this.username() && !this.role() && !this.verificationDate();
      if (needsSession) this.refreshToken().subscribe();
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

  login(username: string, password: string, isDemo:boolean=false): Observable<any> {
    if(this.appService.isMobileMode()){
      localStorage.setItem('mobileDemo', 'true');
    }

    const body = new URLSearchParams();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    let route = 'token'
    if(isDemo){
      route = 'token/demo'
    }else {
      body.set('username', username);
      body.set('password', password);
    }

    return this.apiService.post<any>(route, body.toString(), { headers }).pipe(
      tap({
        next: (response) => {
          if (response.twofa_required) {
            this.authState.next({ token: null, username, role: null, isAuthenticated: false, onboarding: null, error: '2FA required' });
            return response.provisioning_uri || null;
          }

          if (!response?.access_token) {
            this.authState.next({ token: null, username: null, role: null, isAuthenticated: false, onboarding: null, error: 'Access denied!' });
            return;
          }

          const sessionData = response?.session || {};
          if (sessionData?.role === 'crawler') {
            this.authState.next({ token: null, username: null, role: null, isAuthenticated: false, onboarding: null, error: 'Access denied!' });
            return;
          }

          this.username.set(sessionData?.username ?? username ?? '');
          this.role.set(sessionData?.role ?? null);
          this.onboarding.set(this.toBool(sessionData?.hasOnboarding ?? sessionData?.onboarding));
          this.subscription.set(this.toBool(sessionData?.subscription));
          this.verificationDate.set(sessionData?.verificationDate ?? '');
          this.licenses.set(sessionData?.licenses ?? []);

          this.setToken(response.access_token);
          this.startTokenRefresh();
          this.router.navigate(['/dashboard'], { replaceUrl: true }).then();
        },
        error: () => {
          this.authState.next({ token: null, username: null, role: null, isAuthenticated: false, error: 'Access denied!', onboarding: null });
        }
      })
    );
  }

  verifyTwofa(code: string, tempToken: string, username: string): Observable<any> {
    if (!tempToken) return new Observable(observer => {
      observer.next(null);
      observer.complete();
    });

    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${tempToken}` });
    return this.apiService.post<any>('token/2fa/verify', { code }, { headers }).pipe(
      tap({
        next: (response) => {
          if (!response?.access_token) {
            this.authState.next({ token: null, username, role: null, isAuthenticated: false, onboarding: null, error: 'Invalid 2FA code' });
            return;
          }

          const sessionData = response?.session || {};
          if (sessionData?.role === 'crawler') {
            this.authState.next({ token: null, username: null, role: null, isAuthenticated: false, onboarding: null, error: 'Access denied!' });
            return;
          }

          this.username.set(sessionData?.username ?? username ?? '');
          this.role.set(sessionData?.role ?? null);
          this.onboarding.set(this.toBool(sessionData?.hasOnboarding ?? sessionData?.onboarding));
          this.subscription.set(this.toBool(sessionData?.subscription));
          this.verificationDate.set(sessionData?.verificationDate ?? '');
          this.licenses.set(sessionData?.licenses ?? []);

          this.setToken(response.access_token);
          this.startTokenRefresh();
        },
        error: () => {
          this.authState.next({ token: null, username, role: null, isAuthenticated: false, onboarding: null, error: 'Invalid 2FA code' });
        }
      })
    );
  }

  logout(): void {
    this.apiService.post('logout', {}).subscribe();
    localStorage.clear();
    sessionStorage.clear();
    this.username.set('');
    this.role.set(null);
    this.onboarding.set(false);
    this.subscription.set(false);
    this.verificationDate.set('');
    this.licenses.set([]);
    this.authState.next({ token: null, username: null, role: null, isAuthenticated: false, onboarding: null, error: null, licenses: [] });
    this.tokenRefreshService.stopTokenRefresh();
    this.router.navigate(['/login']).then();
    this.appStorageService.clearStorage()
    this.appService.clearAll()
  }

  demoLogin(): void {
    this.login("_", "_", true).subscribe(async (res) => { });
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

  getRole(): string | null {
    return this.role();
  }

  getOnboardingStatus(): boolean {
    return this.onboarding();
  }

  getUsername(): string {
    return this.username();
  }

  getSubscriptionStatus(): boolean {
    return this.subscription();
  }

  getVerificationDate(): string {
    return this.verificationDate();
  }

  getLicenses(): string[] {
    return this.licenses();
  }

  getIsMobileDemo(): boolean {
    return localStorage.getItem('mobileDemo') === 'true';
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  getSessionStatus(): { isAuthenticated: boolean; hasSession: boolean } {
    const isAuthenticated = !!this.getStoredToken();
    const hasSession =
      !!this.username() || !!this.role() || !!this.verificationDate();
    return { isAuthenticated, hasSession };
  }

  setOnboarding(value: boolean): void {
    this.onboarding.set(value);
  }

  private setToken(token: string): void {
    localStorage.setItem('token', token);
    this.authState.next({ token, username: this.username(), role: this.role(), isAuthenticated: true, onboarding: String(this.onboarding()), error: null, licenses: this.licenses(), });
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  private loadAuthState(): AuthModel {
    const token = this.getStoredToken();
    return { token, username: this.username(), role: this.role(), isAuthenticated: !!token, onboarding: String(this.onboarding()), error: null, licenses: this.licenses() };
  }

  private startTokenRefresh(): void {
    if (this.isAuthenticated()) this.tokenRefreshService.startTokenRefresh(() => this.refreshToken());
  }

  refreshToken(): Observable<string | null> {
    const currentToken = this.getStoredToken();
    if (!currentToken) return new Observable(observer => {
      observer.next(null);
      observer.complete();
    });

    return this.apiService.post<{ access_token: string, session?: any }>(
      'token/refresh',
      { token: currentToken },
      { headers: new HttpHeaders({ 'Authorization': `Bearer ${currentToken}` }) }
    ).pipe(
      tap((response) => {
        if (response?.session) {
          const sessionData = response.session;
          this.username.set(sessionData?.username ?? this.username());
          this.role.set(sessionData?.role ?? this.role());
          this.onboarding.set(this.toBool(sessionData?.hasOnboarding ?? sessionData?.onboarding ?? this.onboarding()));
          this.subscription.set(this.toBool(sessionData?.subscription ?? this.subscription()));
          this.verificationDate.set(sessionData?.verificationDate ?? this.verificationDate());
          this.licenses.set(sessionData?.licenses ?? []);
        }
        if (response?.access_token) this.setToken(response.access_token);
      }),
      map((response) => response?.access_token || null)
    );
  }

  private toBool(v: any): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v === 'true';
    return !!v;
  }
}
