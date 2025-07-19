import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DiscussionService {

  constructor(private api: ApiService) {}

  fetchSuggestions<T extends { Result?: any[]; cards_data?: any[] }>(
    query: string,
    type: string
  ): Observable<{ success: boolean; isEmpty: boolean; data: T | null }> {
    const params = new HttpParams()
      .set('q', query || '')
      .set('ctype', type);

    return this.api.get<T>('chat/telegram', { params }).pipe(
      map((response: T) => ({
        success: true,
        isEmpty: response.Result?.length === 0 || response.cards_data?.length === 0,
        data: response
      })),
      catchError(() => of({ success: false, isEmpty: false, data: null }))
    );
  }
}
