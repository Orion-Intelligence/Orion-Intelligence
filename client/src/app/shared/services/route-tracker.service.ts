import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
@Injectable({ providedIn: 'root' })
export class RouteTrackerService {
    private currentPageSubject = new BehaviorSubject<string>('');
    constructor(private router: Router) {
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd), map((event: NavigationEnd) => event.urlAfterRedirects.split('#')[0]))
            .subscribe(cleanUrl => {
            this.currentPageSubject.next(cleanUrl);
        });
    }
}
