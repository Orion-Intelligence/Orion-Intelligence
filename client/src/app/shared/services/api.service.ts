import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class ApiService {
  private baseUrl = '/api';

  constructor(private http: HttpClient) {
  }

  get<T>(endpoint: string, options?: { params?: { [key: string]: any }; headers?: HttpHeaders }): Observable<T> {
    let httpParams = new HttpParams();
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, encodeURIComponent(value));
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, {
      params: httpParams,
      headers: options?.headers
    });
  }

  post<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, options);
  }
}
