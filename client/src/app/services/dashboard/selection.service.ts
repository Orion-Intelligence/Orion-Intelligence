import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectionStoreService {
  private selectedSectionSubject = new BehaviorSubject<string | null>(null);
  private selectedOptionSubject = new BehaviorSubject<string | null>(null);

  selectedSection$ = this.selectedSectionSubject.asObservable();
  selectedOption$ = this.selectedOptionSubject.asObservable();

  setSelectedSection(section: string) {
    this.selectedSectionSubject.next(section);
    this.selectedOptionSubject.next(null); // Reset option when section changes
  }

  setSelectedOption(option: string) {
    this.selectedOptionSubject.next(option);
  }

  getSelectedSection(): string | null {
    return this.selectedSectionSubject.value;
  }

  getSelectedOption(): string | null {
    return this.selectedOptionSubject.value;
  }
}
