import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FilterCategory } from '../../shared/model/filter/filter.model';

@Injectable({
  providedIn: 'root',
})
export class EntityFilterService {
  private _filterCategories = new BehaviorSubject<FilterCategory[]>([]);
  private _selectedCategoryId = new BehaviorSubject<string>('email');
  public filterCategories$: Observable<FilterCategory[]> = this._filterCategories.asObservable();

  constructor() {
    this.loadStateFromLocalStorage();
  }

  updateFilterCategories(categories: FilterCategory[]): void {
    this._filterCategories.next(categories);
    this.saveStateToLocalStorage();
  }

  updateSelectedCategoryId(id: string): void {
    this._selectedCategoryId.next(id);
    this.saveStateToLocalStorage();
  }

  getCurrentFilterCategories(): FilterCategory[] {
    return this._filterCategories.getValue();
  }

  getCurrentSelectedCategoryId(): string {
    return this._selectedCategoryId.getValue();
  }

  clearPersistedState(): void {
    this._filterCategories.next([]);
    this._selectedCategoryId.next('email');
    this.saveStateToLocalStorage();

    localStorage.removeItem('appFilterCategories');
  }

  private saveStateToLocalStorage(): void {
    try {
      const state = {
        categories: this._filterCategories.getValue(),
        selectedCategoryId: this._selectedCategoryId.getValue()
      };
      localStorage.setItem('appFilterCategories', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving filter state to localStorage', e);
    }
  }

  private loadStateFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('appFilterCategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.categories) {
          this._filterCategories.next(parsed.categories);
        }
        if (parsed.selectedCategoryId) {
          this._selectedCategoryId.next(parsed.selectedCategoryId);
        }
      }
    } catch (e) {
      console.error('Error loading filter state from localStorage', e);
      localStorage.removeItem('appFilterCategories');
    }
  }

  initializeFilterCategories(defaultCategories: FilterCategory[]): void {
    const currentCategories = this._filterCategories.getValue();
    if (!currentCategories || currentCategories.length === 0) {
      this._filterCategories.next(defaultCategories);
      this.saveStateToLocalStorage();
    }
  }

  getNonEmptyCategoryCount(): number {
    return this._filterCategories.getValue().filter(category => category.tags.length > 0).length;
  }
}
