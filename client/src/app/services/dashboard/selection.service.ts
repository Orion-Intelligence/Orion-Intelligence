import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectionStoreService {
  private selectedSectionSubject = new BehaviorSubject<string | null>(this.getStoredSection());
  private selectedOptionSubject = new BehaviorSubject<string | null>(this.getStoredOption());

  selectedSection$ = this.selectedSectionSubject.asObservable();
  selectedOption$ = this.selectedOptionSubject.asObservable();

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

  getSelectedOption(): string | null {
    return this.selectedOptionSubject.value;
  }

  private getStoredSection(): string | null {
    return localStorage.getItem('selectedSection');
  }

  private getStoredOption(): string | null {
    return localStorage.getItem('selectedOption');
  }
}
