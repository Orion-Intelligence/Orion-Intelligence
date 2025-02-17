import { Injectable } from '@angular/core';
import {BehaviorSubject, map, Observable} from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import {AuthModel} from '../../shared/model/auth.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = new BehaviorSubject<AuthModel>({
    token: this.getStoredToken(),
    username: localStorage.getItem('username'),
    isAuthenticated: !!this.getStoredToken(),
    error: null
  });

  constructor(private apiService: ApiService, private router: Router) {}

  get authState$(): Observable<AuthModel> {
    return this.authState.asObservable();
  }

  getUsername$(): Observable<string | null> {
    return this.authState$.pipe(
      map(state => state.username)
    );
  }

  login(username: string, password: string): Observable<any> {
    return this.apiService.post<{ access_token: string }>('token', { username, password }).pipe(
      tap({
        next: (response) => {
          this.setToken(response.access_token, username);
        },
        error: () => {
          this.authState.next({ token: null, username: null, isAuthenticated: false, error: 'Invalid credentials' });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    this.authState.next({ token: null, username: null, isAuthenticated: false, error: null });
    this.router.navigate(['/login']).then();
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  private setToken(token: string, username: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    this.authState.next({ token, username, isAuthenticated: true, error: null });
  }

  private getStoredToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? token : null;
  }
}
