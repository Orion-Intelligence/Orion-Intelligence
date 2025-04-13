import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SelectionStoreService {
  private selectedSectionSubject = new BehaviorSubject<string | null>(null);
  private selectedOptionSubject = new BehaviorSubject<string | null>(null);

  selectedSection$ = this.selectedSectionSubject.asObservable();
  selectedOption$ = this.selectedOptionSubject.asObservable();

  constructor(private router: Router) {
    this.setInitialSelectionFromUrl(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (event.url.startsWith('/dashboard')) {
          this.setInitialSelectionFromUrl(event.url);
        } else {
          this.resetSelection();
        }
      });
  }

  private setInitialSelectionFromUrl(url: string) {
    const pathOnly = url.split('?')[0].split('#')[0];
    const match = pathOnly.match(/^\/dashboard\/([^\/]+)(?:\/([^\/]+)?)?$/);

    if (match) {
      const section = match[1];
      const option = match[2];

      if (!option && section !== 'home' && section !== 'directory') {
        return;
      }
      const capitalizedSection = section.charAt(0).toUpperCase() + section.slice(1);
      this.setSelectedSection(capitalizedSection);

      if (option) {
        const capitalizedOption = option.charAt(0).toUpperCase() + option.slice(1);
        this.setSelectedOption(capitalizedOption);
      } else {
        this.setSelectedOption('');
      }
    }
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

  private resetSelection() {
    this.selectedSectionSubject.next(null);
    this.selectedOptionSubject.next(null);
    localStorage.removeItem('selectedSection');
    localStorage.removeItem('selectedOption');
  }
}
