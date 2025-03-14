import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SelectionStoreService {
  private selectedSectionSubject = new BehaviorSubject<string | null>(this.getStoredSection());
  private selectedOptionSubject = new BehaviorSubject<string | null>(this.getStoredOption());

  selectedSection$ = this.selectedSectionSubject.asObservable();

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (!event.url.startsWith('/dashboard')) {
          this.resetSelection();
        }
      });
  }

  setSelectedSection(section: string) {
    this.selectedSectionSubject.next(section);
    this.selectedOptionSubject.next(null);
    localStorage.setItem('selectedSection', section);
  }

  setSelectedOption(option: string) {
    this.selectedOptionSubject.next(option);
    localStorage.setItem('selectedOption', option);
  }

  getSelectedSection(): string | null {
    return this.selectedSectionSubject.value;
  }

  private getStoredSection(): string | null {
    return localStorage.getItem('selectedSection');
  }

  private getStoredOption(): string | null {
    return localStorage.getItem('selectedOption');
  }

  private resetSelection() {
    this.selectedSectionSubject.next(null);
    this.selectedOptionSubject.next(null);
    localStorage.removeItem('selectedSection');
    localStorage.removeItem('selectedOption');
  }
}
