import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SuggestionService {
    constructor(private http: HttpClient) { }

    loadSuggestions() {
        return this.http.get<Record<string, string[]>>('assets/data/entity_filter_suggestions.json');
    }
}