import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FilterTag, FilterCategory } from '../../shared/model/filter/filter.model';

@Injectable({
    providedIn: 'root',
})
export class EntityFilterService {
    private _filterCategories = new BehaviorSubject<FilterCategory[]>([]);
    public filterCategories$: Observable<FilterCategory[]> = this._filterCategories.asObservable();

    private _selectedCategoryId = new BehaviorSubject<string>('email');
    public selectedCategoryId$: Observable<string> = this._selectedCategoryId.asObservable();

    constructor() {
        this.loadStateFromLocalStorage();
    }

    updateFilterCategories(categories: FilterCategory[]): void {
        this._filterCategories.next(categories);
        this.saveStateToLocalStorage();
    }

    updateSelectedCategoryId(id: string): void {
        this._selectedCategoryId.next(id);
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
        localStorage.removeItem('appFilterCategories');
    }

    private saveStateToLocalStorage(): void {
        try {
            localStorage.setItem('appFilterCategories', JSON.stringify(this._filterCategories.getValue()));
        } catch (e) {
            console.error('Error saving filter state to localStorage', e);
        }
    }

    private loadStateFromLocalStorage(): void {
        try {
            const savedFilterCategories = localStorage.getItem('appFilterCategories');
            if (savedFilterCategories) {
                this._filterCategories.next(JSON.parse(savedFilterCategories));
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
