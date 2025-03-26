import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap, map} from 'rxjs';
import {ApiService} from '../../shared/services/api.service';
import {Router} from '@angular/router';
import {AuthModel} from '../../shared/model/auth/auth.model';
import {TokenRefreshService} from './token-refresh.service';
import {HttpHeaders} from '@angular/common/http';

@Injectable({providedIn: 'root'})
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

    const headers = new HttpHeaders({'Content-Type': 'application/x-www-form-urlencoded'});

    return this.apiService.post<{ access_token: string; role: string }>('token', body.toString(), {headers}).pipe(tap({
      next: (response) => {
        this.setToken(response.access_token, username, response.role);
        this.startTokenRefresh();
      }, error: () => {
        this.authState.next({
          token: null, username: null, role: null, isAuthenticated: false, error: 'Invalid credentials'
        });
      },
    }));
  }

  logout(): void {
    this.apiService.post('logout', {}).subscribe();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');

    this.authState.next({
      token: null, username: null, role: null, isAuthenticated: false, error: null
    });
    this.tokenRefreshService.stopTokenRefresh();

    this.router.navigate(['/login']).then();
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  private setToken(token: string, username: string, role: string): void {
    this.authState.next({
      token, username, role, isAuthenticated: true, error: null
    });
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  private loadAuthState(): AuthModel {
    const token = this.getStoredToken();
    return {
      token, username: localStorage.getItem('username'), role: localStorage.getItem('role'), isAuthenticated: !!token, error: null
    };
  }

  private startTokenRefresh(): void {
    if (this.isAuthenticated()) {
      this.tokenRefreshService.startTokenRefresh(() => this.refreshToken());
    }
  }

  private refreshToken(): Observable<string | null> {
    const currentToken = this.getStoredToken();
    if (!currentToken) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    return this.apiService.post<{access_token: string; role: string}>('refresh-token', {token: currentToken}, {headers: new HttpHeaders({'Authorization': `Bearer ${currentToken}`})}).pipe(tap((response) => {
      if (response) {
        this.setToken(response.access_token, localStorage.getItem('username') || '', response.role);
      }
    }), map((response) => response?.access_token || null));
  }
}
