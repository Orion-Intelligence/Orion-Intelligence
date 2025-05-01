import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TestService {
    private baseUrl = 'http://localhost:8080/api/test'; // change if backend runs on a different domain/port

    constructor(private http: HttpClient) { }

    saveMessage(sampleData: { message: string; }) {
        const data = { message: 'Hello from Angular!' };
        return this.http.post(`${this.baseUrl}/save`, data)
            .pipe(catchError(error => throwError(() => error)));
    }

    searchMessages() {
        return this.http.get(`${this.baseUrl}/search`)
            .pipe(catchError(error => throwError(() => error)));
    }

    getHelloWorld(): Observable<any> {
        return this.http.get(`${this.baseUrl}/text`);
    }
}
