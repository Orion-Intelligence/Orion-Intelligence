import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private cache?: Record<string, string[]>;

  constructor(private http: HttpClient) {
  }

  loadSuggestions(): Observable<Record<string, string[]>> {
    if (this.cache) {
      return of(this.cache);
    }
    return this.http.get<Record<string, string[]>>('assets/data/entities_data/entity_filter_suggestions.json')
      .pipe(tap(data => this.cache = data));
  }
}
