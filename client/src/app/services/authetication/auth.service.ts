import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { AuthCallbackModel } from '../../shared/model/callback/authCallbackModel';
import { TokenRefreshService } from './token-refresh.service';
import {HttpHeaders} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = new BehaviorSubject<AuthCallbackModel>(this.loadAuthState());

  constructor(
    private apiService: ApiService,
    private router: Router,
    private tokenRefreshService: TokenRefreshService
  ) {
    if (this.isAuthenticated()) {
      this.startTokenRefresh();
    }
  }

  get authState$(): Observable<AuthCallbackModel> {
    return this.authState.asObservable();
  }

  getUsername$(): Observable<string | null> {
    return this.authState$.pipe(map((state) => state.username));
  }

  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    return this.apiService.post<{ access_token: string }>('token', body.toString(), { headers }).pipe(
      tap({
        next: (response) => {
          this.setToken(response.access_token, username);
          this.startTokenRefresh();
        },
        error: () => {
          this.authState.next({ token: null, username: null, isAuthenticated: false, error: 'Invalid credentials' });
        },
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.authState.next({ token: null, username: null, isAuthenticated: false, error: null });
    this.tokenRefreshService.stopTokenRefresh();
    this.router.navigate(['/login']).then();
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  private setToken(token: string, username: string): void {
    this.authState.next({ token, username, isAuthenticated: true, error: null });
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  private loadAuthState(): AuthCallbackModel {
    const token = this.getStoredToken();
    return {
      token,
      username: localStorage.getItem('username'),
      isAuthenticated: !!token,
      error: null
    };
  }

  private startTokenRefresh(): void {
    if (this.isAuthenticated()) {
      this.tokenRefreshService.startTokenRefresh(() => this.refreshToken());
    }
  }

  private refreshToken(): Observable<string | null> {
    return this.tokenRefreshService.refreshToken().pipe(
      tap((newToken) => {
        if (newToken) {
          this.setToken(newToken, localStorage.getItem('username') || '');
        }
      })
    );
  }
}
